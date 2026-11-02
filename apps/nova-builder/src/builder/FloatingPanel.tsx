"use client";
// The frame the tool panels share (History, Accessibility, Performance, AI content): a 56px header
// with an icon, the title and a close button, on a rounded card that floats beside the inspector.
import type { ReactNode } from "react";
import { UI_VARS as C, UI_SHAPE as S } from "@/lib/uiTheme";
import { Icon, type IconName } from "./icons";
import { useI18n } from "@/lib/i18n";

type Props = {
  /** Accessible name of the dialog. */
  label: string;
  title: string;
  icon: IconName;
  onClose: () => void;
  width?: number;
  /** "side" sits left of the inspector; "center" hangs from the top bar's middle. */
  place?: "side" | "center";
  children: ReactNode;
};

const INSPECTOR_WIDTH = 304;

export function FloatingPanel({ label, title, icon, onClose, width = 380, place = "side", children }: Props) {
  const { t } = useI18n();
  const position = place === "center"
    ? { left: "50%", transform: "translateX(-50%)", maxWidth: "calc(100vw - 32px)" }
    : { right: INSPECTOR_WIDTH + 12 };
  return (
    <div
      role="dialog"
      aria-label={label}
      style={{
        position: "fixed", top: S.topbar + 8, width, maxHeight: "72vh", zIndex: 100, ...position,
        background: C.card, border: `1px solid ${C.border}`, borderRadius: S.radiusLg, boxShadow: C.shadowPop,
        fontFamily: C.font, overflow: "hidden", display: "flex", flexDirection: "column",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, minHeight: 56, padding: "0 12px 0 16px", borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
        <span style={{ display: "inline-flex", color: C.accentText }}><Icon name={icon} size={20} weight="duotone" /></span>
        <span style={{ flex: 1, fontSize: 16, fontWeight: 700, letterSpacing: "-0.01em", color: C.text }}>{title}</span>
        <button type="button" onClick={onClose} aria-label={t.sidebar.components.close} style={{ width: 36, height: 36, border: "none", borderRadius: S.radiusSm + 2, background: "transparent", color: C.textMuted, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
          <Icon name="close" size={16} weight="bold" />
        </button>
      </div>
      {children}
    </div>
  );
}

/** The one filled button inside a tool panel. */
export const panelPrimary = (disabled?: boolean) => ({
  height: 36, padding: "0 16px", borderRadius: S.radiusMd, border: "none",
  background: disabled ? C.accentBg : C.primary, color: disabled ? C.accentText : C.onPrimary,
  fontSize: 14, fontFamily: C.font, fontWeight: 700, cursor: disabled ? "default" : "pointer",
} as const);

/** A quiet button for the second action. */
export const panelQuiet = {
  height: 36, padding: "0 14px", borderRadius: S.radiusMd, border: `1px solid ${C.border}`, background: C.card,
  color: C.textDim, fontSize: 14, fontFamily: C.font, cursor: "pointer",
} as const;
