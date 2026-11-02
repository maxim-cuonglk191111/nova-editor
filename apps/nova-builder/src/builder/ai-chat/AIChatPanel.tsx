"use client";
// The AI tab of the left sidebar: a conversation next to the canvas. Point at something, say what
// you want, see what will change, press Apply or Discard. All behaviour lives in `useAIChat`.
import { useCallback, useRef } from "react";
import { UI_VARS as C } from "@/lib/uiTheme";
import { useAIChat } from "@/lib/aiChat/useAIChat";
import { ThreadHeader } from "./ThreadHeader";
import { MessageList } from "./MessageList";
import { StarterPrompts } from "./StarterPrompts";
import { Composer } from "./Composer";

export function AIChatPanel() {
  const chat = useAIChat();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messages = chat.thread?.messages ?? [];

  const pick = useCallback((prompt: string) => {
    chat.setDraft(prompt);
    inputRef.current?.focus();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chat.setDraft]);

  return (
    <section aria-label="AI" data-testid="ai-panel" style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0, background: C.bg, color: C.text }}>
      <ThreadHeader thread={chat.thread} threads={chat.threads} onNew={chat.newThread} onSelect={chat.selectThread} onDelete={chat.deleteThread} />
      <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
        {messages.length === 0 && !chat.pending
          ? <StarterPrompts scope={chat.scope?.ref.scope ?? "page"} hasPage={chat.hasPage} onPick={pick} />
          : <MessageList messages={messages} pending={chat.pending} onApply={chat.apply} onRestore={chat.restore} onDiscard={chat.discard} onHighlight={chat.highlight} onRetry={chat.retry} />}
      </div>
      <Composer chat={chat} inputRef={inputRef} />
    </section>
  );
}
