"use client";
import { Icon } from "@/builder/icons";
import { useEffect, useState } from "react";
import { UI_VARS as C } from "@/lib/uiTheme";
import { useI18n, fmt, type I18nShortcutsDictionary } from "@/lib/i18n";

const buildShortcuts = (s: I18nShortcutsDictionary) => [
  {
    group: s.groupEdit,
    items: [
      { keys: ["Ctrl", "Z"], label: s.undo },
      { keys: ["Ctrl", "Shift", "Z"], label: s.redo },
      { keys: ["Ctrl", "C"], label: s.copy },
      { keys: ["Ctrl", "V"], label: s.paste },
      { keys: ["Ctrl", "D"], label: s.duplicate },
      { keys: ["Del"], label: s.delete },
    ],
  },
  {
    group: s.groupSelection,
    items: [
      { keys: [s.keyClick], label: s.select },
      { keys: ["Esc"], label: s.deselect },
      { keys: ["↑ ↓"], label: s.navigateTree },
    ],
  },
  {
    group: s.groupCanvas,
    items: [
      { keys: ["Ctrl", "+"], label: s.zoomIn },
      { keys: ["Ctrl", "−"], label: s.zoomOut },
      { keys: ["Ctrl", "0"], label: s.resetZoom },
      { keys: [s.keySpace], label: s.previewToggle },
    ],
  },
  {
    group: s.groupPanels,
    items: [
      { keys: ["Ctrl", "K"], label: s.openPalette },
      { keys: ["?"], label: s.openShortcuts },
      { keys: ["Ctrl", "S"], label: s.saveProject },
    ],
  },
  {
    group: s.groupAI,
    items: [
      { keys: ["Ctrl", "Enter"], label: s.generateAI },
    ],
  },
];

function Key({ label }: { label: string }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      padding: "2px 9px", borderRadius: 8, minWidth: 28,
      background: C.card, border: "1px solid var(--ui-border)",
      color: C.text, fontSize: 13, fontFamily: C.font, fontWeight: 500,
      lineHeight: 1.6,
    }}>
      {label}
    </span>
  );
}

export function KeyboardShortcutsModal({ onClose }: { onClose: () => void }) {
  const { t } = useI18n();
  const S = t.chrome.shortcuts;
  const [search, setSearch] = useState("");

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const filtered = buildShortcuts(S).map((g) => ({
    ...g,
    items: g.items.filter((item) =>
      !search || item.label.toLowerCase().includes(search.toLowerCase()) || item.keys.some((k) => k.toLowerCase().includes(search.toLowerCase()))
    ),
  })).filter((g) => g.items.length > 0);

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(17,17,17,0.42)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 500, fontFamily: C.font }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 24, width: 560, maxHeight: "80vh", display: "flex", flexDirection: "column", boxShadow: "var(--ui-shadow-pop, 0 24px 64px rgba(0,0,0,0.6))", overflow: "hidden" }}>
        {/* Header */}
        <div style={{ padding: "18px 22px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 19, fontWeight: 700, letterSpacing: "-0.01em", color: C.text, flex: 1 }}>{S.title}</span>
          <input
            autoFocus
            type="text"
            placeholder={S.search}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              height: 38, padding: "0 12px", background: C.card,
              border: `1px solid ${C.border}`, borderRadius: 10,
              color: C.text, fontSize: 14, fontFamily: C.font, outline: "none", width: 180,
            }}
          />
          <button onClick={onClose} style={{ background: "none", border: "none", color: C.textMuted, cursor: "pointer", fontSize: 18, padding: "2px 6px", lineHeight: 1 }}><Icon name="close" size={14} weight="bold" /></button>
        </div>

        {/* Shortcut list */}
        <div style={{ overflowY: "auto", padding: "14px 22px 22px" }}>
          {filtered.length === 0 && (
            <div style={{ color: C.textMuted, fontSize: 12, textAlign: "center", padding: "24px 0" }}>{fmt(S.noMatch, { query: search })}</div>
          )}
          {filtered.map((group) => (
            <div key={group.group} style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: C.textMuted, marginBottom: 10 }}>
                {group.group}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {group.items.map((item) => (
                  <div key={item.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                    <span style={{ fontSize: 14, color: C.textDim }}>{item.label}</span>
                    <div style={{ display: "flex", gap: 4, alignItems: "center", flexShrink: 0 }}>
                      {item.keys.map((k, i) => (
                        <span key={i} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          {i > 0 && <span style={{ fontSize: 9, color: C.textMuted }}>+</span>}
                          <Key label={k} />
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div style={{ padding: "12px 22px", borderTop: `1px solid ${C.border}`, fontSize: 13, color: C.textMuted, textAlign: "center", background: C.surface }}>
          {S.hintBefore} <Key label="?" /> {S.hintAfter}
        </div>
      </div>
    </div>
  );
}
