"use client";
// Progressive disclosure (task 007): transform, motion, filters and grid tracks
// take CSS-shaped input a first-time user cannot fill in unaided. They live in
// one collapsed group; it opens by itself when the element already uses one.
import { Icon } from "@/builder/icons";
import type { ReactNode } from "react";
import { UI_VARS as C } from "@/lib/uiTheme";
import { useI18n } from "@/lib/i18n";

export function AdvancedEffects({ inUse, children }: { inUse: boolean; children: ReactNode }) {
  const { t } = useI18n();
  return (
    <details open={inUse} style={{ borderTop: `1px solid ${C.border}` }}>
      <summary
        style={{
          padding: "8px 16px",
          minHeight: 48,
          boxSizing: "border-box",
          fontFamily: C.font,
          color: C.text,
          cursor: "pointer",
          listStyle: "none",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: "block", fontSize: 15, fontWeight: 600 }}>{t.inspector.advancedEffects}</span>
          <span style={{ display: "block", fontSize: 12, fontWeight: 400, color: C.textMuted, marginTop: 2 }}>
            {t.inspector.advancedEffectsHint}
          </span>
        </span>
        <span className="nb-section-sign" style={{ color: C.textMuted, alignItems: "center" }}>
          <span className="nb-sign-plus"><Icon name="plus" size={16} weight="bold" /></span>
          <span className="nb-sign-minus"><Icon name="minus" size={16} weight="bold" /></span>
        </span>
      </summary>
      {children}
    </details>
  );
}
