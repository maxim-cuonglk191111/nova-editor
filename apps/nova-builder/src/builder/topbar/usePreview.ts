"use client";
import { useCallback } from "react";
import {
  $projectMeta, $pages, $assets, $instances, $props, $dataSources, $resources,
  $breakpoints, $styles, $styleSources, $styleSourceSelections,
} from "@/lib/data-stores";
import { serializeWebstudioData } from "@/lib/schema";
import { $cssVars, $interactions, $customCss } from "@/lib/nano-states";

/**
 * Opens the preview in a new tab. A saved project previews from the server; the demo has nothing
 * saved, so its current data is parked in localStorage for /preview/demo to read.
 */
export function usePreview(isDemo?: boolean): () => void {
  return useCallback(() => {
    if (isDemo) {
      const serialized = serializeWebstudioData({
        pages: $pages.get()!,
        assets: $assets.get(),
        instances: $instances.get(),
        props: $props.get(),
        dataSources: $dataSources.get(),
        resources: $resources.get(),
        breakpoints: $breakpoints.get(),
        styles: $styles.get(),
        styleSources: $styleSources.get(),
        styleSourceSelections: $styleSourceSelections.get(),
      });
      localStorage.setItem("nova-demo-project-data", JSON.stringify({
        id: "demo",
        name: "Demo — Nova Builder",
        schemaVersion: "5.0",
        data: serialized,
        cssVars: $cssVars.get(),
        interactions: $interactions.get(),
        customCss: $customCss.get(),
        updatedAt: new Date().toISOString(),
      }));
      window.open("/preview/demo", "_blank");
      return;
    }
    const meta = $projectMeta.get();
    if (meta) window.open(`/preview/${meta.id}`, "_blank");
  }, [isDemo]);
}
