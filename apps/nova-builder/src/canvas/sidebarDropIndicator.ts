"use client";
// Drop indicator (line / box + label) while a component is dragged from the sidebar.
// Runs inside the /canvas iframe; returns its cleanup (extracted from canvas.tsx).
import { selectorIdAttribute } from "@webstudio-is/react-sdk";
import { $isPreviewMode } from "@/lib/nano-states";

export function initSidebarDropIndicator(): (() => void) | undefined {
  let indicator: HTMLDivElement | null = null;
  const ACCENT = "#7c3aed";

  const ensureIndicator = (): HTMLDivElement => {
    if (indicator) return indicator;
    const el = document.createElement("div");
    el.id = "nova-drop-indicator";
    el.style.cssText = "position:fixed;pointer-events:none;z-index:2147483001;box-sizing:border-box;transition:top 0.08s ease, left 0.08s ease, width 0.08s ease, height 0.08s ease;";
    
    const tooltip = document.createElement("div");
    tooltip.id = "nova-drop-indicator-tooltip";
    tooltip.style.cssText = "position:absolute;background:#7c3aed;color:#fff;font-family:sans-serif;font-size:10px;font-weight:bold;padding:2px 6px;border-radius:4px;white-space:nowrap;pointer-events:none;box-shadow:0 2px 4px rgba(0,0,0,0.25);transition:opacity 0.15s;";
    el.appendChild(tooltip);

    document.body.appendChild(el);
    indicator = el;
    return el;
  };

  const clearIndicator = () => {
    indicator?.remove();
    indicator = null;
  };

  const onMessage = (e: MessageEvent) => {
    if ($isPreviewMode.get()) return;
    if (e.data?.type === "nova:dragOverEnd") {
      clearIndicator();
      return;
    }
    if (e.data?.type !== "nova:dragOverUpdate") return;
    const { clientX, clientY, position } = e.data as { clientX: number; clientY: number; position: string };

    // Find the nearest instance element under the pointer
    const target = document.elementFromPoint(clientX, clientY);
    const instEl = target?.closest(`[${selectorIdAttribute}]`) as HTMLElement | null;
    if (!instEl) { clearIndicator(); return; }

    const el = ensureIndicator();
    const r = instEl.getBoundingClientRect();

    const tooltip = el.querySelector("#nova-drop-indicator-tooltip") as HTMLDivElement | null;
    if (tooltip) {
      const compName = instEl.getAttribute("data-ws-component") || "element";
      const cleanLabel = compName.split(":").pop() || compName;
      tooltip.textContent = position === "into" ? `➔ Drop inside ${cleanLabel}` : position === "above" ? `▲ Insert above ${cleanLabel}` : `▼ Insert below ${cleanLabel}`;
      
      if (position === "below") {
        tooltip.style.top = "4px";
        tooltip.style.transform = "none";
      } else {
        tooltip.style.top = "-4px";
        tooltip.style.transform = "translateY(-100%)";
      }
      tooltip.style.left = "4px";
    }

    if (position === "into") {
      el.style.left = `${r.left}px`;
      el.style.top = `${r.top}px`;
      el.style.width = `${r.width}px`;
      el.style.height = `${r.height}px`;
      el.style.border = `2px solid ${ACCENT}`;
      el.style.background = "rgba(124,58,237,0.08)";
      el.style.borderTop = `2px solid ${ACCENT}`;
    } else {
      const y = position === "above" ? r.top : r.bottom;
      el.style.left = `${r.left}px`;
      el.style.top = `${y - 1}px`;
      el.style.width = `${r.width}px`;
      el.style.height = "0px";
      el.style.border = "none";
      el.style.background = "none";
      el.style.borderTop = `2px solid ${ACCENT}`;
    }
  };

  window.addEventListener("message", onMessage);
  return () => {
    window.removeEventListener("message", onMessage);
    clearIndicator();
  };
}
