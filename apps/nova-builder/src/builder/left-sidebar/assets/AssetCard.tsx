"use client";
// One asset in the image grid: thumbnail, hover actions (preview, insert, delete), drag source.
import { useState } from "react";
import type { NovaAsset } from "@/lib/r2";
import { useI18n } from "@/lib/i18n";
import { formatBytes, T, FontIcon } from "./assetShared";

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
        ghost.style.cssText = "position:fixed;top:-200px;left:-200px;width:64px;height:64px;border-radius:8px;overflow:hidden;border:2px solid #7c3aed;";
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
        position: "relative", borderRadius: 10, overflow: "hidden",
        background: T.cardBg, border: `1.5px solid ${hovered ? T.accentBorder : T.border}`,
        cursor: "grab", transition: "border-color 0.15s",
      }}
      title={`${asset.name} · ${formatBytes(asset.size)}`}
    >
      <div style={{ width: "100%", aspectRatio: "1", background: "#f0f0f0", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
        {isImage
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={asset.url} alt={asset.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : <div style={{ textAlign: "center", padding: 8 }}>
            <FontIcon />
            {asset.fontFamily && <div style={{ fontSize: 9, color: T.textMuted, marginTop: 2 }}>{asset.fontFamily}</div>}
          </div>
        }
      </div>
      <div style={{ padding: "5px 6px 6px", fontSize: 11, color: T.textSub, fontFamily: T.font, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
        {shortName}
      </div>
      {hovered && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 5 }}>
          {isImage && (
            <button onClick={(e) => { e.stopPropagation(); onPreview(asset); }} style={{ padding: "4px 12px", borderRadius: 6, background: "rgba(255,255,255,0.18)", color: "#fff", border: "1px solid rgba(255,255,255,0.25)", fontSize: 12, fontWeight: 600, cursor: "pointer", backdropFilter: "blur(4px)" }}>{t.assets.preview}</button>
          )}
          {canInsert && isImage && (
            <button onClick={(e) => { e.stopPropagation(); onInsert(asset); }} style={{ padding: "4px 12px", borderRadius: 6, background: T.accent, color: "#fff", border: "none", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>{t.assets.insert}</button>
          )}
          <button onClick={(e) => { e.stopPropagation(); onDelete(asset); }} style={{ padding: "3px 10px", borderRadius: 6, background: "rgba(239,68,68,0.2)", color: "#fca5a5", border: "1px solid rgba(239,68,68,0.3)", fontSize: 11, cursor: "pointer" }}>{t.assets.delete}</button>
        </div>
      )}
    </div>
  );
}
