"use client";
// One asset in the image grid: thumbnail, hover actions (preview, insert, delete), drag source.
import { Icon } from "@/builder/icons";
import { useState } from "react";
import type { NovaAsset } from "@/lib/r2";
import { useI18n } from "@/lib/i18n";
import { formatBytes, T, FontIcon } from "./assetShared";

const overlayButton: React.CSSProperties = { width: 36, height: 36, borderRadius: 12, border: "none", background: "#ffffff", color: "#1f2937", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", padding: 0, boxShadow: "0 2px 8px rgba(0,0,0,0.25)" };

// ── AssetCard (image grid) ────────────────────────────────────────────────────

export function AssetCard({
  asset, canInsert, onInsert, onDelete, onPreview,
}: {
  asset: NovaAsset; canInsert: boolean;
  onInsert: (a: NovaAsset) => void; onDelete: (a: NovaAsset) => void; onPreview: (a: NovaAsset) => void;
}) {
  const { t } = useI18n();
  const [hovered, setHovered] = useState(false);
  const isImage = asset.type === "image";
  const shortName = asset.name.length > 16 ? asset.name.slice(0, 14) + "..." : asset.name;

  function handleDragStart(e: React.DragEvent) {
    const payload = JSON.stringify({ assetId: asset.id, url: asset.url, name: asset.name });
    e.dataTransfer.setData("nova/asset-image", payload);
    e.dataTransfer.setData("text/plain", asset.url);
    e.dataTransfer.effectAllowed = "copy";
    if (isImage) {
      try {
        const ghost = document.createElement("div");
        ghost.style.cssText = "position:fixed;top:-200px;left:-200px;width:64px;height:64px;border-radius:8px;overflow:hidden;border:2px solid var(--ui-accent);";
        const img = document.createElement("img");
        img.src = asset.url; img.style.cssText = "width:100%;height:100%;object-fit:cover;";
        ghost.appendChild(img); document.body.appendChild(ghost);
        e.dataTransfer.setDragImage(ghost, 32, 32);
        requestAnimationFrame(() => ghost.remove());
      } catch { /* */ }
    }
  }

  return (
    <div
      draggable onDragStart={handleDragStart}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{
        position: "relative", borderRadius: 14, overflow: "hidden",
        background: T.cardBg, border: `1.5px solid ${hovered ? T.accentBorder : T.border}`,
        cursor: "grab", transition: "border-color 0.15s",
      }}
      title={`${asset.name} · ${formatBytes(asset.size)}`}
    >
      <div style={{ width: "100%", aspectRatio: "1", background: T.surface, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
        {isImage
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={asset.url} alt={asset.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : <div style={{ textAlign: "center", padding: 8 }}>
            <FontIcon />
            {asset.fontFamily && <div style={{ fontSize: 9, color: T.textMuted, marginTop: 2 }}>{asset.fontFamily}</div>}
          </div>
        }
      </div>
      <div style={{ padding: "8px 10px 9px", fontSize: 13, color: T.textSub, fontFamily: T.font, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
        {shortName}
      </div>
      {hovered && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(17,17,17,0.5)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          {isImage && (
            <button onClick={(e) => { e.stopPropagation(); onPreview(asset); }} title={t.assets.preview} aria-label={t.assets.preview} style={overlayButton}><Icon name="eye" size={18} /></button>
          )}
          {canInsert && isImage && (
            <button onClick={(e) => { e.stopPropagation(); onInsert(asset); }} title={t.assets.insert} aria-label={t.assets.insert} style={{ ...overlayButton, background: T.accent, color: "#fff" }}><Icon name="plus" size={18} weight="bold" /></button>
          )}
          <button onClick={(e) => { e.stopPropagation(); onDelete(asset); }} title={t.assets.delete} aria-label={t.assets.delete} style={{ ...overlayButton, color: "#dc2626" }}><Icon name="trash" size={18} /></button>
        </div>
      )}
    </div>
  );
}
