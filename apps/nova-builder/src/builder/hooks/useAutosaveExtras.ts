"use client";
// Autosave for project-level settings that are not immerhin transactions (CSS
// variables, custom CSS, interactions, symbols): each change is queued as an
// "extra" on the next patch flush. Also clears the unsaved flag once autosave
// confirms, so the Save button and the sync chip never disagree.
import { useEffect } from "react";
import { $cssVars, $customCss, $interactions, $isDirty } from "@/lib/nano-states";
import { $symbols } from "@/lib/symbols";
import { $saveStatus, queueExtras } from "@/lib/saveQueue";

export function useAutosaveExtras(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    const unsubscribes = [
      $cssVars.listen((cssVars) => queueExtras({ cssVars })),
      $customCss.listen((customCss) => queueExtras({ customCss })),
      $interactions.listen((interactions) => queueExtras({ interactions })),
      $symbols.listen((symbols) => queueExtras({ symbols })),
      $saveStatus.listen((status) => {
        if (status === "saved") $isDirty.set(false);
      }),
    ];
    return () => unsubscribes.forEach((unsubscribe) => unsubscribe());
  }, [enabled]);
}
