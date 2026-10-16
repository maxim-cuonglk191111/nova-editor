"use client";
import { useEffect, useRef } from "react";
import {
  $instances,
  $pages,
  $assets,
  $props,
  $dataSources,
  $resources,
  $breakpoints,
  $styleSources,
  $styleSourceSelections,
} from "@/lib/data-stores";
import { $cssVars, $interactions, $customCss } from "@/lib/nano-states";
import { $symbols } from "@/lib/symbols";
import { getSerializedProjectSchema } from "@/lib/saveProject";

export const DEMO_DRAFT_KEY = "nova-demo-draft";

export function useDemoDraftSync(enabled: boolean) {
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const saveDraft = () => {
      try {
        const schema = getSerializedProjectSchema();
        localStorage.setItem(DEMO_DRAFT_KEY, JSON.stringify(schema));
      } catch (err) {
        // LocalStorage quota or disabled (e.g. private mode)
        console.warn("[demo-draft-sync] failed to save to localStorage:", err);
      }
    };

    const handleStoreChange = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(saveDraft, 800);
    };

    const atoms = [
      $instances,
      $pages,
      $assets,
      $props,
      $dataSources,
      $resources,
      $breakpoints,
      $styleSources,
      $styleSourceSelections,
      $cssVars,
      $interactions,
      $customCss,
      $symbols,
    ];

    const unsubscribes = atoms.map((atom) => atom.listen(handleStoreChange));

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      unsubscribes.forEach((un) => un());
    };
  }, [enabled]);
}
