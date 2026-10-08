"use client";
// Click-to-select (shift = multi), hover, double-click text edit / image preview, context menu.
// Runs inside the /canvas iframe; returns its cleanup (extracted from canvas.tsx).
import { selectorIdAttribute } from "@webstudio-is/react-sdk";
import { $instances } from "@/lib/data-stores";
import { $lightboxImage } from "./ImageLightbox";
import { $isPreviewMode, $selectedInstanceSelector, $hoveredInstanceSelector, $multiSelectedInstanceIds, $textEditingInstance } from "@/lib/nano-states";

export function initPointerSelection(): (() => void) | undefined {
  const clickHandler = (e: MouseEvent) => {
    if ($isPreviewMode.get()) return;
    // Suppress click-to-select while Lexical editor is active.
    if ($textEditingInstance.get()) return;
    // Releasing a resize handle clicks the selection chrome — keep the selection.
    if ((e.target as Element)?.closest?.("[data-nova-overlay]")) return;
    const el = (e.target as Element)?.closest(`[${selectorIdAttribute}]`);
    if (!el) {
      $selectedInstanceSelector.set(undefined);
      $multiSelectedInstanceIds.set([]);
      window.parent.postMessage({ type: "nova:select", selector: undefined }, window.location.origin);
      return;
    }
    const raw = el.getAttribute(selectorIdAttribute);
    if (!raw) return;
    const instanceId = raw.split(",")[0];
    if (!instanceId) return;

    // Shift-click: toggle this instance in multi-selection.
    if (e.shiftKey) {
      let current = $multiSelectedInstanceIds.get();
      if (current.length === 0) {
        const currentSingle = $selectedInstanceSelector.get()?.[0];
        if (currentSingle && currentSingle !== instanceId) {
          current = [currentSingle];
        }
      }
      let next: string[];
      if (current.includes(instanceId)) {
        next = current.filter((id) => id !== instanceId);
      } else {
        next = [...current, instanceId];
      }
      $multiSelectedInstanceIds.set(next);
      const nextSelector = next.length > 0 ? [next[0]] : undefined;
      $selectedInstanceSelector.set(nextSelector);
      window.parent.postMessage(
        { type: "nova:select", selector: nextSelector },
        window.location.origin
      );
      return;
    }

    // Normal click: single-select.
    $multiSelectedInstanceIds.set([]);
    const selector = raw.split(",").filter(Boolean);
    $selectedInstanceSelector.set(selector);
    // Bridge selection to builder via postMessage — more reliable than the
    // SyncClient emitter chain which has a startup race on the demo project.
    window.parent.postMessage(
      { type: "nova:select", selector },
      window.location.origin
    );
  };
  const hoverHandler = (e: MouseEvent) => {
    if ($isPreviewMode.get()) return;
    const el = (e.target as Element)?.closest(`[${selectorIdAttribute}]`);
    if (!el) {
      $hoveredInstanceSelector.set(undefined);
      return;
    }
    const raw = el.getAttribute(selectorIdAttribute);
    if (raw) $hoveredInstanceSelector.set(raw.split(",").filter(Boolean));
  };

  // ── Inline text editing (M6: Lexical) ──────────────────────────────────────
  // Double-click activates the Lexical TextEditOverlay (React component).
  // No more contentEditable or execCommand.
  const dblClickHandler = (e: MouseEvent) => {
    // ── Image preview on double-click (canvas mode) ─────────────────────────
    if (!$isPreviewMode.get()) {
      const imgTarget = (e.target as Element)?.closest(`[${selectorIdAttribute}]`);
      if (imgTarget instanceof HTMLElement) {
        const raw = imgTarget.getAttribute(selectorIdAttribute);
        const iid = raw?.split(",")[0];
        if (iid) {
          const inst = $instances.get().get(iid);
          if (inst?.component === "Image") {
            e.preventDefault();
            e.stopPropagation();
            const imgEl = imgTarget.tagName === "IMG" ? imgTarget as HTMLImageElement : imgTarget.querySelector("img");
            if (imgEl) {
              $lightboxImage.set({ src: imgEl.src, alt: imgEl.alt || "Image" });
            }
            return;
          }
        }
      }
    }
    if ($isPreviewMode.get()) return;
    const target = (e.target as Element)?.closest(`[${selectorIdAttribute}]`);
    if (!target || !(target instanceof HTMLElement)) return;
    const raw = target.getAttribute(selectorIdAttribute);
    if (!raw) return;
    const instanceId = raw.split(",")[0];
    if (!instanceId) return;

    const inst = $instances.get().get(instanceId);
    if (!inst) return;
    // Allow text editing on components that carry inline text (even if empty)
    // or that already have text children.
    const TEXT_EDITABLE = new Set([
      "Heading", "Paragraph", "Text", "Button", "Link", "Label",
      "RichText", "Bold", "Italic", "Span",
    ]);
    const hasText = inst.children.some((c) => c.type === "text");
    const isTextComponent = TEXT_EDITABLE.has(inst.component.split(":").pop() ?? inst.component);
    if (!hasText && !isTextComponent) return;

    e.preventDefault();
    e.stopPropagation();

    // Close any active Lexical editor before opening a new one.
    if ($textEditingInstance.get()) {
      $textEditingInstance.set(null);
      window.parent.postMessage({ type: "nova:editingEnd" }, window.location.origin);
    }

    const rect = target.getBoundingClientRect();
    // Seed a placeholder text child so Lexical has something to render when
    // the instance was inserted with empty children.
    const initialChildren =
      inst.children.length > 0
        ? inst.children
        : [{ type: "text" as const, value: "" }];
    $textEditingInstance.set({
      instanceId,
      initialChildren,
      rect: { top: rect.top, left: rect.left, width: rect.width, height: rect.height },
    });
    window.parent.postMessage({ type: "nova:editingStart", instanceId }, window.location.origin);
  };

  const contextMenuHandler = (e: MouseEvent) => {
    if ($isPreviewMode.get()) return;
    e.preventDefault();
    const el = (e.target as Element)?.closest(`[${selectorIdAttribute}]`);
    if (!el) return;
    const raw = el.getAttribute(selectorIdAttribute);
    if (!raw) return;
    const instanceId = raw.split(",")[0];
    if (!instanceId) return;
    // Select the right-clicked instance first
    $selectedInstanceSelector.set(raw.split(",").filter(Boolean));
    window.parent.postMessage(
      { type: "nova:contextMenu", instanceId, clientX: e.clientX, clientY: e.clientY },
      window.location.origin
    );
  };

  // ── Image preview in preview mode (single click) ────────────────────────
  const imagePreviewHandler = (e: MouseEvent) => {
    if (!$isPreviewMode.get()) return;
    const el = (e.target as Element)?.closest(`[${selectorIdAttribute}]`);
    if (!el || !(el instanceof HTMLElement)) return;
    const raw = el.getAttribute(selectorIdAttribute);
    const instanceId = raw?.split(",")[0];
    if (!instanceId) return;
    const inst = $instances.get().get(instanceId);
    if (inst?.component !== "Image") return;
    e.preventDefault();
    e.stopPropagation();
    const imgEl = el.tagName === "IMG" ? el as HTMLImageElement : el.querySelector("img");
    if (imgEl) {
      $lightboxImage.set({ src: imgEl.src, alt: imgEl.alt || "Image" });
    }
  };

  document.addEventListener("click", clickHandler);
  document.addEventListener("click", imagePreviewHandler);
  document.addEventListener("mouseover", hoverHandler);
  document.addEventListener("dblclick", dblClickHandler);
  document.addEventListener("contextmenu", contextMenuHandler);
  return () => {
    document.removeEventListener("click", clickHandler);
    document.removeEventListener("click", imagePreviewHandler);
    document.removeEventListener("mouseover", hoverHandler);
    document.removeEventListener("dblclick", dblClickHandler);
    document.removeEventListener("contextmenu", contextMenuHandler);
  };
}
