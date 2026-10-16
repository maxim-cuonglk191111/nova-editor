"use client";
import { useRef, useEffect } from "react";
import { useStore } from "@nanostores/react";
import { $breakpoints, $styles, $styleSourceSelections } from "@/lib/data-stores";
import { updateData } from "@/lib/transactions";
import { uid } from "@/lib/uid";
import type { Breakpoint } from "@webstudio-is/sdk";
import { UI_VARS as C } from "@/lib/uiTheme";
import { useI18n } from "@/lib/i18n";
import { bpFriendlyName } from "./BreakpointPills";

const inputSt: React.CSSProperties = {
  background: C.inputBg,
  border: `1px solid ${C.border}`,
  borderRadius: 3,
  color: C.text,
  fontFamily: C.font,
  fontSize: 13,
  padding: "3px 6px",
  outline: "none",
};

export function BreakpointManager({ onClose }: { onClose: () => void }) {
  const { t } = useI18n();
  const B = t.inspector.breakpoints;
  const bps = useStore($breakpoints);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  // Close on Escape
  useEffect(() => {
    function handler(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  // Declared before the sort that calls it (a TDZ error crashed the builder on open).
  const isBase = (bp: Breakpoint) => bp.maxWidth == null && bp.minWidth == null;

  const sorted = [...bps.values()].sort((a, b) => {
    // Base (no min/max) first; then sort by minWidth desc so desktop → mobile
    if (isBase(a)) return -1;
    if (isBase(b)) return 1;
    const aMin = a.minWidth ?? 0;
    const bMin = b.minWidth ?? 0;
    return bMin - aMin;
  });

  function updateLabel(id: string, label: string) {
    updateData(({ breakpoints }) => {
      const bp = breakpoints.get(id);
      if (bp) breakpoints.set(id, { ...bp, label });
    });
  }

  function updateMaxWidth(id: string, raw: string) {
    const n = parseInt(raw, 10);
    updateData(({ breakpoints }) => {
      const bp = breakpoints.get(id);
      if (bp) breakpoints.set(id, { ...bp, maxWidth: isNaN(n) || n <= 0 ? undefined : n });
    });
  }

  function updateMinWidth(id: string, raw: string) {
    const n = parseInt(raw, 10);
    updateData(({ breakpoints }) => {
      const bp = breakpoints.get(id);
      if (bp) breakpoints.set(id, { ...bp, minWidth: isNaN(n) || n <= 0 ? undefined : n });
    });
  }

  function deleteBp(id: string) {
    const bp = bps.get(id);
    if (!bp || isBase(bp)) return;
    // The breakpoint's own styles go with it (one undoable step). Moving them to
    // Base, as before, applied phone-only styles to every screen size.
    updateData(({ breakpoints, styles }) => {
      breakpoints.delete(id);
      const stylesMap = styles as Map<string, { breakpointId: string }>;
      for (const [key, decl] of [...stylesMap.entries()]) {
        if (decl.breakpointId === id) stylesMap.delete(key);
      }
    });
  }

  function addBreakpoint() {
    const id = uid("bp_");
    updateData(({ breakpoints }) => {
      // Default to a min-width mobile-first breakpoint
      breakpoints.set(id, { id, label: "Mobile" /* i18n-ignore — stored breakpoint name */, minWidth: 0, maxWidth: 639 });
    });
  }

  function addPresetBreakpoint(name: string, minWidth?: number, maxWidth?: number) {
    const id = uid("bp_");
    updateData(({ breakpoints }) => {
      breakpoints.set(id, { id, label: name, minWidth, maxWidth });
    });
  }

  function getMediaCondition(bp: Breakpoint) {
    if (isBase(bp)) return `@media (all)`;
    if (bp.minWidth != null && bp.maxWidth != null) {
      return `@media (min-width: ${bp.minWidth}px) and (max-width: ${bp.maxWidth}px)`;
    }
    if (bp.maxWidth != null) {
      return `@media (max-width: ${bp.maxWidth}px)`;
    }
    if (bp.minWidth != null) {
      return `@media (min-width: ${bp.minWidth}px)`;
    }
    return `@media (all)`;
  }

  const devicePresets = [
    { key: "phone", label: B.presetPhone, minWidth: undefined, maxWidth: 479, query: "≤479px" },
    { key: "phoneLand", label: B.presetPhoneLand, minWidth: 480, maxWidth: 767, query: "≤767px" },
    { key: "tablet", label: B.presetTablet, minWidth: 768, maxWidth: 991, query: "≤991px" },
    { key: "laptop", label: B.presetLaptop, minWidth: 992, maxWidth: 1280, query: "≤1280px" },
  ];

  return (
    <div
      ref={ref}
      style={{
        position: "absolute",
        top: "calc(100% + 4px)",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 200,
        background: C.bg,
        border: `1px solid ${C.border}`,
        borderRadius: 6,
        boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
        padding: "10px 12px",
        minWidth: 440,
        fontFamily: C.font,
      }}
    >
      <div style={{ fontSize: 12, color: C.textMuted, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 8 }}>
        {B.title}
      </div>

      {/* Header row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 100px 100px 24px", gap: 6, marginBottom: 4 }}>
        <span style={{ fontSize: 9, color: C.textMuted, textTransform: "uppercase" }}>{B.label}</span>
        <span style={{ fontSize: 9, color: C.textMuted, textTransform: "uppercase" }}>{B.min}</span>
        <span style={{ fontSize: 9, color: C.textMuted, textTransform: "uppercase" }}>{B.max}</span>
        <span />
      </div>

      {sorted.map((bp) => (
        <div key={bp.id} style={{ marginBottom: 6 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 100px 100px 24px", gap: 6, alignItems: "center" }}>
            <input
              // Same name as the breakpoint buttons above (stored English defaults are shown translated).
              value={bpFriendlyName(bp, t.tools.breakpointPills)}
              onChange={(e) => updateLabel(bp.id, e.target.value)}
              style={{ ...inputSt, width: "100%" }}
            />
            <input
              type="number"
              min={0}
              value={bp.minWidth ?? ""}
              placeholder={isBase(bp) ? "—" : "px"}
              disabled={isBase(bp)}
              onChange={(e) => updateMinWidth(bp.id, e.target.value)}
              style={{ ...inputSt, width: "100%", opacity: isBase(bp) ? 0.4 : 1 }}
            />
            <input
              type="number"
              min={1}
              value={bp.maxWidth ?? ""}
              placeholder={isBase(bp) ? "—" : "px"}
              title={isBase(bp) ? B.allSizes : undefined}
              disabled={isBase(bp)}
              onChange={(e) => updateMaxWidth(bp.id, e.target.value)}
              style={{ ...inputSt, width: "100%", opacity: isBase(bp) ? 0.4 : 1 }}
            />
            <button
              onClick={() => deleteBp(bp.id)}
              disabled={isBase(bp)}
              title={isBase(bp) ? B.baseCannotDelete : B.deleteBreakpoint}
              style={{
                background: "none",
                border: "none",
                color: isBase(bp) ? "rgba(255,255,255,0.1)" : C.danger,
                cursor: isBase(bp) ? "default" : "pointer",
                fontSize: 16,
                lineHeight: 1,
                padding: "0 2px",
              }}
            >×</button>
          </div>
          {/* Two-level hint: technical CSS media condition */}
          <div style={{ paddingLeft: 2, marginTop: 2 }}>
            <span style={{ fontSize: 10, color: C.textMuted, fontFamily: C.fontMono, opacity: 0.65 }}>
              {getMediaCondition(bp)}
            </span>
          </div>
        </div>
      ))}

      {/* Device Presets quick bar */}
      <div style={{ marginTop: 8, paddingTop: 6, borderTop: `1px solid ${C.border}` }}>
        <div style={{ fontSize: 10, color: C.textMuted, marginBottom: 4, fontWeight: 600 }}>
          {B.presets}:
        </div>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 6 }}>
          {devicePresets.map((dp) => (
            <button
              key={dp.key}
              onClick={() => addPresetBreakpoint(dp.label, dp.minWidth, dp.maxWidth)}
              title={`${dp.label} (${dp.query})`}
              style={{
                padding: "2px 8px",
                background: "rgba(255,255,255,0.04)",
                border: `1px solid ${C.border}`,
                borderRadius: 4,
                color: C.text,
                fontSize: 11,
                fontFamily: C.font,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <span>{dp.label}</span>
              <span style={{ fontSize: 9, color: C.textMuted, fontFamily: C.fontMono }}>{dp.query}</span>
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={addBreakpoint}
        style={{
          marginTop: 4,
          width: "100%",
          padding: "4px 0",
          background: "rgba(124,58,237,0.12)",
          border: `1px dashed rgba(124,58,237,0.4)`,
          borderRadius: 4,
          color: C.accentText,
          fontSize: 13,
          fontFamily: C.font,
          cursor: "pointer",
        }}
      >
        {B.add}
      </button>
    </div>
  );
}
