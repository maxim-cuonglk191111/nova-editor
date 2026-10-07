"use client";
import type { Breakpoint } from "@webstudio-is/sdk";
import { UI_VARS as C } from "@/lib/uiTheme";
import { useI18n } from "@/lib/i18n";
import type { I18nBreakpointPillsDictionary } from "@/lib/i18n";


export function bpFriendlyName(bp: Breakpoint, L: I18nBreakpointPillsDictionary): string {
  if (!bp.maxWidth && !bp.minWidth) return L.desktop;
  if (bp.label) {
    const lower = bp.label.toLowerCase();
    if (lower.includes("mobile") || lower.includes("phone")) {
      // Two default mobile breakpoints exist; keep them distinguishable.
      if (lower.includes("landscape")) return L.mobileLandscape;
      if (lower.includes("portrait")) return L.mobilePortrait;
      return L.mobile;
    }
    if (lower.includes("tablet")) return L.tablet;
    if (lower.includes("desktop") || lower.includes("wide") || lower.includes("xl")) return L.desktop;
    return bp.label;
  }
  if (bp.maxWidth && bp.maxWidth <= 640) return L.mobile;
  if (bp.maxWidth && bp.maxWidth <= 1024) return L.tablet;
  return L.desktop;
}

export function BreakpointPill({
  bp,
  active,
  onClick,
}: {
  bp: Breakpoint;
  active: boolean;
  onClick: () => void;
}) {
  const L = useI18n().t.tools.breakpointPills;
  const label = bpFriendlyName(bp, L);
  const pxHint = bp.maxWidth != null ? `≤${bp.maxWidth}px` : bp.minWidth != null ? `≥${bp.minWidth}px` : L.allSizes;

  return (
    <button
      onClick={onClick}
      title={pxHint}
      style={{
        padding: "3px 11px",
        borderRadius: 20,
        border: `1px solid ${active ? C.accentBorder : C.border}`,
        background: active ? C.accentBg : "transparent",
        color: active ? C.accentText : C.textMuted,
        fontSize: 13,
        fontFamily: C.font,
        fontWeight: active ? 600 : 400,
        cursor: "pointer",
        whiteSpace: "nowrap",
        lineHeight: "18px",
        transition: "all 0.12s",
      }}
    >
      {label}
    </button>
  );
}
