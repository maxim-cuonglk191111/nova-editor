"use client";
import { useState } from "react";
import { useStore } from "@nanostores/react";
import { $symbols, createSymbolFromSelection, instantiateSymbol, deleteSymbol } from "@/lib/symbols";
import { $selectedInstanceId } from "@/lib/nano-states";
import { UI_VARS as C } from "@/lib/uiTheme";
import { useI18n, fmt } from "@/lib/i18n";


export function SymbolsPanel() {
  const L = useI18n().t.sidebar.symbols;
  const symbols = useStore($symbols);
  const selectedId = useStore($selectedInstanceId);
  const [name, setName] = useState("");
  const [flash, setFlash] = useState<string | null>(null);

  const handleCreate = () => {
    const sym = createSymbolFromSelection(name);
    if (sym) {
      setName("");
      setFlash(sym.id);
      setTimeout(() => setFlash(null), 1200);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", fontFamily: C.font, color: C.text }}>
      <div style={{ padding: "12px 12px 8px", borderBottom: `1px solid ${C.border}` }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.textDim, letterSpacing: "0.04em", marginBottom: 10 }}>
          {L.title}
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); }}
            placeholder={selectedId ? L.namePlaceholder : L.selectFirst}
            disabled={!selectedId}
            style={{
              flex: 1, padding: "5px 8px", background: "rgba(255,255,255,0.05)",
              border: `1px solid ${C.border}`, borderRadius: 5, color: C.text,
              fontSize: 13, fontFamily: C.font, outline: "none",
            }}
          />
          <button
            onClick={handleCreate}
            disabled={!selectedId}
            title={L.saveTitle}
            style={{
              padding: "5px 10px", borderRadius: 5, border: "none",
              background: selectedId ? "rgba(124,58,237,0.8)" : "rgba(255,255,255,0.06)",
              color: "#fff", fontSize: 13, fontWeight: 600,
              cursor: selectedId ? "pointer" : "default", flexShrink: 0,
            }}
          >
            {L.save}
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: 8 }}>
        {symbols.length === 0 ? (
          <div style={{ padding: "24px 12px", textAlign: "center", color: C.textMuted, fontSize: 13, lineHeight: 1.5 }}>
            {L.empty}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {symbols.map((sym) => (
              <div
                key={sym.id}
                style={{
                  display: "flex", alignItems: "center", gap: 8, padding: "8px 10px",
                  background: flash === sym.id ? "rgba(124,58,237,0.15)" : "rgba(255,255,255,0.02)",
                  border: `1px solid ${flash === sym.id ? "rgba(124,58,237,0.4)" : C.border}`,
                  borderRadius: 6, transition: "background 0.2s, border-color 0.2s",
                }}
              >
                <span style={{ fontSize: 14, opacity: 0.5 }}>◆</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {sym.name}
                  </div>
                  <div style={{ fontSize: 12, color: C.textMuted }}>{fmt(sym.instances.length === 1 ? L.elementOne : L.elementMany, { count: sym.instances.length })}</div>
                </div>
                <button
                  onClick={() => instantiateSymbol(sym)}
                  title={L.insertTitle}
                  style={{ padding: "3px 9px", borderRadius: 4, border: `1px solid ${C.border}`, background: "transparent", color: C.textDim, fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                >
                  {L.insert}
                </button>
                <button
                  onClick={() => deleteSymbol(sym.id)}
                  title={L.deleteTitle}
                  style={{ background: "none", border: "none", color: C.textMuted, cursor: "pointer", fontSize: 14, padding: "0 2px" }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
