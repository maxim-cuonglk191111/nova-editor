"use client";
// The title row every left-sidebar panel starts with, so the five panels read as one family.
import type { ReactNode } from "react";
import { UI_VARS as C } from "@/lib/uiTheme";

export function PanelHeader({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div style={{ minHeight: 56, padding: "0 16px", borderBottom: `1px solid ${C.border}`, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, boxSizing: "border-box" }}>
      <span style={{ fontSize: 16, fontWeight: 700, color: C.text, fontFamily: C.font, letterSpacing: "-0.01em" }}>{title}</span>
      {children}
    </div>
  );
}
