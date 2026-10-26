"use client";

import Link from "next/link";
import { PLAN_CARDS } from "@/lib/plans";
import { useI18n } from "@/lib/i18n";
import { planPriceVnd } from "@/lib/billing/planPrice";
import { IconCheck } from "@/components/landing/icons";

interface PricingGridProps {
  currentTier?: string;
  onSelectPlan: (tier: string) => void;
}

export default function PricingGrid({ currentTier, onSelectPlan }: PricingGridProps) {
  const { t, locale } = useI18n();

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20, marginBottom: 48 }}>
      {PLAN_CARDS.map((plan) => {
        const copy = t.pricing.planCopy[plan.tier] ?? { label: plan.label, features: plan.features, cta: plan.cta };
        const isCurrent = currentTier === plan.tier;

        return (
          <div
            key={plan.tier}
            style={{
              border: `1.5px solid ${plan.tier === "pro" ? "var(--brand-violet)" : isCurrent ? "rgba(106,57,187,0.5)" : "#e2e8f0"}`,
              borderRadius: 16, padding: "28px 24px",
              background: plan.tier === "pro" ? "var(--brand-tint)" : "#ffffff",
              display: "flex", flexDirection: "column", gap: 16,
              boxShadow: plan.tier === "pro" ? "0 0 0 4px rgba(106,57,187,0.12)" : "none",
              position: "relative",
            }}
          >
            {plan.tier === "pro" && (
              <div style={{ position: "absolute", top: -13, left: "50%", transform: "translateX(-50%)", background: "var(--brand-violet)", color: "#fff", fontSize: 12, fontWeight: 700, padding: "3px 12px", borderRadius: 999 }}>
                {t.pricing.mostPopular}
              </div>
            )}

            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", marginBottom: 8 }}>{copy.label}</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: plan.tier === "pro" ? "var(--brand-violet)" : "#0f172a", letterSpacing: "-0.02em", whiteSpace: "nowrap" }}>
                {planPriceVnd(plan.tier, locale)}
                <span style={{ fontSize: 14, fontWeight: 600, color: "#475569", letterSpacing: 0, marginLeft: 4 }}>{t.billing.perMonth}</span>
              </div>
            </div>

            <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
              {copy.features.map((f) => (
                <li key={f} style={{ fontSize: 14, color: "#374151", display: "flex", alignItems: "flex-start", gap: 8 }}>
                  <IconCheck width={16} height={16} style={{ color: "var(--brand-violet)", flexShrink: 0, marginTop: 2 }} /> {f}
                </li>
              ))}
            </ul>

            {isCurrent ? (
              <div style={{
                height: 44, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 15, fontWeight: 700,
                background: "var(--brand-tint)",
                color: "var(--brand-violet)",
                border: "1.5px solid rgba(106,57,187,0.3)",
                marginTop: "auto",
              }}>
                {t.billing.currentPlan}
              </div>
            ) : plan.tier === "free" ? (
              <Link
                href="/signup"
                style={{
                  height: 44, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 15, fontWeight: 700, textDecoration: "none",
                  background: "transparent",
                  color: "var(--brand-violet)",
                  border: "1.5px solid var(--brand-violet)",
                  marginTop: "auto",
                }}
              >
                {copy.cta}
              </Link>
            ) : (
              <button
                onClick={() => onSelectPlan(plan.tier)}
                style={{
                  height: 44, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 15, fontWeight: 700,
                  background: plan.tier === "pro" ? "var(--brand-violet)" : "transparent",
                  color: plan.tier === "pro" ? "#ffffff" : "var(--brand-violet)",
                  border: "1.5px solid var(--brand-violet)",
                  marginTop: "auto",
                  cursor: "pointer",
                  width: "100%",
                  fontFamily: "inherit",
                }}
              >
                {copy.cta}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
