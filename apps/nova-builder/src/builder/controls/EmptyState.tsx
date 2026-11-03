"use client";
// What a panel says when there is nothing to edit: an icon tile and one calm line.
import { UI_VARS as C, UI_SHAPE as S } from "@/lib/uiTheme";
import { Icon, type IconName } from "@/builder/icons";

export function EmptyState({ icon, text }: { icon: IconName; text: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "40px 24px", textAlign: "center", fontFamily: C.font }}>
      <span style={{ width: 52, height: 52, borderRadius: S.radiusMd + 2, background: C.surface, color: C.textMuted, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
        <Icon name={icon} size={26} weight="duotone" />
      </span>
      <span style={{ fontSize: 14, lineHeight: 1.5, color: C.textMuted, maxWidth: 220 }}>{text}</span>
    </div>
  );
}
