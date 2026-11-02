"use client";
// What the next message is about, shown above the input: set from the canvas selection, and the
// user can remove a chip to widen the scope (element → section → page).
import { Icon } from "@/builder/icons";
import { UI_VARS as C } from "@/lib/uiTheme";
import { useI18n, fmt } from "@/lib/i18n";
import type { ChatContextRef } from "@/lib/aiChat/types";

type Props = { reference: ChatContextRef; onWiden: () => void };

const chip = (muted: boolean) => ({
  display: "inline-flex", alignItems: "center", gap: 6, maxWidth: "100%", padding: "3px 4px 3px 9px", borderRadius: 999,
  border: `1px solid ${muted ? C.border : C.accentBorder}`, background: muted ? "transparent" : C.accentBg,
  color: muted ? C.textMuted : C.accentText, fontSize: 12, fontFamily: C.font, lineHeight: 1.4,
}) as const;

const nameStyle = { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } as const;

export function ContextChips({ reference, onWiden }: Props) {
  const L = useI18n().t.tools.aiChat;
  const removable = reference.scope !== "page";

  const main =
    reference.scope === "element" ? fmt(L.chipElement, { name: reference.targetLabel ?? "" })
    : reference.scope === "section" ? fmt(L.chipSection, { name: reference.sectionLabel ?? reference.targetLabel ?? "" })
    : fmt(L.chipPage, { name: reference.pageName });

  return (
    <div role="group" aria-label={L.title} style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      <span style={chip(false)} data-testid="ai-chip-main">
        <span aria-hidden="true" style={{ width: 6, height: 6, borderRadius: "50%", background: C.accentText, flexShrink: 0 }} />
        <span style={nameStyle}>{main}</span>
        {removable ? (
          <button
            type="button"
            onClick={onWiden}
            aria-label={`${L.removeChip}: ${main}`}
            title={L.removeChip}
            style={{ border: "none", background: "transparent", color: "inherit", cursor: "pointer", width: 18, height: 18, borderRadius: "50%", padding: 0, display: "inline-flex", alignItems: "center", justifyContent: "center" }}
          >
            <Icon name="close" size={12} weight="bold" />
          </button>
        ) : <span style={{ width: 5 }} />}
      </span>
      {reference.scope === "element" && reference.sectionLabel && (
        <span style={{ ...chip(true), padding: "3px 9px" }}>
          <span style={nameStyle}>{fmt(L.chipSection, { name: reference.sectionLabel })}</span>
        </span>
      )}
    </div>
  );
}
