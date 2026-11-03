"use client";
import { useSyncExternalStore } from "react";

/** True below the width where the left panels become a drawer over the canvas (default 1280px). */
export function useNarrow(max = 1279): boolean {
  return useSyncExternalStore(
    (notify) => {
      const mq = window.matchMedia(`(max-width: ${max}px)`);
      mq.addEventListener("change", notify);
      return () => mq.removeEventListener("change", notify);
    },
    () => window.matchMedia(`(max-width: ${max}px)`).matches,
    () => false
  );
}
