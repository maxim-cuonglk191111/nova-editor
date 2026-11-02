"use client";
// The centred switch of the top bar. Nova has two ways of looking at a site: the editor (this
// screen) and the preview, which opens in its own tab, so "Design" is always the current one.
import { UI_VARS as C, UI_SHAPE as S } from "@/lib/uiTheme";
import { useI18n } from "@/lib/i18n";
import { usePreview } from "./usePreview";

export function ModeSwitch({ isDemo }: { isDemo?: boolean }) {
  const { t } = useI18n();
  const openPreview = usePreview(isDemo);
  const segment = { height: S.controlLg - 8, padding: "0 18px", border: "none", borderRadius: S.radiusMd - 2, fontSize: 14, fontFamily: C.font, fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 } as const;
  return (
    <div role="group" aria-label={t.chrome.modeSwitch} style={{ display: "inline-flex", alignItems: "center", gap: 2, padding: 4, background: C.surface, border: `1px solid ${C.border}`, borderRadius: S.radiusMd + 2 }}>
      <button type="button" aria-pressed="true" style={{ ...segment, background: C.card, color: C.text, boxShadow: C.shadowSoft, cursor: "default" }}>
        {t.chrome.design}
      </button>
      <button type="button" aria-pressed="false" onClick={openPreview} title={t.chrome.previewOpensTab} style={{ ...segment, background: "transparent", color: C.textMuted }}>
        {t.chrome.preview}
        <span aria-hidden="true" style={{ fontSize: 12 }}>↗</span>
      </button>
    </div>
  );
}
