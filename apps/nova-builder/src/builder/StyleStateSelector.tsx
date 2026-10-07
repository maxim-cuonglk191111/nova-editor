"use client";
// CSS pseudo-state selector. Pills wrap instead of clipping at the panel edge
// (WS-PARITY-AUDIT §8b V-2); rendering via the shared ToggleGroup (MV2).
import { useStore } from "@nanostores/react";
import { $selectedState, type CSSState } from "@/lib/nano-states";
import { UI_VARS as C } from "@/lib/uiTheme";
import { useI18n } from "@/lib/i18n";
import { ToggleGroup } from "./controls/ToggleGroup";

// Pseudo-state selectors are CSS syntax and stay untranslated.
const PSEUDO_STATES: { label: string; value: CSSState }[] = [
  { label: ":hover", value: ":hover" },
  { label: ":focus", value: ":focus" },
  { label: ":focus-within", value: ":focus-within" },
  { label: ":active", value: ":active" },
  { label: ":disabled", value: ":disabled" },
  { label: ":placeholder", value: ":placeholder" },
];

export function StateSelector() {
  const { t } = useI18n();
  const selected = useStore($selectedState);
  const states = [{ label: t.inspector.stateDefault, value: "" as CSSState }, ...PSEUDO_STATES];
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
        mono
        options={states}
        value={selected}
        onChange={(value) => $selectedState.set(value)}
      />
    </div>
  );
}
