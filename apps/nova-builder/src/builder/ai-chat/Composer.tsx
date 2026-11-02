"use client";
// The input area of the AI tab: context chips, the multi-page notice, the text box with Send /
// Stop, the model picker and "start over with a new page" (asks first).
import { useState, type RefObject } from "react";
import { UI_VARS as C } from "@/lib/uiTheme";
import { useI18n } from "@/lib/i18n";
import { planSitePages, type SitePageKey } from "@/lib/aiSitePlan";
import type { useAIChat } from "@/lib/aiChat/useAIChat";
import { AISitePlanNotice } from "../AISitePlanNotice";
import { ContextChips } from "./ContextChips";
import { ModelPicker } from "./ModelPicker";

type Chat = ReturnType<typeof useAIChat>;
type Props = { chat: Chat; inputRef: RefObject<HTMLTextAreaElement> };

const small = { background: "none", border: "none", padding: 0, color: C.accentText, fontSize: 12, fontFamily: C.font, fontWeight: 700, cursor: "pointer", textDecoration: "underline" } as const;

export function Composer({ chat, inputRef }: Props) {
  const { t } = useI18n();
  const L = t.tools.aiChat;
  const A = t.tools.ai;
  const [startOver, setStartOver] = useState<"idle" | "ask" | "armed">("idle");
  const { draft, setDraft, pending, hasPage, scope } = chat;

  const generateMode = !hasPage || startOver === "armed";
  const busy = pending !== null;
  const canSend = draft.trim().length > 0 && !busy;
  const pages = generateMode ? planSitePages(draft) : null;
  const nameOf = (key: SitePageKey) => A.sitePageNames[key];
  const placeholder = generateMode ? L.placeholderEmptyPage : scope?.ref.scope === "element" ? L.placeholderElement : scope?.ref.scope === "section" ? L.placeholderSection : L.placeholderPage;

  function submit() {
    if (!canSend) return;
    chat.send(draft, { generate: generateMode });
    setStartOver("idle");
  }

  return (
    <div style={{ flexShrink: 0, borderTop: `1px solid ${C.border}`, padding: 10, display: "flex", flexDirection: "column", gap: 8, background: C.bg }}>
      {!generateMode && scope && <ContextChips reference={scope.ref} onWiden={chat.widen} />}
      {hasPage && startOver === "armed" && (
        <div style={{ display: "flex" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "3px 4px 3px 9px", borderRadius: 999, border: `1px solid ${C.accentBorder}`, background: C.accentBg, color: C.accentText, fontSize: 12, fontFamily: C.font }}>
            {L.startOver}
            <button type="button" onClick={() => setStartOver("idle")} aria-label={L.startOverNo} style={{ border: "none", background: "transparent", color: "inherit", cursor: "pointer", width: 18, height: 18, fontSize: 14, padding: 0 }}>×</button>
          </span>
        </div>
      )}
      {pages && !busy && (
        <AISitePlanNotice pages={pages} nameOf={nameOf} onePageOnly={chat.onePageOnly} onToggle={() => chat.setOnePageOnly(!chat.onePageOnly)} />
      )}

      <textarea
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          // Enter sends; Shift+Enter is a new line; Enter that confirms an IME composition (Vietnamese Telex/VNI) is left alone.
          if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); submit(); }
        }}
        placeholder={placeholder}
        aria-label={placeholder}
        rows={3}
        data-testid="ai-input"
        style={{ width: "100%", boxSizing: "border-box", background: C.input, border: `1px solid ${C.inputBorder}`, borderRadius: 10, color: C.text, fontSize: 13, fontFamily: C.font, padding: "9px 11px", resize: "none", outline: "none", lineHeight: 1.5, maxHeight: 180 }}
      />

      <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
        <ModelPicker value={chat.model} providers={chat.providers} onChange={chat.setModel} disabled={busy} />
        <span style={{ flex: 1 }} />
        {busy ? (
          <button type="button" onClick={chat.stop} data-testid="ai-stop" style={{ padding: "7px 14px", borderRadius: 8, border: `1px solid ${C.border}`, background: "transparent", color: C.text, fontSize: 13, fontWeight: 700, fontFamily: C.font, cursor: "pointer" }}>
            ■ {L.stop}
          </button>
        ) : (
          <button
            type="button"
            onClick={submit}
            disabled={!canSend}
            data-testid="ai-send"
            style={{ padding: "7px 16px", borderRadius: 8, border: "none", background: canSend ? "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)" : "rgba(124,58,237,0.25)", color: "#fff", fontSize: 13, fontWeight: 700, fontFamily: C.font, cursor: canSend ? "pointer" : "default" }}
          >
            {L.send} ↵
          </button>
        )}
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 12px", alignItems: "center", fontSize: 11, color: C.textMuted, fontFamily: C.font }}>
        <span>{L.enterHint}</span>
        {hasPage && startOver === "idle" && !busy && <button type="button" style={small} onClick={() => setStartOver("ask")} data-testid="ai-start-over">{L.startOver}</button>}
      </div>
      {startOver === "ask" && (
        <div role="alertdialog" aria-label={L.startOver} style={{ padding: "9px 10px", borderRadius: 9, border: `1px solid ${C.accentBorder}`, background: C.accentBg, display: "flex", flexDirection: "column", gap: 8, fontFamily: C.font }}>
          <span style={{ fontSize: 12, lineHeight: 1.5, color: C.text }}>{L.startOverAsk}</span>
          <span style={{ display: "flex", gap: 8 }}>
            <button type="button" onClick={() => { setStartOver("armed"); inputRef.current?.focus(); }} style={{ padding: "5px 12px", borderRadius: 7, border: "none", background: C.accent, color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: C.font }}>{L.startOverYes}</button>
            <button type="button" onClick={() => setStartOver("idle")} style={{ padding: "5px 12px", borderRadius: 7, border: `1px solid ${C.border}`, background: "transparent", color: C.textMuted, fontSize: 12, cursor: "pointer", fontFamily: C.font }}>{L.startOverNo}</button>
          </span>
        </div>
      )}
    </div>
  );
}
