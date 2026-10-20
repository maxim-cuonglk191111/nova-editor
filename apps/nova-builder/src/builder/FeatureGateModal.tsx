"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useStore } from "@nanostores/react";
import { $featureGate, closeFeatureGate } from "@/lib/nano-states";
import { UI_VARS as C } from "@/lib/uiTheme";
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
      icon: "💾",
    },
    "export-html": {
      title: G.titleExportHtml,
      desc: G.descExportHtml,
      cta: G.ctaExportHtml,
      badge: G.badgePro,
      isPro: true,
      url: "/pricing",
      icon: "📦",
    },
    deploy: {
      title: G.titleDeploy,
      desc: G.descDeploy,
      cta: G.ctaDeploy,
      badge: G.badgePro,
      isPro: true,
      url: "/pricing",
      icon: "🚀",
    },
    assets: {
      title: G.titleAssets,
      desc: G.descAssets,
      cta: G.ctaAssets,
      badge: G.badgeFree,
      isPro: false,
      url: "/signup?callbackUrl=%2Fprojects&returnTo=%2Fbuilder%2Fdemo",
      icon: "🖼️",
    },
    ai: {
      title: G.titleAI,
      desc: G.descAI,
      cta: G.ctaAI,
      badge: G.badgeFree,
      isPro: false,
      url: "/signup?callbackUrl=%2Fprojects&returnTo=%2Fbuilder%2Fdemo",
      icon: "✦",
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
        background: "rgba(0,0,0,0.72)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10000,
        fontFamily: C.font,
      }}
    >
      <div
        style={{
          width: 440,
          maxWidth: "calc(100vw - 32px)",
          background: C.surface || "#1e293b",
          border: `1px solid ${current.isPro ? "rgba(168,85,247,0.35)" : C.border || "rgba(255,255,255,0.12)"}`,
          borderRadius: 16,
          padding: "30px 32px",
          display: "flex",
          flexDirection: "column",
          gap: 16,
          boxShadow: current.isPro
            ? "0 24px 50px rgba(0,0,0,0.6), 0 0 40px rgba(168,85,247,0.15)"
            : "0 24px 50px rgba(0,0,0,0.6)",
          position: "relative",
        }}
      >
        {/* Header line with badge and close */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              padding: "3px 9px",
              borderRadius: 6,
              background: current.isPro ? "rgba(168,85,247,0.18)" : "rgba(59,130,246,0.18)",
              color: current.isPro ? "#c084fc" : "#93c5fd",
              border: `1px solid ${current.isPro ? "rgba(168,85,247,0.35)" : "rgba(59,130,246,0.35)"}`,
            }}
          >
            {current.badge}
          </span>
          <button
            onClick={closeFeatureGate}
            aria-label={G.cancel}
            style={{
              background: "transparent",
              border: "none",
              color: C.textMuted || "rgba(255,255,255,0.45)",
              fontSize: 20,
              cursor: "pointer",
              lineHeight: 1,
              padding: "2px 6px",
              borderRadius: 4,
            }}
          >
            ×
          </button>
        </div>

        {/* Icon & Title */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 4 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: current.isPro ? "rgba(168,85,247,0.12)" : "rgba(59,130,246,0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 22,
              flexShrink: 0,
            }}
          >
            {current.icon}
          </div>
          <h2
            style={{
              margin: 0,
              fontSize: 18,
              fontWeight: 700,
              color: C.text || "#fff",
              lineHeight: 1.3,
            }}
          >
            {current.title}
          </h2>
        </div>

        {/* Description body */}
        <p
          style={{
            margin: 0,
            fontSize: 13,
            color: C.textMuted || "rgba(255,255,255,0.65)",
            lineHeight: 1.6,
          }}
        >
          {current.desc}
        </p>

        {/* Actions */}
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 12 }}>
          <button
            onClick={closeFeatureGate}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              border: `1px solid ${C.border || "rgba(255,255,255,0.12)"}`,
              background: "transparent",
              color: C.textMuted || "rgba(255,255,255,0.6)",
              fontSize: 13,
              fontFamily: C.font,
              cursor: "pointer",
              fontWeight: 500,
            }}
          >
            {G.cancel}
          </button>
          <Link
            href={current.url}
            onClick={closeFeatureGate}
            style={{
              padding: "8px 20px",
              borderRadius: 8,
              border: "none",
              background: current.isPro
                ? "linear-gradient(135deg, #9333ea 0%, #7c3aed 100%)"
                : "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)",
              color: "#fff",
              fontSize: 13,
              fontFamily: C.font,
              fontWeight: 700,
              cursor: "pointer",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: current.isPro
                ? "0 4px 14px rgba(147,51,234,0.4)"
                : "0 4px 14px rgba(124,58,237,0.35)",
            }}
          >
            {current.cta}
          </Link>
        </div>
      </div>
    </div>
  );
}
