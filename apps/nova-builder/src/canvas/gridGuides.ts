"use client";
// Grid guides (M10): a 12-column overlay toggled by the builder via postMessage.
// Runs inside the /canvas iframe; returns its cleanup (extracted from canvas.tsx).
import { $isPreviewMode } from "@/lib/nano-states";

export function initGridGuides(): (() => void) | undefined {
  const onMessage = (e: MessageEvent) => {
    if ($isPreviewMode.get()) return;
    if (e.data?.type !== "nova:gridGuides") return;
    const STYLE_ID = "nova-grid-guides";
    let el = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
    if (e.data.visible) {
      if (!el) {
        el = document.createElement("style");
        el.id = STYLE_ID;
        document.head.appendChild(el);
      }
      el.textContent = `
        body {
          position: relative;
        }
        body::before {
          content: "";
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 9998;
          display: grid;
          grid-template-columns: repeat(12, 1fr);
          gap: 16px;
          padding: 0 16px;
          box-sizing: border-box;
        }
        body::after {
          content: "";
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 9998;
          display: grid;
          grid-template-columns: repeat(12, 1fr);
          gap: 16px;
          padding: 0 16px;
          box-sizing: border-box;
          background-image:
            repeating-linear-gradient(
              90deg,
              rgba(124, 58, 237, 0.06) 0px,
              rgba(124, 58, 237, 0.06) calc(100% / 12 - 16px * 11 / 12),
              transparent calc(100% / 12 - 16px * 11 / 12),
              transparent calc(100% / 12)
            );
        }
        /* Column fills using CSS counters trick */
        #nova-grid-col-overlay {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 9998;
          display: grid;
          grid-template-columns: repeat(12, 1fr);
          gap: 16px;
          padding: 0 16px;
          box-sizing: border-box;
        }
        #nova-grid-col-overlay > div {
          background: rgba(124, 58, 237, 0.06);
          border-left: 1px solid rgba(124, 58, 237, 0.12);
          border-right: 1px solid rgba(124, 58, 237, 0.12);
          min-height: 100%;
        }
      `;
      // Create column fill overlay if missing
      if (!document.getElementById("nova-grid-col-overlay")) {
        const overlay = document.createElement("div");
        overlay.id = "nova-grid-col-overlay";
        for (let i = 0; i < 12; i++) overlay.appendChild(document.createElement("div"));
        document.body.appendChild(overlay);
      }
    } else {
      if (el) el.textContent = "";
      document.getElementById("nova-grid-col-overlay")?.remove();
    }
  };
  window.addEventListener("message", onMessage);
  return () => window.removeEventListener("message", onMessage);
}
