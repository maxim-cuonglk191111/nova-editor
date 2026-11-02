"use client";
// The empty state of a chat: one line on what AI can do and four starter prompts that depend on
// what is selected. A starter fills the input (it does not send), so the owner can adjust it.
import { UI_VARS as C, UI_SHAPE as S } from "@/lib/uiTheme";
import { Icon } from "@/builder/icons";
import { useI18n } from "@/lib/i18n";
import type { ChatScope } from "@/lib/aiChat/types";

type Props = { scope: ChatScope; hasPage: boolean; onPick: (prompt: string) => void };

export function StarterPrompts({ scope, hasPage, onPick }: Props) {
  const L = useI18n().t.tools.aiChat;
  const list = !hasPage ? L.starterEmptyPage : scope === "element" ? L.starterElement : scope === "section" ? L.starterSection : L.starterPage;

  return (
    <div style={{ padding: "22px 14px 8px", display: "flex", flexDirection: "column", gap: 14, fontFamily: C.font }}>
      <div>
        <div style={{ fontSize: 17, fontWeight: 700, color: C.text, marginBottom: 6, letterSpacing: "-0.01em" }}>{L.emptyTitle}</div>
        <div style={{ fontSize: 14, lineHeight: 1.55, color: C.textMuted }}>{L.emptyBody}</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }} role="list" data-testid="ai-starters">
        {list.map((s) => (
          <button
            key={s.label}
            type="button"
            role="listitem"
            onClick={() => onPick(s.prompt)}
            style={{ textAlign: "left", display: "flex", alignItems: "center", gap: 10, minHeight: 48, padding: "10px 14px", borderRadius: S.radiusMd, border: `1px solid ${C.border}`, background: C.card, color: C.text, fontSize: 14, fontFamily: C.font, cursor: "pointer", lineHeight: 1.35 }}
          >
            <span style={{ color: C.accentText, display: "inline-flex" }}><Icon name="ai" size={18} weight="duotone" /></span>
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}
