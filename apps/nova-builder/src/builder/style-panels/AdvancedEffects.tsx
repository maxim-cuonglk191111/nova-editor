"use client";
// Progressive disclosure (task 007): transform, motion, filters and grid tracks
// take CSS-shaped input a first-time user cannot fill in unaided. They live in
// one collapsed group; it opens by itself when the element already uses one.
import type { ReactNode } from "react";
import { UI_VARS as C, FONT } from "@/lib/uiTheme";
import { useI18n } from "@/lib/i18n";

export function AdvancedEffects({ inUse, children }: { inUse: boolean; children: ReactNode }) {
  const { t } = useI18n();
  return (
    <details open={inUse} style={{ borderTop: `1px solid ${C.border}` }}>
      <summary
        style={{
          padding: "8px 12px",
          fontSize: FONT.xs,
          fontFamily: C.font,
          color: C.text,
          fontWeight: 700,
          letterSpacing: "0.07em",
          textTransform: "uppercase",
          cursor: "pointer",
        }}
      >
        {t.inspector.advancedEffects}
        <div style={{ fontSize: 11, fontWeight: 400, letterSpacing: 0, textTransform: "none", color: C.textMuted, marginTop: 2 }}>
          {t.inspector.advancedEffectsHint}
        </div>
      </summary>
      {children}
    </details>
  );
}
