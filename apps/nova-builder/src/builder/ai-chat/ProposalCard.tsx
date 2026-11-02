"use client";
// The change list of an AI answer, with Apply / Discard. Hovering a line outlines the elements it
// touches on the canvas. After the decision the card says what happened (and how to undo).
import { useStore } from "@nanostores/react";
import { UI_VARS as C } from "@/lib/uiTheme";
import { $instances, $props, $styles, $styleSourceSelections } from "@/lib/data-stores";
import { compositionBreakpoints } from "@/lib/applyWSComposition";
import { stillApplied } from "@/lib/aiChat/appliedChecks";
import { Icon, type IconName } from "@/builder/icons";
import { useI18n, fmt } from "@/lib/i18n";
import type { AssistantMessage, ProposalLine } from "@/lib/aiChat/types";

type Props = {
  message: AssistantMessage;
  onApply: (m: AssistantMessage) => void;
  onDiscard: (m: AssistantMessage) => void;
  onRestore: (m: AssistantMessage) => void;
  onHighlight: (ids: string[] | null) => void;
  busy: boolean;
};

const ICON: Record<ProposalLine["kind"], IconName> = { text: "catTypography", style: "catDisplay", prop: "settings", remove: "trash", insert: "plus", replace: "replace", page: "templates", site: "templates" };

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

export function ProposalCard({ message, onApply, onDiscard, onRestore, onHighlight, busy }: Props) {
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
    <div data-testid="ai-proposal" data-status={message.status} style={{ marginTop: 10, border: `1px solid ${C.border}`, borderRadius: 14, background: C.card, overflow: "hidden" }}>
      <div style={{ padding: "10px 14px", fontSize: 13, fontWeight: 600, color: C.text, borderBottom: `1px solid ${C.border}`, fontFamily: C.font }}>
        {L.proposedChanges}
      </div>
      <ul style={{ listStyle: "none", margin: 0, padding: "4px 0" }}>
        {proposal.lines.map((line, i) => (
          <li
            key={`${line.kind}-${i}`}
            onMouseEnter={() => hoverable && onHighlight(line.ids)}
            onMouseLeave={() => hoverable && onHighlight(null)}
            title={line.full}
            style={{ display: "flex", gap: 10, padding: "8px 14px", fontSize: 14, lineHeight: 1.45, color: C.text, fontFamily: C.font, cursor: hoverable && line.ids.length ? "default" : undefined }}
          >
            <span style={{ color: C.accentText, width: 18, display: "inline-flex", justifyContent: "center", flexShrink: 0 }}><Icon name={ICON[line.kind]} size={16} weight="bold" /></span>
            <span style={{ overflowWrap: "anywhere" }}>{lineText(line)}</span>
          </li>
        ))}
      </ul>
      {pending ? (
        <div style={{ padding: "10px 14px", borderTop: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 8 }}>
          {hoverable && <span style={{ flex: 1, fontSize: 11, color: C.textMuted, fontFamily: C.font }}>{L.highlightHint}</span>}
          {!hoverable && <span style={{ flex: 1 }} />}
          <button type="button" onClick={() => onDiscard(message)} disabled={busy} style={{ height: 36, padding: "0 14px", borderRadius: 10, border: `1px solid ${C.border}`, background: "transparent", color: C.textMuted, fontSize: 13, fontFamily: C.font, cursor: "pointer" }}>
            {L.discard}
          </button>
          <button type="button" onClick={() => onApply(message)} disabled={busy} data-testid="ai-apply" style={{ height: 36, padding: "0 18px", borderRadius: 10, border: "none", background: C.primary, color: C.onPrimary, fontSize: 13, fontWeight: 700, fontFamily: C.font, cursor: "pointer" }}>
            {L.apply}
          </button>
        </div>
      ) : (
        <div role="status" data-undone={undone ? "true" : undefined} style={{ padding: "10px 14px", borderTop: `1px solid ${C.border}`, fontSize: 13, fontFamily: C.font, color: message.status === "applied" && !undone ? C.primary : C.textMuted }}>
          {undone ? L.undone : message.status === "applied"
            ? message.result && message.result.skipped > 0
              ? fmt(L.applyPartial, message.result)
              : L.appliedUndo
            : message.result && message.result.applied === 0 && message.result.skipped > 0 ? L.nothingApplied : L.discarded}
          {message.status === "applied" && message.snapshotId && (
            <button type="button" onClick={() => onRestore(message)} disabled={busy} data-testid="ai-restore" style={{ display: "block", marginTop: 6, padding: "3px 0", border: "none", background: "transparent", color: C.textMuted, fontSize: 12, fontFamily: C.font, textDecoration: "underline", cursor: "pointer" }}>
              {L.restore}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
