"use client";
// Assets panel shared pieces: byte formatting, reference counting, colour tokens, icons.
import { $props } from "@/lib/data-stores";
import { Icon } from "@/builder/icons";

// ── Helpers ───────────────────────────────────────────────────────────────────

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function countAssetRefs(assetId: string): number {
  const props = $props.get();
  let count = 0;
  for (const prop of props.values()) {
    const p = prop as { value?: unknown };
    if (typeof p.value === "string" && p.value.includes(assetId)) count++;
  }
  return count;
}

// ── Design tokens ─────────────────────────────────────────────────────────────

export const T = {
  bg: "var(--ui-bg)",
  surface: "var(--ui-surface)",
  border: "var(--ui-border)",
  borderDash: "var(--ui-border-hover)",
  text: "var(--ui-text)",
  textSub: "var(--ui-text-dim)",
  textMuted: "var(--ui-text-muted)",
  accent: "var(--ui-accent)",
  accentHover: "var(--ui-accent-hover)",
  accentLight: "var(--ui-accent-bg)",
  accentBorder: "var(--ui-accent-border)",
  inputBg: "var(--ui-card)",
  cardBg: "var(--ui-card)",
  cardHover: "var(--ui-card-hover)",
  error: "var(--ui-error)",
  font: "var(--font-inter, system-ui, -apple-system, sans-serif)",
  radius: 12,
} as const;

// ── Icons (the builder's icon pack, same names as before) ─────────────────────

export const SearchIcon = () => <Icon name="search" size={18} color="var(--ui-text-muted)" />;
export const UploadIcon = () => <Icon name="upload" size={18} />;
export const FolderPlusIcon = () => <Icon name="folderPlus" size={20} />;
export const FolderIcon = () => <Icon name="folder" size={16} />;
export const XIcon = ({ size = 10 }: { size?: number }) => <Icon name="close" size={Math.max(size, 12)} weight="bold" />;
export const ImagePlaceholderIcon = () => <Icon name="assets" size={24} color="var(--ui-muted)" />;
export const FontIcon = () => <Icon name="catTypography" size={24} color="var(--ui-muted)" />;
