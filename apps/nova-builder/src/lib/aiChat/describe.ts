// What a proposal will change, as a short list: the card shows it before Apply, and hovering a
// line outlines the elements it touches on the canvas. Pure.
import type { EditOp } from "@studio/ai";
import type { Instance } from "@webstudio-is/sdk";
import type { ProposalKind, ProposalLine } from "./types";

const MAX_DETAIL = 80;
const shorten = (s: string) => (s.length > MAX_DETAIL ? `${s.slice(0, MAX_DETAIL - 1)}…` : s);

function labelOf(instances: Map<string, Instance>, id: string): string {
  const inst = instances.get(id);
  if (!inst) return id;
  const text = inst.children.find((c) => c.type === "text")?.value;
  return inst.label?.trim() || (typeof text === "string" && text ? shorten(text) : inst.component);
}

/** Texts, styles and props of one kind are merged into a single line ("Rewrite 6 texts"). */
export function describeOps(ops: EditOp[], instances: Map<string, Instance>): ProposalLine[] {
  const merged = new Map<ProposalKind, ProposalLine>();
  const lines: ProposalLine[] = [];

  const merge = (kind: "text" | "style" | "prop", id: string, detail: string) => {
    const line = merged.get(kind);
    if (!line) {
      const created: ProposalLine = { kind, count: 1, label: labelOf(instances, id), ids: [id], detail };
      merged.set(kind, created);
      lines.push(created);
      return;
    }
    line.count++;
    if (!line.ids.includes(id)) line.ids.push(id);
    if (line.count > 1) line.label = "";
    if (kind !== "text" && detail && !line.detail?.includes(detail)) line.detail = `${line.detail}, ${detail}`;
    if (kind === "text") line.detail = undefined;
  };

  for (const op of ops) {
    switch (op.op) {
      case "setText": merge("text", op.id, shorten(op.text)); break;
      case "setStyle": merge("style", op.id, Object.keys(op.styles).join(", ")); break;
      case "setProp": merge("prop", op.id, op.name); break;
      case "remove": lines.push({ kind: "remove", count: 1, label: labelOf(instances, op.id), ids: [op.id] }); break;
      case "insertSection": lines.push({ kind: "insert", count: 1, label: shorten(op.brief), ids: op.after ? [op.after] : [], full: op.brief }); break;
      case "replaceSection": lines.push({ kind: "replace", count: 1, label: labelOf(instances, op.id), ids: [op.id], detail: shorten(op.brief), full: op.brief }); break;
    }
  }
  return lines;
}
