"use client";
// Shared collapsible panel section (MV2, ADR-NB-020): a native <details> whose header shows the
// group name, an optional count and a +/− sign (the sign comes from CSS, so it follows `open`).
import type { ReactNode } from "react";
import { UI_VARS as C } from "@/lib/uiTheme";

export function CollapsibleSection({
  title,
  badge,
  defaultOpen = false,
  children,
}: {
  title: string;
  badge?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  return (
    <details open={defaultOpen} style={{ borderBottom: `1px solid ${C.border}` }}>
      <summary
        style={{
          padding: "0 16px",
          minHeight: 48,
          boxSizing: "border-box",
          fontSize: 15,
          fontFamily: C.font,
          color: C.text,
          fontWeight: 600,
          cursor: "pointer",
          userSelect: "none",
          listStyle: "none",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        {title}
        {badge !== undefined && (
          <span style={{ color: C.textMuted, fontWeight: 400, fontSize: 12, marginLeft: "auto" }}>
            {badge}
          </span>
        )}
        <span aria-hidden="true" className="nb-section-sign" style={{ marginLeft: badge === undefined ? "auto" : 4, width: 20, textAlign: "center", fontSize: 18, color: C.textMuted }} />
      </summary>
      {children}
    </details>
  );
}
