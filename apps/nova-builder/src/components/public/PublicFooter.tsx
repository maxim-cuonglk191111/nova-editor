"use client";
import Link from "next/link";
import { useI18n, fmt } from "@/lib/i18n";

interface PublicFooterProps {
  theme?: "light" | "dark";
}

export function PublicFooter({ theme = "light" }: PublicFooterProps) {
  const isDark = theme === "dark";
  const S = useI18n().t.site;

  return (
    <footer style={{
      borderTop: isDark ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid #e2e8f0",
      background: isDark ? "#090a0b" : "#f8fafc",
      padding: "32px 32px 24px"
    }}>
      <div style={{ maxWidth: 1120, margin: "0 auto", display: "flex", flexWrap: "wrap", gap: 24, justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 14, color: isDark ? "#9f9fa0" : "#475569", fontFamily: isDark ? "var(--font-suisse-intl)" : "inherit" }}>
          {fmt(S.footerRights, { year: new Date().getFullYear() })}
        </div>
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
          {[
            { href: "/pricing", label: S.footerPricing },
            { href: "/terms", label: S.footerTerms },
            { href: "/privacy", label: S.footerPrivacy },
            { href: "mailto:support@nova.build", label: S.footerSupport },
          ].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              style={{
                fontSize: 14,
                color: isDark ? "#9f9fa0" : "#475569",
                textDecoration: "none",
                fontFamily: isDark ? "var(--font-suisse-intl)" : "inherit",
                transition: "color 0.2s"
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = isDark ? "#ffffff" : "#6d28d9"}
              onMouseLeave={(e) => e.currentTarget.style.color = isDark ? "#9f9fa0" : "#475569"}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
