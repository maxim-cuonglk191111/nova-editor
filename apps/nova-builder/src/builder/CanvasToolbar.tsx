"use client";
// The pill that floats at the bottom of the canvas: AI, add, and the zoom controls (they used to
// live in the top bar). It sits in the same grid cell as the canvas, so it never scrolls with it.
import { useStore } from "@nanostores/react";
import { $canvasZoom, $fitToWidthTrigger } from "@/lib/nano-states";
import { UI_VARS as C, UI_SHAPE as S } from "@/lib/uiTheme";
import { useI18n } from "@/lib/i18n";
import { requestSidebarTab } from "./left-sidebar/sidebarTab";
import { useToggleAIPanel } from "./useToggleAIPanel";
import { Icon } from "./icons";

const MIN_ZOOM = 0.1;
const MAX_ZOOM = 3;
const stepZoom = (delta: number) => $canvasZoom.set(Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round(($canvasZoom.get() + delta) * 100) / 100)));

export function CanvasToolbar({ isDemo }: { isDemo?: boolean }) {
  const { t } = useI18n();
  const zoom = useStore($canvasZoom);
  const ai = useToggleAIPanel(isDemo);

  const btn = { width: S.controlLg - 4, height: S.controlLg - 4, border: "none", borderRadius: S.radiusMd, background: "transparent", color: C.text, fontSize: 18, fontFamily: C.font, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", padding: 0 } as const;
  const divider = <span aria-hidden="true" style={{ width: 1, height: 24, background: C.border, margin: "0 4px" }} />;

  return (
    <div role="toolbar" aria-label={t.chrome.canvasToolbar} style={{ gridArea: "main", alignSelf: "end", justifySelf: "center", marginBottom: 20, zIndex: 20, display: "flex", alignItems: "center", gap: 2, padding: 6, background: C.card, border: `1px solid ${C.border}`, borderRadius: S.radiusLg, boxShadow: C.shadowPop }}>
      <button type="button" onClick={ai.toggle} title={t.chrome.canvasAi} aria-label={t.chrome.canvasAi} aria-pressed={ai.open} style={{ ...btn, background: ai.open ? C.accentBg : "transparent", color: C.accentText }}><Icon name="ai" size={22} weight="fill" /></button>
      <button type="button" onClick={() => requestSidebarTab("components")} title={t.chrome.canvasAdd} aria-label={t.chrome.canvasAdd} style={btn}><Icon name="plus" size={22} weight="bold" /></button>
      {divider}
      <button type="button" onClick={() => stepZoom(-0.1)} title={t.chrome.zoomOut} aria-label={t.chrome.zoomOut} style={btn}><Icon name="zoomOut" size={22} /></button>
      <button type="button" onClick={() => $canvasZoom.set(1)} title={t.chrome.zoomReset} style={{ ...btn, width: "auto", minWidth: 56, padding: "0 6px", fontSize: 14, fontWeight: zoom !== 1 ? 700 : 500, color: zoom !== 1 ? C.accentText : C.textMuted }}>
        {Math.round(zoom * 100)}%
      </button>
      <button type="button" onClick={() => stepZoom(0.1)} title={t.chrome.zoomIn} aria-label={t.chrome.zoomIn} style={btn}><Icon name="zoomIn" size={22} /></button>
      <button type="button" onClick={() => $fitToWidthTrigger.set($fitToWidthTrigger.get() + 1)} title={t.chrome.zoomFit} aria-label={t.chrome.zoomFit} style={btn}><Icon name="fit" size={22} /></button>
    </div>
  );
}
