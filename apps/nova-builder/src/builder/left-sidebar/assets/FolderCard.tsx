"use client";
// Folder tab: decorative illustration and one folder card.
import { useState } from "react";
import type { AssetFolder } from "@/lib/db-folders";
import { useI18n, fmt } from "@/lib/i18n";
import { T, FolderIcon, XIcon } from "./assetShared";

// ── Folder illustration (decorative) ─────────────────────────────────────────

export function FolderIllustration() {
  return (
    <svg width="130" height="110" viewBox="0 0 130 110" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Folder body */}
      <rect x="15" y="38" width="90" height="58" rx="8" fill="#4dd9c0" />
      <rect x="15" y="30" width="45" height="16" rx="6" fill="#4dd9c0" />
      <rect x="15" y="38" width="90" height="58" rx="8" fill="url(#folderGrad)" />
      {/* Folder tab */}
      <path d="M15 34 Q15 30 20 30 L55 30 Q62 30 65 36 L15 36Z" fill="#38c8b0" />
      {/* Play button on folder */}
      <circle cx="60" cy="65" r="13" fill="white" fillOpacity="0.25" />
      <polygon points="56,59 74,65 56,71" fill="white" fillOpacity="0.8" />
      {/* Decorative flowers left */}
      <circle cx="8" cy="50" r="6" fill="#a78bfa" />
      <circle cx="2" cy="42" r="4" fill="#c4b5fd" />
      <circle cx="14" cy="40" r="3" fill="#7c3aed" />
      <line x1="8" y1="50" x2="8" y2="62" stroke="#34d399" strokeWidth="2" />
      {/* Decorative flowers right */}
      <circle cx="112" cy="44" r="7" fill="#60a5fa" />
      <circle cx="120" cy="36" r="4" fill="#93c5fd" />
      <circle cx="105" cy="35" r="5" fill="#3b82f6" />
      <line x1="112" y1="50" x2="110" y2="62" stroke="#34d399" strokeWidth="2" />
      {/* Leaves */}
      <ellipse cx="20" cy="70" rx="8" ry="4" fill="#34d399" transform="rotate(-30 20 70)" />
      <ellipse cx="100" cy="68" rx="8" ry="4" fill="#34d399" transform="rotate(20 100 68)" />
      {/* Small accent dots */}
      <circle cx="30" cy="28" r="3" fill="#f59e0b" />
      <circle cx="90" cy="25" r="2" fill="#ec4899" />
      <defs>
        <linearGradient id="folderGrad" x1="15" y1="38" x2="105" y2="96" gradientUnits="userSpaceOnUse">
          <stop stopColor="#4dd9c0" stopOpacity="0" />
          <stop offset="1" stopColor="#2bb5a0" stopOpacity="0.4" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// ── FolderCard (in folder tab list) ──────────────────────────────────────────

export function FolderCard({
  folder,
  assetCount,
  isActive,
  onClick,
  onDelete,
  onDrop,
}: {
  folder: AssetFolder;
  assetCount: number;
  isActive: boolean;
  onClick: () => void;
  onDelete: () => void;
  onDrop: (assetId: string) => void;
}) {
  const { t } = useI18n();
  const [dragOver, setDragOver] = useState(false);
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault(); setDragOver(false);
        const raw = e.dataTransfer.getData("nova/asset-image");
        if (!raw) return;
        try { const { assetId } = JSON.parse(raw); if (assetId) onDrop(assetId); } catch { /* */ }
      }}
      style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "10px 14px", borderRadius: 10,
        background: dragOver ? T.accentLight : isActive ? T.accentLight : hovered ? T.cardHover : T.cardBg,
        border: `1.5px solid ${dragOver ? T.accent : isActive ? T.accentBorder : T.border}`,
        cursor: "pointer", transition: "all 0.15s",
        position: "relative",
      }}
    >
      <div style={{
        width: 38, height: 38, borderRadius: 8,
        background: isActive ? "rgba(124,58,237,0.12)" : "rgba(0,0,0,0.06)",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0, color: isActive ? T.accent : "#888",
      }}>
        <FolderIcon />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 13, fontWeight: 600, color: T.text,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {folder.name}
        </div>
        <div style={{ fontSize: 11, color: T.textMuted, marginTop: 1 }}>
          {fmt(assetCount === 1 ? t.assets.fileOne : t.assets.fileMany, { count: assetCount })}
        </div>
      </div>
      {hovered && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          style={{
            position: "absolute", right: 8, top: 8,
            background: "rgba(0,0,0,0.06)", border: "none", borderRadius: 4,
            width: 20, height: 20, cursor: "pointer", display: "flex",
            alignItems: "center", justifyContent: "center", color: T.textMuted,
          }}
          title={t.assets.deleteFolder}
        >
          <XIcon size={9} />
        </button>
      )}
    </div>
  );
}
