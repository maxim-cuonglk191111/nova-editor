"use client";
import { Icon } from "./icons";
import { useStore } from "@nanostores/react";
import { $safeModeActive, $commandPaletteOpen } from "@/lib/nano-states";
import { UI_VARS as C, FONT } from "@/lib/uiTheme";
import { useI18n } from "@/lib/i18n";

// Safe-mode banner — shown when the active page has no elements.
// Floating above the canvas, prompts the user to add their first component.
// Dismissed automatically once instances appear (atom is computed, not toggled).
export function SafeModeBanner() {
  const active = useStore($safeModeActive);
  const { t } = useI18n();

  if (!active) return null;

  return (
    <div
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        zIndex: 20,
        background: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: 20,
        padding: "32px 40px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 14,
        boxShadow: C.shadowPop,
        textAlign: "center",
        maxWidth: 360,
        pointerEvents: "all",
      }}
    >
      <div style={{ width: 56, height: 56, borderRadius: 16, background: C.accentBg, color: C.accentText, display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="newPage" size={30} weight="duotone" /></div>
      <div style={{ fontSize: 19, fontWeight: 700, letterSpacing: "-0.01em", color: C.text, fontFamily: C.font }}>
        {t.builder.safeModeTitle}
      </div>
      <div style={{ fontSize: 15, color: C.textMuted, fontFamily: C.font, lineHeight: 1.55 }}>
        {t.builder.safeModeBody}
      </div>
      <button
        onClick={() => $commandPaletteOpen.set(true)}
        style={{
          height: 44,
          padding: "0 24px",
          borderRadius: 12,
          border: "none",
          background: C.primary,
          color: C.onPrimary,
          fontSize: 15,
          fontFamily: C.font,
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        {t.builder.safeModeAction}
      </button>
    </div>
  );
}
