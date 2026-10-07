"use client";
// Grid of the project's uploaded images, opened from the Image "Choose from
// library" button. Picking one hands its URL back; uploading stays in the
// Assets panel (left sidebar).
import { useStore } from "@nanostores/react";
import { $assets } from "@/lib/data-stores";
import type { NovaAsset } from "@/lib/r2";
import { UI_VARS as C } from "@/lib/uiTheme";
import { useI18n } from "@/lib/i18n";

export function ImageLibraryPicker({ current, onPick }: { current: string; onPick: (url: string) => void }) {
  const P = useI18n().t.inspector.props;
  const images = ([...useStore($assets).values()] as NovaAsset[]).filter((a) => a.type === "image");

  if (images.length === 0) {
    return (
      <div role="status" style={{ fontSize: 12, color: C.textMuted, padding: "6px 2px", lineHeight: 1.5 }}>
        {P.libraryEmpty}
      </div>
    );
  }
  return (
    <div role="listbox" aria-label={P.pickFromLibrary} style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 4, maxHeight: 180, overflowY: "auto" }}>
      {images.map((a) => (
        <button
          key={a.id}
          role="option"
          aria-selected={a.url === current}
          title={a.name}
          onClick={() => onPick(a.url)}
          style={{
            padding: 0, aspectRatio: "1", borderRadius: 4, overflow: "hidden", cursor: "pointer", background: "#111",
            border: `2px solid ${a.url === current ? C.accent : "transparent"}`,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={a.url} alt={a.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        </button>
      ))}
    </div>
  );
}
