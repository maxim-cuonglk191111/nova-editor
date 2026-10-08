"use client";
// Design mode: links and forms do not navigate or submit (M7b).
// Runs inside the /canvas iframe; returns its cleanup (extracted from canvas.tsx).
import { $isPreviewMode } from "@/lib/nano-states";

export function initDesignInterceptors(): (() => void) | undefined {
  const interceptLink = (e: MouseEvent) => {
    if ($isPreviewMode.get()) return;
    const anchor = (e.target as Element)?.closest("a");
    if (anchor) {
      e.preventDefault();
    }
  };
  const interceptSubmit = (e: SubmitEvent) => {
    if ($isPreviewMode.get()) return;
    e.preventDefault();
  };
  document.addEventListener("click", interceptLink, true);
  document.addEventListener("submit", interceptSubmit, true);
  return () => {
    document.removeEventListener("click", interceptLink, true);
    document.removeEventListener("submit", interceptSubmit, true);
  };
}
