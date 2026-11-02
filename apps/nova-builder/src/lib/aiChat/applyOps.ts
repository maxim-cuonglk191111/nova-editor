"use client";
// Applies the operations of an accepted proposal as ONE transaction, so Apply is one undo step
// (Ctrl+Z) and one sync payload to the canvas. Every operation is checked against the document
// again here: the answer was validated on the server against what the client sent, but the page
// may have changed since.
import type { WSCompositionResult } from "@studio/ai";
import type { EditOp } from "@studio/ai";
import { $instances } from "@/lib/data-stores";
import { $selectedPage } from "@/lib/nano-states";
import { updateData } from "@/lib/transactions";
import { compositionBreakpoints, mergeComposition } from "@/lib/applyWSComposition";
import { uid } from "@/lib/uid";

type Draft = Parameters<Parameters<typeof updateData>[0]>[0];
type Child = { type: "id" | "text"; value: string };
type Inst = { id: string; component: string; label?: string; children: Child[] };
type Src = { id: string; type: string };
type Sel = { instanceId: string; values: string[] };
type AnyProp = { id: string; instanceId: string; name: string; type: string; value: unknown };

export type ApplyResult = { applied: number; skipped: number };

/** An inserted section never brings a second h1 to the page. */
export function demoteH1(composition: WSCompositionResult): WSCompositionResult {
  const headings = new Set(composition.instances.filter((i) => i.component === "Heading").map((i) => i.id));
  return {
    ...composition,
    props: composition.props.map((p) => (p.name === "tag" && p.value === "h1" && headings.has(p.instanceId) ? { ...p, value: "h2" } : p)),
  };
}

function removeSubtree(d: Draft, id: string): void {
  const instances = d.instances as unknown as Map<string, Inst>;
  const props = d.props as unknown as Map<string, AnyProp>;
  const styles = d.styles as unknown as Map<string, unknown>;
  const sources = d.styleSources as unknown as Map<string, Src>;
  const selections = d.styleSourceSelections as unknown as Map<string, Sel>;

  const doomed = new Set<string>();
  const stack = [id];
  while (stack.length) {
    const cur = stack.pop()!;
    if (doomed.has(cur)) continue;
    doomed.add(cur);
    for (const c of instances.get(cur)?.children ?? []) if (c.type === "id") stack.push(c.value);
  }

  // Detach from the parent first.
  for (const [parentId, parent] of [...instances]) {
    if (doomed.has(parentId)) continue;
    if (parent.children.some((c) => c.type === "id" && c.value === id)) {
      instances.set(parentId, { ...parent, children: parent.children.filter((c) => !(c.type === "id" && c.value === id)) });
    }
  }
  for (const [propId, p] of [...props]) if (doomed.has(p.instanceId)) props.delete(propId);
  for (const inst of doomed) {
    for (const sourceId of selections.get(inst)?.values ?? []) {
      if (sources.get(sourceId)?.type !== "local") continue;
      sources.delete(sourceId);
      for (const key of [...styles.keys()]) if (key.startsWith(`${sourceId}:`)) styles.delete(key);
    }
    selections.delete(inst);
    instances.delete(inst);
  }
}

function ensureLocalSource(d: Draft, instanceId: string): string {
  const sources = d.styleSources as unknown as Map<string, Src>;
  const selections = d.styleSourceSelections as unknown as Map<string, Sel>;
  const sel = selections.get(instanceId);
  const existing = sel?.values.find((v) => sources.get(v)?.type === "local");
  if (existing) return existing;
  const id = uid("src_");
  sources.set(id, { id, type: "local" });
  selections.set(instanceId, sel ? { ...sel, values: [id, ...sel.values] } : { instanceId, values: [id] });
  return id;
}

/** The core, on plain maps: used by `applyEditOps` inside a transaction and by the tests. */
export function applyOpsToDraft(d: Draft, ops: EditOp[], rootId: string, baseBpId: string): ApplyResult {
  const instances = d.instances as unknown as Map<string, Inst>;
  const props = d.props as unknown as Map<string, AnyProp>;
  const styles = d.styles as unknown as Map<string, unknown>;
  let applied = 0;
  let skipped = 0;

  const insertAt = (index: number, composition: WSCompositionResult) => {
    const root = instances.get(rootId);
    if (!root || composition.rootIds.length === 0) return false;
    const fresh = demoteH1(composition);
    mergeComposition(d, fresh);
    const children = [...root.children];
    children.splice(Math.max(0, Math.min(index, children.length)), 0, ...fresh.rootIds.map((value) => ({ type: "id" as const, value })));
    instances.set(rootId, { ...root, children });
    return true;
  };

  for (const op of ops) {
    const target = "id" in op ? instances.get(op.id) : undefined;
    let ok = false;

    switch (op.op) {
      case "setText": {
        if (target && !target.children.some((c) => c.type === "id")) {
          instances.set(op.id, { ...target, children: [{ type: "text", value: op.text }] });
          ok = true;
        }
        break;
      }
      case "setStyle": {
        if (!target) break;
        const sourceId = ensureLocalSource(d, op.id);
        for (const [property, value] of Object.entries(op.styles)) {
          styles.set(`${sourceId}:${baseBpId}::${property}`, { styleSourceId: sourceId, breakpointId: baseBpId, property, value: { type: "keyword", value } });
        }
        ok = true;
        break;
      }
      case "setProp": {
        if (!target) break;
        const existing = [...props.values()].find((p) => p.instanceId === op.id && p.name === op.name);
        const id = existing?.id ?? uid("prop_");
        props.set(id, { id, instanceId: op.id, name: op.name, type: "string", value: op.value });
        ok = true;
        break;
      }
      case "remove": {
        if (!target || op.id === rootId) break;
        removeSubtree(d, op.id);
        ok = true;
        break;
      }
      case "insertSection": {
        if (!op.composition) break;
        const root = instances.get(rootId);
        const at = op.after === null ? 0 : (root?.children.findIndex((c) => c.type === "id" && c.value === op.after) ?? -1) + 1;
        if (op.after !== null && at === 0) break; // the section it was meant to follow is gone
        ok = insertAt(at, op.composition);
        break;
      }
      case "replaceSection": {
        if (!op.composition || !target) break;
        const root = instances.get(rootId);
        const at = root?.children.findIndex((c) => c.type === "id" && c.value === op.id) ?? -1;
        if (at < 0) break;
        removeSubtree(d, op.id);
        ok = insertAt(at, op.composition);
        break;
      }
    }
    if (ok) applied++;
    else skipped++;
  }
  return { applied, skipped };
}

/** One transaction for the whole proposal. Nothing is written when no operation can be applied. */
export function applyEditOps(ops: EditOp[]): ApplyResult {
  const page = $selectedPage.get();
  if (!page || ops.length === 0) return { applied: 0, skipped: ops.length };
  const { baseBpId } = compositionBreakpoints();
  const known = $instances.get();
  const anyTarget = ops.some((op) => ("id" in op ? known.has(op.id) : op.op === "insertSection" && !!op.composition));
  if (!anyTarget) return { applied: 0, skipped: ops.length };

  let result: ApplyResult = { applied: 0, skipped: ops.length };
  updateData((draft) => {
    result = applyOpsToDraft(draft, ops, page.rootInstanceId, baseBpId);
  });
  return result;
}
