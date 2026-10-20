"use client";

import { useI18n } from "@/lib/i18n";
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

  if (isRoot || !instanceId) return null;

  return (
    <div
      data-nova-contextual-toolbar=""
      style={{
        position: "fixed",
        left: Math.max(8, box.left + box.width - 56),
        top: Math.max(4, box.top - 24),
        display: "flex",
        alignItems: "center",
        gap: 2,
        background: "#1e1e24",
        border: "1px solid rgba(255,255,255,0.18)",
        borderRadius: 4,
        padding: "2px 4px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.45)",
        zIndex: 2147483002,
        pointerEvents: "auto",
      }}
    >
      {isImage && (
        <button
          type="button"
          title={t.inspector.props.cropImage}
          aria-label={t.inspector.props.cropImage}
          onClick={(e) => {
            e.stopPropagation();
            onCrop?.();
          }}
          style={{
            background: "transparent",
            border: "none",
            color: "#c084fc",
            cursor: "pointer",
            fontSize: 12,
            padding: "1px 4px",
            borderRadius: 3,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            lineHeight: 1,
          }}
        >
          ✂
        </button>
      )}
      <button
        type="button"
        title={t.commands.duplicate}
        aria-label={t.commands.duplicate}
        onClick={(e) => {
          e.stopPropagation();
          window.parent.postMessage({ type: "nova:duplicate", instanceId }, window.location.origin);
        }}
        style={{
          background: "transparent",
          border: "none",
          color: "#e2e8f0",
          cursor: "pointer",
          fontSize: 12,
          padding: "1px 4px",
          borderRadius: 3,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          lineHeight: 1,
        }}
      >
        ⧉
      </button>
      <button
        type="button"
        title={t.commands.delete}
        aria-label={t.commands.delete}
        onClick={(e) => {
          e.stopPropagation();
          window.parent.postMessage({ type: "nova:delete", instanceId }, window.location.origin);
        }}
        style={{
          background: "transparent",
          border: "none",
          color: "#ef4444",
          cursor: "pointer",
          fontSize: 12,
          padding: "1px 4px",
          borderRadius: 3,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          lineHeight: 1,
        }}
      >
        🗑
      </button>
    </div>
  );
}
