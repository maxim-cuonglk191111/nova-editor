// After Apply the proposal's payload is dropped, but the card should still tell the truth when the
// owner presses Ctrl+Z (or Ctrl+Shift+Z). So Apply keeps a few small checks, "the heading says X",
// "that section is gone", and the card re-reads the document: if none of them holds any more, the
// change was undone. Pure, so it is tested without the editor.
import type { EditOp, WSCompositionResult } from "@studio/ai";
import type { DocView } from "./context";

export type AppliedCheck =
  | { k: "text"; id: string; v: string }
  | { k: "style"; id: string; p: string; v: string }
  | { k: "prop"; id: string; n: string; v: string }
  | { k: "gone"; id: string }
  | { k: "present"; id: string };

const MAX_CHECKS = 40;

export const checksForComposition = (composition: WSCompositionResult): AppliedCheck[] =>
  composition.rootIds[0] ? [{ k: "present", id: composition.rootIds[0] }] : [];

export function checksFor(ops: EditOp[]): AppliedCheck[] {
  const out: AppliedCheck[] = [];
  for (const op of ops) {
    switch (op.op) {
      case "setText": out.push({ k: "text", id: op.id, v: op.text }); break;
      case "setStyle": for (const [p, v] of Object.entries(op.styles)) out.push({ k: "style", id: op.id, p, v }); break;
      case "setProp": out.push({ k: "prop", id: op.id, n: op.name, v: op.value }); break;
      case "remove": out.push({ k: "gone", id: op.id }); break;
      case "insertSection": if (op.composition) out.push(...checksForComposition(op.composition)); break;
      case "replaceSection": out.push({ k: "gone", id: op.id }); if (op.composition) out.push(...checksForComposition(op.composition)); break;
    }
  }
  return out.slice(0, MAX_CHECKS);
}

function holds(c: AppliedCheck, doc: DocView, baseBreakpointId: string): boolean {
  const inst = "id" in c ? doc.instances.get(c.id) : undefined;
  switch (c.k) {
    case "present": return inst !== undefined;
    case "gone": return inst === undefined;
    case "text": return inst?.children.some((ch) => ch.type === "text" && ch.value === c.v) ?? false;
    case "prop": return [...doc.props.values()].some((p) => p.instanceId === c.id && p.name === c.n && p.value === c.v);
    case "style": {
      const sources = doc.styleSourceSelections.get(c.id)?.values ?? [];
      return sources.some((src) => {
        const v = doc.styles.get(`${src}:${baseBreakpointId}::${c.p}`)?.value as { type?: string; value?: unknown } | undefined;
        return v?.type === "keyword" && v.value === c.v;
      });
    }
  }
}

/** True while at least one effect of the change is still in the document (or when nothing was recorded). */
export function stillApplied(checks: AppliedCheck[] | undefined, doc: DocView, baseBreakpointId: string): boolean {
  if (!checks || checks.length === 0) return true;
  return checks.some((c) => holds(c, doc, baseBreakpointId));
}
