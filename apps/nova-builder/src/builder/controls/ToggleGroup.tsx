"use client";
// Shared toggle-group control (MV2, ADR-NB-020): a segmented control, a row of mutually-exclusive
// options on one rounded track with the chosen one raised. Wraps instead of clipping
// (broken-layout register V-2).
import { UI_VARS as C, UI_SHAPE as S, FONT } from "@/lib/uiTheme";

export type ToggleOption<V extends string> = { label: string; value: V; title?: string };

export function ToggleGroup<V extends string>({
  options,
  value,
  onChange,
  mono = false,
  fill = true,
}: {
  options: ToggleOption<V>[];
  value: V;
  onChange: (value: V) => void;
  mono?: boolean;
  /** Options share the row evenly (default); false lets each keep its own width and wrap from the left. */
  fill?: boolean;
}) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 2, padding: 3, background: C.surface, border: `1px solid ${C.border}`, borderRadius: S.radiusMd }}>
      {options.map((option) => {
        const active = value === option.value;
        return (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            title={option.title}
            aria-pressed={active}
            style={{
              flex: fill ? "1 1 auto" : "0 0 auto",
              padding: "0 10px",
              minHeight: 30,
              borderRadius: S.radiusSm + 1,
              border: "none",
              background: active ? C.card : "transparent",
              boxShadow: active ? C.shadowSoft : "none",
              color: active ? C.text : C.textMuted,
              fontSize: FONT.sm,
              fontFamily: mono ? C.fontMono : C.font,
              fontWeight: active ? 700 : 500,
              cursor: "pointer",
              whiteSpace: "nowrap",
              lineHeight: "18px",
              transition: "all 0.1s",
            }}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
