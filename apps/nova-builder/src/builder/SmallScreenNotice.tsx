"use client";
// The builder needs room for the canvas and its panels. On a phone-sized screen it says so, offers
// the way back, and lets the owner carry on anyway for this visit.
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import { useNarrow } from "@/lib/useNarrow";
import { UI_VARS as C, UI_SHAPE as S } from "@/lib/uiTheme";
import { Icon } from "./icons";

const KEY = "nova-small-screen-ok";

export function SmallScreenNotice({ isDemo }: { isDemo?: boolean }) {
  const { t } = useI18n();
  const router = useRouter();
  const small = useNarrow(699);
  const [dismissed, setDismissed] = useState(false);
  useEffect(() => { try { setDismissed(sessionStorage.getItem(KEY) === "1"); } catch { /* storage blocked */ } }, []);
  if (!small || dismissed) return null;

  const carryOn = () => { try { sessionStorage.setItem(KEY, "1"); } catch { /* ignore */ } setDismissed(true); };
  return (
    <div role="dialog" aria-modal="true" aria-label={t.chrome.smallScreenTitle} style={{ position: "fixed", inset: 0, zIndex: 20000, background: C.surface, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: C.font }}>
      <div style={{ width: "100%", maxWidth: 380, background: C.card, border: `1px solid ${C.border}`, borderRadius: S.radiusLg + 4, padding: 24, display: "flex", flexDirection: "column", gap: 16, boxShadow: C.shadowPop }}>
        <span style={{ width: 52, height: 52, borderRadius: S.radiusMd + 2, background: C.accentBg, color: C.accentText, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
          <Icon name="inspector" size={28} weight="duotone" />
        </span>
        <h2 style={{ margin: 0, fontSize: 21, fontWeight: 700, letterSpacing: "-0.015em", color: C.text, lineHeight: 1.25, textAlign: "left" }}>{t.chrome.smallScreenTitle}</h2>
        <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: C.textMuted, textAlign: "left" }}>{t.chrome.smallScreenBody}</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 4 }}>
          <button type="button" onClick={() => router.push(isDemo ? "/" : "/projects")} style={{ height: 48, borderRadius: S.radiusMd, border: "none", background: C.primary, color: C.onPrimary, fontSize: 15, fontWeight: 700, fontFamily: C.font, cursor: "pointer" }}>
            {isDemo ? t.builder.backToHome : t.builder.backToMySites}
          </button>
          <button type="button" onClick={carryOn} style={{ height: 48, borderRadius: S.radiusMd, border: `1px solid ${C.border}`, background: C.card, color: C.textDim, fontSize: 15, fontFamily: C.font, cursor: "pointer" }}>
            {t.chrome.smallScreenContinue}
          </button>
        </div>
      </div>
    </div>
  );
}
