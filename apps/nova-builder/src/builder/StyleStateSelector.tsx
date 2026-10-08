"use client";
// CSS pseudo-state selector. Pills wrap instead of clipping at the panel edge
// (WS-PARITY-AUDIT §8b V-2); rendering via the shared ToggleGroup (MV2).
import { useStore } from "@nanostores/react";
import { $selectedState, type CSSState } from "@/lib/nano-states";
import { UI_VARS as C } from "@/lib/uiTheme";
import { useI18n } from "@/lib/i18n";
import { ToggleGroup } from "./controls/ToggleGroup";

// Pills read in plain language ("Mouse over"); the CSS name and an explanation
// are the tooltip (task 007: ":focus-within" meant nothing to site owners).
const PSEUDO_STATES: CSSState[] = [":hover", ":focus", ":focus-within", ":active", ":disabled", ":placeholder"];

export function StateSelector() {
  const { t } = useI18n();
  const selected = useStore($selectedState);
  const states = [
    { label: t.inspector.stateDefault, value: "" as CSSState },
    ...PSEUDO_STATES.map((value) => ({
      value,
      label: t.inspector.stateLabels[value] ?? value,
      title: `${value} — ${t.inspector.stateHints[value]}`,
    })),
  ];
  const hasNonDefault = selected !== "";

  return (
    <div
      style={{
        padding: "5px 8px",
        borderBottom: `1px solid ${C.border}`,
        flexShrink: 0,
        background: hasNonDefault ? "rgba(124,58,237,0.06)" : "transparent",
      }}
    >
      <ToggleGroup
        options={states}
        value={selected}
        onChange={(value) => $selectedState.set(value)}
      />
    </div>
  );
}
