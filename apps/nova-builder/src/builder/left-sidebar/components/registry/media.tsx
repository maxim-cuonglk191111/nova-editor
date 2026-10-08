import { registerComponent } from "../registryCore";

// ── MEDIA ────────────────────────────────────────────────────────────────────

registerComponent({
  id: "Image",
  displayName: "Image",
  category: "Display",
  keywords: ["image", "img", "photo", "picture", "media", "asset", "src"],
  description: "Embed an image. Drag to canvas, then set source URL or pick from library.",
  preview: () => (
    <div style={{
      width: 120, height: 80, borderRadius: 6, overflow: "hidden",
      background: "linear-gradient(135deg, #1e1e2e 0%, #2a2a40 100%)",
      border: "1px dashed #3f3f5a",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4,
    }}>
      {/* Mini image icon */}
      <svg width="28" height="22" viewBox="0 0 28 22" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="1" y="1" width="26" height="20" rx="3" stroke="#7c7ca8" strokeWidth="1.5"/>
        <circle cx="8" cy="7" r="2.5" fill="#7c7ca8"/>
        <polyline points="1,16 8,9 14,13 20,7 27,16" stroke="#7c7ca8" strokeWidth="1.5" strokeLinejoin="round" fill="none"/>
      </svg>
      <span style={{ fontSize: 9, color: "#5f5f80", letterSpacing: 1 }}>IMAGE</span>
    </div>
  ),
  createInstance: (id) => {
    const srcPropId = `prop_${id}_src`;
    const widthPropId = `prop_${id}_width`;
    const heightPropId = `prop_${id}_height`;
    const altPropId = `prop_${id}_alt`;
    const objectfitPropId = `prop_${id}_objectfit`;
    return {
      instance: {
        type: "instance" as const,
        id,
        component: "Image",
        label: "Image",
        children: [],
      },
      props: {
        [srcPropId]: {
          id: srcPropId,
          instanceId: id,
          name: "src",
          type: "string" as const,
          value: "/images/placeholder.svg",
        },
        [widthPropId]: {
          id: widthPropId,
          instanceId: id,
          name: "width",
          type: "number" as const,
          value: 400,
        },
        [heightPropId]: {
          id: heightPropId,
          instanceId: id,
          name: "height",
          type: "number" as const,
          value: 300,
        },
        [altPropId]: {
          id: altPropId,
          instanceId: id,
          name: "alt",
          type: "string" as const,
          value: "Image",
        },
        [objectfitPropId]: {
          id: objectfitPropId,
          instanceId: id,
          name: "objectfit",
          type: "string" as const,
          value: "cover",
        },
      },
    };
  },
});
