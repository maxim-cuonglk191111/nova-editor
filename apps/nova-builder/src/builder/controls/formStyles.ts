// One look for the small forms of the left panels (new page, SEO, folders, publish): a 38px field
// on a white card, a quiet label, one filled button and one quiet one.
import type { CSSProperties } from "react";
import { UI_VARS as C, UI_SHAPE as S } from "@/lib/uiTheme";

export const fieldStyle: CSSProperties = {
  height: 38, padding: "0 12px", borderRadius: S.radiusSm + 2, border: `1px solid ${C.border}`, background: C.card,
  color: C.text, fontSize: 14, fontFamily: C.font, outline: "none", width: "100%", boxSizing: "border-box",
};

export const areaStyle: CSSProperties = { ...fieldStyle, height: "auto", padding: "10px 12px", resize: "vertical", lineHeight: 1.5 };

export const labelStyle: CSSProperties = { fontSize: 13, fontWeight: 500, color: C.textDim, fontFamily: C.font };

export const primaryButton = (disabled = false): CSSProperties => ({
  height: 38, padding: "0 16px", borderRadius: S.radiusSm + 2, border: "none",
  background: disabled ? C.accentBg : C.primary, color: disabled ? C.accentText : C.onPrimary,
  fontSize: 14, fontWeight: 700, fontFamily: C.font, cursor: disabled ? "not-allowed" : "pointer",
});

export const quietButton: CSSProperties = {
  height: 38, padding: "0 14px", borderRadius: S.radiusSm + 2, border: `1px solid ${C.border}`, background: C.card,
  color: C.textDim, fontSize: 14, fontFamily: C.font, cursor: "pointer",
};
