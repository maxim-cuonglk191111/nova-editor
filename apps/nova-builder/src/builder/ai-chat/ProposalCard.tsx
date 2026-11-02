"use client";
// The change list of an AI answer, with Apply / Discard. Hovering a line outlines the elements it
// touches on the canvas. After the decision the card says what happened (and how to undo).
import { useStore } from "@nanostores/react";
import { UI_VARS as C } from "@/lib/uiTheme";
import { $instances, $props, $styles, $styleSourceSelections } from "@/lib/data-stores";
import { compositionBreakpoints } from "@/lib/applyWSComposition";
import { stillApplied } from "@/lib/aiChat/appliedChecks";
import { useI18n, fmt } from "@/lib/i18n";
import type { AssistantMessage, ProposalLine } from "@/lib/aiChat/types";

type Props = {
  message: AssistantMessage;
  onApply: (m: AssistantMessage) => void;
  onDiscard: (m: AssistantMessage) => void;
  onHighlight: (ids: string[] | null) => void;
  busy: boolean;
};

const ICON: Record<ProposalLine["kind"], string> = { text: "✎", style: "◐", prop: "⚙", remove: "✕", insert: "＋", replace: "⟳", page: "▤", site: "▤" };

/** `paddingTop` and `minWidth` read as "padding" and "width" to someone who is not a developer. */
function groupOf(property: string): string {
  return property
    .replace(/(Top|Right|Bottom|Left)$/, "")
    .replace(/^(min|max)(Width|Height)$/, (_m, _p, w: string) => w.toLowerCase())
    .replace(/^(row|column)Gap$/, "gap");
}

function useLineText() {
  const L = useI18n().t.tools.aiChat;
  const plain = (detail: string | undefined) =>
    [...new Set((detail ?? "").split(", ").filter(Boolean).map((p) => L.styleNames[groupOf(p)] ?? L.styleNames[p] ?? p))].join(", ");
  return (line: ProposalLine): string => {
    const many = line.count > 1;
    const vars = { label: line.label, count: line.count, detail: line.kind === "style" || line.kind === "prop" ? plain(line.detail) : line.detail ?? "" };
    switch (line.kind) {
      case "text": return fmt(many ? L.lineTextMany : L.lineTextOne, vars);
      case "style": return fmt(many ? L.lineStyleMany : L.lineStyleOne, vars);
      case "prop": return fmt(many ? L.linePropMany : L.linePropOne, vars);
      case "remove": return fmt(L.lineRemove, vars);
      case "insert": return fmt(L.lineInsert, vars);
      case "replace": return fmt(L.lineReplace, vars);
      case "page": return fmt(L.linePage, vars);
      case "site": return fmt(L.lineSite, vars);
    }
  };
}

export function ProposalCard({ message, onApply, onDiscard, onHighlight, busy }: Props) {
  const L = useI18n().t.tools.aiChat;
  const lineText = useLineText();
  const proposal = message.proposal;
  // The document changes under the card (Ctrl+Z, Ctrl+Shift+Z): read it again to say what is true now.
  const instances = useStore($instances);
  const props = useStore($props);
  const styles = useStore($styles);
  const selections = useStore($styleSourceSelections);
  if (!proposal) return null;
  const undone = message.status === "applied" && !stillApplied(message.checks, { instances, props, styles, styleSourceSelections: selections }, compositionBreakpoints().baseBpId);
  const pending = message.status === "pending";
  const hoverable = pending && proposal.lines.some((l) => l.ids.length > 0);

  return (
    <div data-testid="ai-proposal" data-status={message.status} style={{ marginTop: 8, border: `1px solid ${C.border}`, borderRadius: 10, background: C.card, overflow: "hidden" }}>
      <div style={{ padding: "7px 10px", fontSize: 11, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: C.textMuted, borderBottom: `1px solid ${C.border}`, fontFamily: C.font }}>
        {L.proposedChanges}
      </div>
      <ul style={{ listStyle: "none", margin: 0, padding: "4px 0" }}>
        {proposal.lines.map((line, i) => (
          <li
            key={`${line.kind}-${i}`}
            onMouseEnter={() => hoverable && onHighlight(line.ids)}
            onMouseLeave={() => hoverable && onHighlight(null)}
            title={line.full}
            style={{ display: "flex", gap: 8, padding: "6px 10px", fontSize: 13, lineHeight: 1.45, color: C.text, fontFamily: C.font, cursor: hoverable && line.ids.length ? "default" : undefined }}
          >
            <span aria-hidden="true" style={{ color: C.accentText, width: 14, textAlign: "center", flexShrink: 0 }}>{ICON[line.kind]}</span>
            <span style={{ overflowWrap: "anywhere" }}>{lineText(line)}</span>
          </li>
        ))}
      </ul>
      {pending ? (
        <div style={{ padding: "8px 10px", borderTop: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 8 }}>
          {hoverable && <span style={{ flex: 1, fontSize: 11, color: C.textMuted, fontFamily: C.font }}>{L.highlightHint}</span>}
          {!hoverable && <span style={{ flex: 1 }} />}
          <button type="button" onClick={() => onDiscard(message)} disabled={busy} style={{ padding: "6px 12px", borderRadius: 7, border: `1px solid ${C.border}`, background: "transparent", color: C.textMuted, fontSize: 13, fontFamily: C.font, cursor: "pointer" }}>
            {L.discard}
          </button>
          <button type="button" onClick={() => onApply(message)} disabled={busy} data-testid="ai-apply" style={{ padding: "6px 16px", borderRadius: 7, border: "none", background: "#047857", color: "#fff", fontSize: 13, fontWeight: 700, fontFamily: C.font, cursor: "pointer" }}>
            {L.apply}
          </button>
        </div>
      ) : (
        <div role="status" data-undone={undone ? "true" : undefined} style={{ padding: "7px 10px", borderTop: `1px solid ${C.border}`, fontSize: 12, fontFamily: C.font, color: message.status === "applied" && !undone ? "#6ee7b7" : C.textMuted }}>
          {undone ? L.undone : message.status === "applied"
            ? message.result && message.result.skipped > 0
              ? fmt(L.applyPartial, message.result)
              : `✓ ${L.appliedUndo}`
            : message.result && message.result.applied === 0 && message.result.skipped > 0 ? L.nothingApplied : L.discarded}
        </div>
      )}
    </div>
  );
}
