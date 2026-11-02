"use client";
import Link from "next/link";
import { useLegacyCopy } from "./useLegacyCopy";

export function LegacyFooter() {
  const { site } = useLegacyCopy();
  const link = { fontSize: 14, color: "#9f9fa0", textDecoration: "none", fontFamily: "var(--font-suisse-intl)", transition: "color 0.2s" } as const;

  return (
    <footer style={{ borderTop: "1px solid rgba(255, 255, 255, 0.08)", background: "#090a0b", padding: "32px 32px 24px" }}>
      <div style={{ maxWidth: 1120, margin: "0 auto", display: "flex", flexWrap: "wrap", gap: 24, justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 14, color: "#9f9fa0", fontFamily: "var(--font-suisse-intl)" }}>
          {site.footerRights.replace("{year}", String(new Date().getFullYear()))}
        </div>
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
          {[
            { href: "/pricing", label: site.footerPricing },
            { href: "/terms", label: site.footerTerms },
            { href: "/privacy", label: site.footerPrivacy },
            { href: "mailto:support@nova.build", label: site.footerSupport },
          ].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              style={link}
              onMouseEnter={(e) => { e.currentTarget.style.color = "#ffffff"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "#9f9fa0"; }}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
