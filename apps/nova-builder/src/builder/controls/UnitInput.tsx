"use client";
// Shared numeric-with-unit control (MV2, ADR-NB-020). Mirrors Webstudio's
// unit input pattern: number field + unit select. Commits on blur/Enter and
// on arrow-key nudge (Shift = ×10), like the style-panel inputs.
import { useEffect, useRef } from "react";
import { UI_VARS as C, FONT } from "@/lib/uiTheme";
import { clampNumericStyleValue } from "@/lib/styleWriteHelper";

export const COMMON_UNITS = ["px", "%", "rem", "em", "vw", "vh", "fr", "ch", "deg", "s", "ms"];

export function UnitInput({
  value,
  unit,
  units = COMMON_UNITS,
  property,
  onCommit,
}: {
  value: number;
  unit: string;
  units?: string[];
  property?: string;
  onCommit: (value: number, unit: string) => void;
}) {
  // Uncontrolled while typing, but must follow the store when the value changes
  // underneath (another element selected, undo, breakpoint switch).
  const inputRef = useRef<HTMLInputElement>(null);
  const selectRef = useRef<HTMLSelectElement>(null);
  useEffect(() => {
    if (inputRef.current && document.activeElement !== inputRef.current) inputRef.current.value = String(value);
    if (selectRef.current) selectRef.current.value = unit;
  }, [value, unit]);
  const commitRaw = (raw: string) => {
    const sanitized = raw.trim().replace(/,/g, ".");
    const parsed = parseFloat(sanitized);
    if (!isNaN(parsed)) {
      const clamped = clampNumericStyleValue(property ?? "", parsed, unit);
      if (inputRef.current) inputRef.current.value = String(clamped);
      onCommit(clamped, unit);
    }
  };

  return (
    <div style={{ display: "flex", gap: 3, alignItems: "center", minWidth: 0, width: "100%" }}>
      <input
        ref={inputRef}
        type="text"
        inputMode="decimal"
        defaultValue={value}
        title={`${value}${unit && unit !== "number" ? unit : ""}`}
        onChange={(e) => {
          if (e.target.value.includes(",")) {
            e.target.value = e.target.value.replace(/,/g, ".");
          }
        }}
        onBlur={(e) => commitRaw(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          if (e.key === "ArrowUp" || e.key === "ArrowDown") {
            e.preventDefault();
            const step = e.shiftKey ? 10 : 1;
            const dir = e.key === "ArrowUp" ? 1 : -1;
            const cur = parseFloat((e.target as HTMLInputElement).value.replace(/,/g, ".")) || 0;
            const next = clampNumericStyleValue(property ?? "", cur + dir * step, unit);
            (e.target as HTMLInputElement).value = String(next);
            onCommit(next, unit);
          }
        }}
        style={{
          minWidth: 58,
          width: "100%",
          padding: "3px 6px",
          minHeight: 22,
          background: C.inputBg,
          border: `1px solid ${C.border}`,
          borderRadius: 3,
          color: C.text,
          fontFamily: C.fontMono,
          fontSize: FONT.sm,
          outline: "none",
          boxSizing: "border-box",
        }}
      />
      <select
        ref={selectRef}
        defaultValue={unit}
        onChange={(e) => onCommit(value, e.target.value)}
        style={{
          padding: "3px 4px",
          minHeight: 22,
          background: C.inputBg,
          border: `1px solid ${C.border}`,
          borderRadius: 3,
          color: C.textMuted,
          fontFamily: C.fontMono,
          fontSize: FONT.xs,
          outline: "none",
          cursor: "pointer",
          flexShrink: 0,
        }}
      >
        {units.map((u) => (
          <option key={u} value={u}>
            {u === "" || u === "number" ? "–" : u}
          </option>
        ))}
      </select>
    </div>
  );
}
