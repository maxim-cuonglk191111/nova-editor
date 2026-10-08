"use client";
// Asset-image drag-and-drop from the Assets panel (native HTML5 DnD crosses the iframe).
// Runs inside the /canvas iframe; returns its cleanup (extracted from canvas.tsx).
import { selectorIdAttribute } from "@webstudio-is/react-sdk";
import { $instances } from "@/lib/data-stores";
import { $isPreviewMode } from "@/lib/nano-states";

export function initAssetDrop(): (() => void) | undefined {
  if ($isPreviewMode.get()) return;

  const ASSET_DND_TYPE = "nova/asset-image";
  const ACCENT = "#7c3aed";

  // Highlight element under pointer during asset drag
  let hoverEl: HTMLElement | null = null;
  let highlightEl: HTMLDivElement | null = null;

  const getOrCreateHighlight = (): HTMLDivElement => {
    if (!highlightEl) {
      highlightEl = document.createElement("div");
      highlightEl.id = "nova-asset-drop-highlight";
      highlightEl.style.cssText =
        "position:fixed;pointer-events:none;z-index:2147483002;box-sizing:border-box;" +
        `border:2px solid ${ACCENT};background:rgba(124,58,237,0.12);border-radius:3px;` +
        "transition:all 0.06s ease;";
      document.body.appendChild(highlightEl);
    }
    return highlightEl;
  };

  const clearHighlight = () => {
    highlightEl?.remove();
    highlightEl = null;
    hoverEl = null;
  };

  const findTarget = (x: number, y: number): { el: HTMLElement; instanceId: string } | null => {
    const el = document.elementFromPoint(x, y)?.closest(`[${selectorIdAttribute}]`) as HTMLElement | null;
    if (!el) return null;
    const raw = el.getAttribute(selectorIdAttribute) ?? "";
    const instanceId = raw.split(",")[0];
    return instanceId ? { el, instanceId } : null;
  };

  const paintHighlight = (el: HTMLElement) => {
    const r = el.getBoundingClientRect();
    const h = getOrCreateHighlight();
    h.style.left = `${r.left}px`;
    h.style.top = `${r.top}px`;
    h.style.width = `${r.width}px`;
    h.style.height = `${r.height}px`;
  };

  const onDragOver = (e: DragEvent) => {
    if ($isPreviewMode.get()) return;
    if (!e.dataTransfer?.types.includes(ASSET_DND_TYPE)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";

    const target = findTarget(e.clientX, e.clientY);
    if (!target) { clearHighlight(); return; }
    if (target.el !== hoverEl) {
      hoverEl = target.el;
      paintHighlight(target.el);
    }
  };

  const onDragLeave = (e: DragEvent) => {
    // Only clear if leaving the document (not just crossing elements)
    if (!e.relatedTarget) clearHighlight();
  };

  const onDrop = (e: DragEvent) => {
    if ($isPreviewMode.get()) return;
    if (!e.dataTransfer?.types.includes(ASSET_DND_TYPE)) return;
    e.preventDefault();
    clearHighlight();

    const raw = e.dataTransfer.getData(ASSET_DND_TYPE);
    if (!raw) return;

    let payload: { assetId: string; url: string; name: string };
    try {
      payload = JSON.parse(raw);
    } catch {
      return;
    }

    const target = findTarget(e.clientX, e.clientY);
    const instances = $instances.get();

    // Determine if we dropped onto an existing Image instance
    const isImageInstance = target
      ? instances.get(target.instanceId)?.component === "Image"
      : false;

    if (isImageInstance && target) {
      // Update existing Image's src prop
      window.parent.postMessage(
        {
          type: "nova:assetImageCommit",
          action: "updateSrc",
          instanceId: target.instanceId,
          assetId: payload.assetId,
          url: payload.url,
          name: payload.name,
        },
        window.location.origin
      );
    } else {
      // Insert new Image instance at the drop target
      // Find parent and position
      let parentId: string | null = null;
      let position: "into" | "above" | "below" = "into";

      if (target) {
        const targetInst = instances.get(target.instanceId);
        // Determine if target is a container: drop "into" containers, "below" leaves
        const containerComponents = new Set([
          "Body", "Box", "HeroUIRow", "HeroUICol", "shadcn:Card",
          "shadcn:CardContent", "shadcn:CardHeader", "Slot",
        ]);
        const isContainer = containerComponents.has(targetInst?.component ?? "");
        if (isContainer) {
          parentId = target.instanceId;
          position = "into";
        } else {
          parentId = target.instanceId;
          position = "below";
        }
      }

      window.parent.postMessage(
        {
          type: "nova:assetImageCommit",
          action: "insertImage",
          targetInstanceId: parentId,
          position,
          assetId: payload.assetId,
          url: payload.url,
          name: payload.name,
        },
        window.location.origin
      );
    }
  };

  document.addEventListener("dragover", onDragOver);
  document.addEventListener("dragleave", onDragLeave);
  document.addEventListener("drop", onDrop);
  return () => {
    document.removeEventListener("dragover", onDragOver);
    document.removeEventListener("dragleave", onDragLeave);
    document.removeEventListener("drop", onDrop);
    clearHighlight();
  };
}
