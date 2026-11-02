"use client";

import { Icon, type IconName } from "@/builder/icons";
import { useEffect } from "react";
import Link from "next/link";
import { useStore } from "@nanostores/react";
import { $featureGate, closeFeatureGate } from "@/lib/nano-states";
import { UI_VARS as C, UI_SHAPE as S } from "@/lib/uiTheme";
import { useI18n } from "@/lib/i18n";

export function FeatureGateModal() {
  const { t } = useI18n();
  const G = t.chrome.featureGate;
  const gateState = useStore($featureGate);

  useEffect(() => {
    if (!gateState.isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeFeatureGate();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gateState.isOpen]);

  if (!gateState.isOpen) return null;

  const configMap = {
    save: {
      title: G.titleSave,
      desc: G.descSave,
      cta: G.ctaSave,
      badge: G.badgeFree,
      isPro: false,
      url: "/signup?callbackUrl=%2Fprojects&returnTo=%2Fbuilder%2Fdemo",
      icon: "floppy" as IconName,
    },
    "export-html": {
      title: G.titleExportHtml,
      desc: G.descExportHtml,
      cta: G.ctaExportHtml,
      badge: G.badgePro,
      isPro: true,
      url: "/pricing",
      icon: "package" as IconName,
    },
    deploy: {
      title: G.titleDeploy,
      desc: G.descDeploy,
      cta: G.ctaDeploy,
      badge: G.badgePro,
      isPro: true,
      url: "/pricing",
      icon: "rocket" as IconName,
    },
    assets: {
      title: G.titleAssets,
      desc: G.descAssets,
      cta: G.ctaAssets,
      badge: G.badgeFree,
      isPro: false,
      url: "/signup?callbackUrl=%2Fprojects&returnTo=%2Fbuilder%2Fdemo",
      icon: "assets" as IconName,
    },
    ai: {
      title: G.titleAI,
      desc: G.descAI,
      cta: G.ctaAI,
      badge: G.badgeFree,
      isPro: false,
      url: "/signup?callbackUrl=%2Fprojects&returnTo=%2Fbuilder%2Fdemo",
      icon: "ai" as IconName,
    },
  };
  const current = configMap[gateState.type] ?? configMap.save;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) closeFeatureGate();
      }}
      role="dialog"
      aria-modal="true"
      aria-label={current.title}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(17,17,17,0.42)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10000,
        fontFamily: C.font,
      }}
    >
      <div
        style={{
          width: 460,
          maxWidth: "calc(100vw - 32px)",
          background: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: S.radiusLg + 4,
          padding: 28,
          display: "flex",
          flexDirection: "column",
          gap: 18,
          boxShadow: C.shadowPop,
          position: "relative",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: 13,
              fontWeight: 600,
              padding: "4px 12px 4px 10px",
              borderRadius: S.radiusPill,
              background: C.accentBg,
              color: C.accentText,
              border: `1px solid ${C.accentBorder}`,
            }}
          >
            {current.isPro && <Icon name="crown" size={14} weight="fill" />}
            {current.badge}
          </span>
          <button
            onClick={closeFeatureGate}
            aria-label={G.cancel}
            style={{ background: "transparent", border: "none", color: C.textMuted, cursor: "pointer", width: 36, height: 36, borderRadius: S.radiusSm + 2, display: "inline-flex", alignItems: "center", justifyContent: "center" }}
          ><Icon name="close" size={16} weight="bold" /></button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{ width: 52, height: 52, borderRadius: S.radiusMd + 2, background: C.accentBg, color: C.accentText, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
          >
            <Icon name={current.icon} size={28} weight="duotone" />
          </div>
          <h2 style={{ margin: 0, fontSize: 21, fontWeight: 700, letterSpacing: "-0.015em", color: C.text, lineHeight: 1.25 }}>
            {current.title}
          </h2>
        </div>

        <p style={{ margin: 0, fontSize: 15, color: C.textMuted, lineHeight: 1.6 }}>
          {current.desc}
        </p>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 6 }}>
          <button
            onClick={closeFeatureGate}
            style={{ height: 44, padding: "0 20px", borderRadius: S.radiusMd, border: `1px solid ${C.border}`, background: C.card, color: C.textDim, fontSize: 15, fontFamily: C.font, cursor: "pointer", fontWeight: 500 }}
          >
            {G.cancel}
          </button>
          <Link
            href={current.url}
            onClick={closeFeatureGate}
            style={{ height: 44, padding: "0 22px", borderRadius: S.radiusMd, border: "none", background: C.primary, color: C.onPrimary, fontSize: 15, fontFamily: C.font, fontWeight: 700, cursor: "pointer", textDecoration: "none", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8 }}
          >
            {current.cta}
            <Icon name="arrowRight" size={16} weight="bold" />
          </Link>
        </div>
      </div>
    </div>
  );
}
