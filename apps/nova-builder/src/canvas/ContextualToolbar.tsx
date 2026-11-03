"use client";

import { useParentZoom } from "./useParentZoom";
import { useI18n } from "@/lib/i18n";
import { Icon } from "@/builder/icons";
import type { Rect } from "./resizeMath";

export function ContextualToolbar({
  box,
  instanceId,
  isRoot,
  isImage,
  onCrop,
}: {
  box: Rect;
  instanceId?: string;
  isRoot: boolean;
  isImage?: boolean;
  onCrop?: () => void;
}) {
  const { t } = useI18n();
  const zoom = useParentZoom();

  if (isRoot || !instanceId) return null;

  const button = (title: string, onClick: () => void, children: React.ReactNode, color = "#1f2937") => (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(0,0,0,0.06)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
      style={{ background: "transparent", border: "none", color, cursor: "pointer", width: 30, height: 30, borderRadius: 8, display: "inline-flex", alignItems: "center", justifyContent: "center", padding: 0, transition: "background-color .12s ease" }}
    >
      {children}
    </button>
  );

  return (
    <div
      data-nova-contextual-toolbar=""
      style={{
        position: "fixed",
        left: Math.max(8, box.left + box.width - 100 / zoom),
        // above the element; when that would leave the page, just inside its top edge
        top: box.top - 44 >= 6 ? box.top - 44 : box.top + 8,
        transform: `scale(${1 / zoom})`,
        transformOrigin: box.top - 44 >= 6 ? "left bottom" : "left top",
        display: "flex",
        alignItems: "center",
        gap: 2,
        background: "#ffffff",
        border: "1px solid rgba(0,0,0,0.09)",
        borderRadius: 12,
        padding: 3,
        boxShadow: "0 1px 2px rgba(15,23,42,0.08), 0 6px 18px rgba(15,23,42,0.14)",
        zIndex: 2147483002,
        pointerEvents: "auto",
      }}
    >
      {isImage && button(t.inspector.props.cropImage, () => onCrop?.(), <Icon name="crop" size={18} />, "#5b21b6")}
      {button(t.commands.duplicate, () => window.parent.postMessage({ type: "nova:duplicate", instanceId }, window.location.origin), <Icon name="copy" size={18} />)}
      {button(t.commands.delete, () => window.parent.postMessage({ type: "nova:delete", instanceId }, window.location.origin), <Icon name="trash" size={18} />, "#dc2626")}
    </div>
  );
}
