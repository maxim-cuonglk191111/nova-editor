"use client";
// The conversation: the owner's messages, the AI's replies and proposals, errors with Retry (or
// a sign-up link for a guest), and a progress line while a request runs. Scrolls to the newest.
import { useEffect, useRef } from "react";
import { UI_VARS as C } from "@/lib/uiTheme";
import { useI18n, fmt } from "@/lib/i18n";
import type { AssistantMessage, ChatMessage } from "@/lib/aiChat/types";
import type { Pending } from "@/lib/aiChat/useAIChat";
import { ProposalCard } from "./ProposalCard";

type Props = {
  messages: ChatMessage[];
  pending: Pending | null;
  onApply: (m: AssistantMessage) => void;
  onDiscard: (m: AssistantMessage) => void;
  onHighlight: (ids: string[] | null) => void;
  onRetry: () => void;
};

const time = (at: number) => new Date(at).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });

export function MessageList({ messages, pending, onApply, onDiscard, onHighlight, onRetry }: Props) {
  const L = useI18n().t.tools.aiChat;
  const A = useI18n().t.tools.ai;
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    end.current?.scrollIntoView?.({ block: "end" });
  }, [messages.length, pending]);

  const who = (name: string, at: number, extra?: string) => (
    <div style={{ display: "flex", gap: 6, alignItems: "baseline", marginBottom: 3, fontSize: 11, color: C.textMuted, fontFamily: C.font }}>
      <strong style={{ color: C.textDim, fontWeight: 700 }}>{name}</strong>
      <span>{time(at)}</span>
      {extra && <span style={{ marginLeft: "auto" }}>{extra}</span>}
    </div>
  );

  const progressText = pending ? (pending.stage === "building" ? pending.progress : pending.stage === "reading" ? L.progressReading : L.progressWriting) : "";

  return (
    <div role="log" aria-live="polite" aria-label={L.title} style={{ display: "flex", flexDirection: "column", gap: 14, padding: "12px 12px 4px" }} data-testid="ai-messages">
      {messages.map((m) => {
        if (m.role === "user") {
          return (
            <div key={m.id} data-testid="ai-msg-user">
              {who(L.you, m.at)}
              <div style={{ padding: "8px 11px", borderRadius: 10, background: C.accentBg, border: `1px solid ${C.accentBorder}`, color: C.text, fontSize: 13, lineHeight: 1.5, whiteSpace: "pre-wrap", overflowWrap: "anywhere", fontFamily: C.font }}>
                {m.text}
              </div>
            </div>
          );
        }
        const seconds = m.ms !== undefined ? Math.max(1, Math.round(m.ms / 1000)) : undefined;
        const provider = m.provider ? (L.providers as Record<string, { name: string }>)[m.provider]?.name ?? m.provider : undefined;
        const extra = provider && seconds ? fmt(L.answeredBy, { provider, seconds }) : provider;
        return (
          <div key={m.id} data-testid={m.kind === "error" ? "ai-msg-error" : "ai-msg-assistant"}>
            {who(L.assistant, m.at, extra)}
            {m.kind === "error" ? (
              <div role="alert" style={{ padding: "8px 11px", borderRadius: 10, background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.3)", color: C.danger, fontSize: 13, lineHeight: 1.5, fontFamily: C.font, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                <span style={{ flex: 1, minWidth: 120, overflowWrap: "anywhere" }}>{m.text}</span>
                {m.needsAccount ? (
                  <a href="/signup?callbackUrl=%2Fprojects" style={{ background: C.accent, borderRadius: 6, color: "#fff", fontSize: 13, padding: "5px 11px", textDecoration: "none", whiteSpace: "nowrap" }}>{A.signUpFree}</a>
                ) : (
                  <button type="button" onClick={onRetry} style={{ background: C.danger, border: "none", borderRadius: 6, color: "#fff", fontSize: 13, fontWeight: 600, padding: "5px 11px", cursor: "pointer", fontFamily: C.font }}>{L.retry}</button>
                )}
              </div>
            ) : (
              <>
                {m.text && <div style={{ color: C.text, fontSize: 13, lineHeight: 1.55, whiteSpace: "pre-wrap", overflowWrap: "anywhere", fontFamily: C.font }}>{m.text}</div>}
                {m.kind === "proposal" && <ProposalCard message={m} onApply={onApply} onDiscard={onDiscard} onHighlight={onHighlight} busy={pending !== null} />}
              </>
            )}
          </div>
        );
      })}
      {pending && (
        <div role="status" data-testid="ai-progress" style={{ display: "flex", alignItems: "center", gap: 8, color: C.textMuted, fontSize: 13, fontFamily: C.font }}>
          <span aria-hidden="true" style={{ width: 13, height: 13, border: "2px solid rgba(255,255,255,0.2)", borderTopColor: C.accentText, borderRadius: "50%", display: "inline-block", animation: "ai-chat-spin 0.7s linear infinite" }} />
          {progressText}
        </div>
      )}
      <div ref={end} />
      <style>{`@keyframes ai-chat-spin { to { transform: rotate(360deg); } } @media (prefers-reduced-motion: reduce) { [data-testid="ai-progress"] span { animation: none !important; } }`}</style>
    </div>
  );
}
