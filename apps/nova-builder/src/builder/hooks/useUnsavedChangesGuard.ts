"use client";
// Leaving the builder while autosave still has work (a change in the last
// second, a failed flush, a conflict) used to drop that work silently. The
// browser's own "Leave site?" prompt now appears in exactly those cases.
import { useEffect } from "react";
import { $saveStatus } from "@/lib/saveQueue";
import { $isDirty } from "@/lib/nano-states";

/** True while some edit is not confirmed by the server. */
export function hasUnsavedWork(): boolean {
  const status = $saveStatus.get();
  // $isDirty flips on every edit and clears when a flush is confirmed
  // (useAutosaveExtras); the chip alone lags the edit by up to one flush tick.
  return $isDirty.get() || status === "saving" || status === "recovering" || status === "error" || status === "conflict";
}

export function useUnsavedChangesGuard(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!hasUnsavedWork()) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [enabled]);
}
