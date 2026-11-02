"use client";
// Top of the AI tab: the thread's title, a menu of earlier chats on this site (open, delete) and
// a button for a new chat.
import { useEffect, useRef, useState } from "react";
import { UI_VARS as C } from "@/lib/uiTheme";
import { useI18n, fmt } from "@/lib/i18n";
import type { ChatThread } from "@/lib/aiChat/types";

type Props = {
  thread: ChatThread | null;
  threads: ChatThread[];
  onNew: () => void;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
};

const icon = { background: "transparent", border: `1px solid ${C.border}`, borderRadius: 7, color: C.textDim, cursor: "pointer", height: 30, minWidth: 30, fontSize: 13, fontFamily: C.font, padding: "0 8px" } as const;

export function ThreadHeader({ thread, threads, onNew, onSelect, onDelete }: Props) {
  const L = useI18n().t.tools.aiChat;
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", esc); };
  }, [open]);

  const empty = !thread || thread.messages.length === 0;

  return (
    <div ref={box} style={{ position: "relative", display: "flex", alignItems: "center", gap: 6, padding: "9px 10px", borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
      <span aria-hidden="true" style={{ color: C.accentText, fontSize: 15 }}>✦</span>
      <h2 style={{ margin: 0, flex: 1, minWidth: 0, fontSize: 13, fontWeight: 700, color: C.text, fontFamily: C.font, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={thread?.title || L.title}>
        {thread?.title || L.title}
      </h2>
      <button type="button" style={icon} onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-haspopup="listbox" aria-label={L.history} title={L.history} data-testid="ai-history">
        ☰
      </button>
      <button type="button" style={{ ...icon, opacity: empty ? 0.45 : 1 }} onClick={onNew} disabled={empty} aria-label={L.newChat} title={L.newChat} data-testid="ai-new-chat">
        ＋
      </button>
      {open && (
        <div role="listbox" aria-label={L.history} style={{ position: "absolute", top: "100%", left: 8, right: 8, zIndex: 5, maxHeight: 280, overflowY: "auto", background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, boxShadow: "0 10px 30px rgba(0,0,0,0.45)", padding: 4 }}>
          {threads.length === 0 && <div style={{ padding: 10, fontSize: 12, color: C.textMuted, fontFamily: C.font }}>{L.historyEmpty}</div>}
          {threads.map((t) => (
            <div key={t.id} role="option" aria-selected={t.id === thread?.id} style={{ display: "flex", alignItems: "center", gap: 4, borderRadius: 7, background: t.id === thread?.id ? C.accentBg : "transparent" }}>
              <button type="button" onClick={() => { onSelect(t.id); setOpen(false); }} style={{ flex: 1, minWidth: 0, textAlign: "left", background: "none", border: "none", cursor: "pointer", padding: "7px 9px", fontFamily: C.font, color: C.text }}>
                <div style={{ fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.title || L.untitled}</div>
                <div style={{ fontSize: 11, color: C.textMuted }}>
                  {new Date(t.updatedAt).toLocaleDateString(undefined, { dateStyle: "medium" })} · {fmt(L.threadMeta, { count: t.messages.length })}
                </div>
              </button>
              <button type="button" onClick={() => onDelete(t.id)} aria-label={`${L.deleteThread}: ${t.title || L.untitled}`} title={L.deleteThread} style={{ background: "none", border: "none", color: C.textMuted, cursor: "pointer", fontSize: 15, width: 28, height: 28 }}>
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
