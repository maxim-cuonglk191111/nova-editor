"use client";
// The canvas is an iframe inside a page card that the builder scales (zoom). Everything the overlay
// draws is scaled with it, so labels and toolbars shrink at 60%. This reads the card's scale so
// they can undo it and stay readable. 1 when the canvas is not framed.
import { useEffect, useState } from "react";

function readZoom(): number {
  try {
    const card = (window.frameElement as HTMLElement | null)?.parentElement;
    if (!card) return 1;
    const m = new DOMMatrixReadOnly(getComputedStyle(card).transform);
    return m.a > 0 ? m.a : 1;
  } catch {
    return 1;
  }
}

export function useParentZoom(): number {
  const [zoom, setZoom] = useState(1);
  useEffect(() => {
    const tick = () => { const z = readZoom(); setZoom((prev) => (Math.abs(prev - z) > 0.005 ? z : prev)); };
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, []);
  return zoom;
}
