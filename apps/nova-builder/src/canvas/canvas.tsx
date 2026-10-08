// Canvas root component — runs inside the /canvas iframe.
//
// Phase 2 scope:
//  • Connects as SyncClient(follower) via useCanvasStore()
//  • Registers all Webstudio component libraries
//  • Renders the selected page's instance tree using WebstudioComponentCanvas
//
// Phase 3 adds: DnD, text editing, inflator, state styles, selection overlay.
// Phase 6 adds: registerComponentLibrary for Nova-extended metadata.

"use client";

import { useMemo, useLayoutEffect, useEffect, useState, useRef } from "react";
import { flushSync } from "react-dom";
import { useStore } from "@nanostores/react";
import { ReactSdkContext, selectorIdAttribute } from "@webstudio-is/react-sdk";
import { useForwardShortcutsToBuilder } from "./forwardShortcuts";
import { wsImageLoader } from "@webstudio-is/image";
import { compareMedia } from "@webstudio-is/css-engine";
import { coreMetas, type Breakpoint } from "@webstudio-is/sdk";
import { coreTemplates } from "@webstudio-is/sdk/core-templates";
import * as baseComponents from "@webstudio-is/sdk-components-react/components";
import * as baseComponentMetas from "@webstudio-is/sdk-components-react/metas";
import { hooks as baseComponentHooks } from "@webstudio-is/sdk-components-react/hooks";
import * as baseComponentTemplates from "@webstudio-is/sdk-components-react/templates";
import * as radixComponents from "@webstudio-is/sdk-components-react-radix";
import * as radixComponentMetas from "@webstudio-is/sdk-components-react-radix/metas";
import * as radixTemplates from "@webstudio-is/sdk-components-react-radix/templates";
import { hooks as radixComponentHooks } from "@webstudio-is/sdk-components-react-radix/hooks";
import { $instances, $breakpoints } from "@/lib/data-stores";
import {
  $selectedPage,
  $isPreviewMode,
  $registeredComponents,
  $selectedInstanceSelector,
  $textEditingInstance,
  registerComponentLibrary,
  assetBaseUrl,
  $cssVars,
  $interactions,
  $customCss,
  $lastChangeWasReparent,
} from "@/lib/nano-states";
import { useCanvasStore } from "@/lib/sync-stores";
import { createInstanceElement } from "./elements";
import { RepeatList, repeatListMeta } from "./repeat-list";
import { Slot, slotMeta } from "./slot";
import { shadcnComponents, shadcnMetas } from "./shadcn-components";
import { SelectionOverlay } from "./SelectionOverlay";
import { TextEditOverlay } from "./TextEditOverlay";
import { ImageLightbox } from "./ImageLightbox";
import { initDragReparent } from "./dragReparent";
import { initGridGuides } from "./gridGuides";
import { initSidebarDropIndicator } from "./sidebarDropIndicator";
import { initAssetDrop } from "./assetDrop";
import { initDesignInterceptors } from "./designInterceptors";
import { initPointerSelection } from "./pointerSelection";
import {
  mountStyles,
  subscribeStyles,
  subscribeStateStyles,
  subscribeHelperStyles,
  GlobalStyles,
} from "./styles";
import {
  WebstudioComponentCanvas,
  WebstudioComponentPreview,
} from "./webstudio-component";

// Canvas API — sets window.__webstudio__$__canvasApi for builder to call.
const initCanvasApi = () => {
  if (typeof window !== "undefined") {
    (window as any)["__webstudio__$__canvasApi"] = { isInitialized: () => true };
  }
};

// DIP fix: single injection point for named <style> elements.
const injectStyleEl = (id: string, css: string) => {
  let el = document.getElementById(id) as HTMLStyleElement | null;
  if (!el) {
    el = document.createElement("style");
    el.id = id;
    document.head.appendChild(el);
  }
  el.textContent = css;
};

// ─── Instance tree renderer ───────────────────────────────────────────────────

const useElementsTree = () => {
  const components = useStore($registeredComponents);
  const [instances, setInstances] = useState(() => $instances.get());
  // useRef so the guard persists across re-renders (a plain `let` resets every render).
  const activeTransitionRef = useRef<ViewTransition | null>(null);

  useLayoutEffect(() => {
    return $instances.subscribe((newInstances) => {
      const canAnimate =
        $lastChangeWasReparent.get() &&
        typeof document.startViewTransition === "function" &&
        activeTransitionRef.current === null;

      if (canAnimate) {
        const styleEl = document.createElement("style");
        let css = "";
        document.querySelectorAll(`[${selectorIdAttribute}]`).forEach((el) => {
          const id = el.getAttribute(selectorIdAttribute)?.split(",")[0];
          if (id) {
            css += `[${selectorIdAttribute}^="${id}"] { view-transition-name: vt-${id.replace(/[^a-zA-Z0-9-]/g, "")}; }\n`;
          }
        });
        styleEl.textContent = css;
        document.head.appendChild(styleEl);

        try {
          const transition = document.startViewTransition(() => {
            flushSync(() => {
              setInstances(newInstances);
            });
          });
          activeTransitionRef.current = transition;
          // .catch handles AbortError when the transition is interrupted mid-flight.
          transition.finished
            .catch(() => {/* transition was skipped/aborted — no action needed */})
            .finally(() => {
              styleEl.remove();
              activeTransitionRef.current = null;
            });
        } catch {
          // startViewTransition threw InvalidStateError (rapid drops) — skip animation.
          styleEl.remove();
          activeTransitionRef.current = null;
          setInstances(newInstances);
        }
      } else {
        setInstances(newInstances);
      }
    });
  }, []);

  const isPreviewMode = useStore($isPreviewMode);
  const breakpointsMap = useStore($breakpoints);
  const page = useStore($selectedPage);
  const rootInstanceId = page?.rootInstanceId ?? "";

  const breakpoints = useMemo(
    () =>
      [...breakpointsMap.values()].sort(
        compareMedia as (a: Breakpoint, b: Breakpoint) => number
      ),
    [breakpointsMap]
  );

  const elements = useMemo(() => {
    if (!rootInstanceId) return null;
    return (
      <ReactSdkContext.Provider
        value={{
          renderer: isPreviewMode ? "preview" : "canvas",
          isSafeMode: false,
          assetBaseUrl,
          imageLoader: wsImageLoader,
          videoLoader: undefined,
          resources: {},
          breakpoints,
          onError: (err: unknown) => console.error("[canvas]", err),
        }}
      >
        {createInstanceElement({
          instances,
          instanceId: rootInstanceId,
          instanceSelector: [rootInstanceId],
          Component: isPreviewMode
            ? WebstudioComponentPreview
            : WebstudioComponentCanvas,
          components,
        })}
      </ReactSdkContext.Provider>
    );
  }, [instances, rootInstanceId, components, isPreviewMode, breakpoints]);

  return { elements, instances };
};

// ─── Canvas component ─────────────────────────────────────────────────────────

export const Canvas = () => {
  // Connect this iframe as a SyncClient follower.
  useCanvasStore();

  // Style rendering (M-S1): mount stylesheets in cascade order, then subscribe
  // the user/state/helper sheets to the style atoms.
  useLayoutEffect(() => {
    mountStyles();
    const unsubscribeStyles = subscribeStyles();
    const unsubscribeStateStyles = subscribeStateStyles();
    const unsubscribeHelperStyles = subscribeHelperStyles();
    return () => {
      unsubscribeStyles();
      unsubscribeStateStyles();
      unsubscribeHelperStyles();
    };
  }, []);

  // Register component libraries once on mount.
  const [librariesRegistered, setLibrariesRegistered] = useState(false);
  useEffect(() => {
    if (librariesRegistered) return;
    // Core metas (non-renderable abstract components)
    registerComponentLibrary({
      components: {},
      metas: coreMetas as Record<string, import("@webstudio-is/sdk").WsComponentMeta>,
      templates: coreTemplates as any,
    });
    // Base components
    registerComponentLibrary({
      components: baseComponents as Record<string, unknown>,
      metas: baseComponentMetas as Record<string, import("@webstudio-is/sdk").WsComponentMeta>,
      templates: baseComponentTemplates as any,
      hooks: baseComponentHooks,
    });
    // Radix UI components
    registerComponentLibrary({
      namespace: "@webstudio-is/sdk-components-react-radix",
      components: radixComponents as Record<string, unknown>,
      metas: radixComponentMetas as Record<string, import("@webstudio-is/sdk").WsComponentMeta>,
      templates: radixTemplates as any,
      hooks: radixComponentHooks,
    });
    // Nova extended components (P45: RepeatList; M5: Slot)
    registerComponentLibrary({
      namespace: "nova",
      components: { RepeatList, Slot } as Record<string, unknown>,
      metas: { RepeatList: repeatListMeta, Slot: slotMeta },
    });
    // shadcn visual components
    const cleanComponents: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(shadcnComponents)) {
      const cleanKey = key.startsWith("Shadcn") ? key.substring(6) : key;
      cleanComponents[cleanKey] = value;
    }
    const cleanMetas: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(shadcnMetas)) {
      const cleanKey = key.startsWith("Shadcn") ? key.substring(6) : key;
      cleanMetas[cleanKey] = value;
    }
    registerComponentLibrary({
      namespace: "shadcn",
      components: cleanComponents,
      metas: cleanMetas as Record<string, import("@webstudio-is/sdk").WsComponentMeta>,
    });
    setLibrariesRegistered(true);
  }, [librariesRegistered]);

  // Expose canvas API.
  useEffect(() => {
    initCanvasApi();
    // Webstudio's normalize makes <html> a 1fr grid; 1fr = minmax(auto, 1fr), so
    // <body> could never be narrower than its widest content and every
    // width:100% resolved against that — pages overflowed on phone breakpoints.
    injectStyleEl("nova-canvas-base", "body { min-width: 0; }");
  }, []);

  // Drag-reparent (FA-007): press-drag the selected element to move it.
  useEffect(() => initDragReparent(), []);

  // Builder shortcuts must work while focus is inside the canvas iframe.
  const previewMode = useStore($isPreviewMode);
  useForwardShortcutsToBuilder(!previewMode);

  // Grid keyboard shortcuts (Alt+←/→ = move colStart; Alt+Shift+←/→ = resize span).
  // Only fires when $isPreviewMode is false and an instance is selected.
  useEffect(() => {
    const COLS = 12;
    const onKeyDown = (e: KeyboardEvent) => {
      if ($isPreviewMode.get()) return;
      if ($textEditingInstance.get()) return;
      if (!e.altKey) return;
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;

      const selector = $selectedInstanceSelector.get();
      const instanceId = selector?.[0];
      if (!instanceId) return;

      // Find the element in the canvas DOM
      const el = document.querySelector(`[${selectorIdAttribute}^="${instanceId}"]`) as HTMLElement | null;
      if (!el) return;

      // Only act on grid children
      const parent = el.parentElement;
      if (!parent || getComputedStyle(parent).display !== "grid") return;

      // Parse current grid-column
      const cs = getComputedStyle(el);
      const rawStart = cs.gridColumnStart;
      const rawEnd = cs.gridColumnEnd;
      let colStart = rawStart !== "auto" ? parseInt(rawStart) || 1 : 1;
      let span = COLS;
      if (rawEnd.startsWith("span ")) {
        span = parseInt(rawEnd.replace("span ", "")) || COLS;
      } else if (rawEnd !== "auto") {
        const endNum = parseInt(rawEnd);
        if (!isNaN(endNum)) span = Math.max(1, endNum - colStart);
      }

      const dir = e.key === "ArrowRight" ? 1 : -1;

      if (e.shiftKey) {
        // Resize span
        const newSpan = Math.max(1, Math.min(COLS - colStart + 1, span + dir));
        if (newSpan === span) return;
        e.preventDefault();
        window.parent.postMessage(
          { type: "nova:gridColumnCommit", instanceId, colStart, span: newSpan },
          window.location.origin
        );
      } else {
        // Move colStart
        const newColStart = Math.max(1, Math.min(COLS - span + 1, colStart + dir));
        if (newColStart === colStart) return;
        e.preventDefault();
        window.parent.postMessage(
          { type: "nova:gridColumnCommit", instanceId, colStart: newColStart, span },
          window.location.origin
        );
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);



  // Scroll newly-selected instance into view with retry (M7b).
  useEffect(() => {
    return $selectedInstanceSelector.subscribe((selector) => {
      const instanceId = selector?.[0];
      if (!instanceId) return;
      let attempts = 0;
      // data-ws-id, not data-ws-selector: the selector holds the whole ancestor
      // path ("id,parent,…"), so an exact match only ever hit the page root.
      const tryScroll = () => {
        const el = document.querySelector(`[data-ws-id="${instanceId}"]`);
        if (el) {
          el.scrollIntoView({ block: "nearest", inline: "nearest" });
        } else if (attempts++ < 20) {
          setTimeout(tryScroll, 50);
        }
      };
      requestAnimationFrame(tryScroll);
    });
  }, []);

  // Inject/update :root { --var: value; } whenever $cssVars changes.
  useEffect(() => {
    return $cssVars.subscribe((vars) => {
      const entries = Object.entries(vars);
      const decls = entries.map(([k, v]) => `  --${k}: ${v};`).join("\n");
      injectStyleEl("nova-css-vars", entries.length ? `:root {\n${decls}\n}` : "");
    });
  }, []);

  // Inject/update custom raw CSS whenever $customCss changes.
  useEffect(() => {
    return $customCss.subscribe((css) => {
      injectStyleEl("nova-custom-css", css);
    });
  }, []);

  // Apply JS interactions (P46) — only in preview mode to avoid interfering with editing.
  useEffect(() => {
    let abortControllers: AbortController[] = [];

    const cleanup = () => {
      abortControllers.forEach((c) => c.abort());
      abortControllers = [];
    };

    const applyInteractions = () => {
      cleanup();
      if (!$isPreviewMode.get()) return;
      const interactions = $interactions.get();
      for (const [instanceId, defs] of Object.entries(interactions)) {
        if (!defs.length) continue;
        let target: HTMLElement | null = null;
        for (const el of document.querySelectorAll(`[${selectorIdAttribute}]`)) {
          const raw = el.getAttribute(selectorIdAttribute) ?? "";
          if (raw === instanceId || raw.startsWith(`${instanceId},`)) {
            target = el as HTMLElement;
            break;
          }
        }
        if (!target) continue;
        for (const def of defs) {
          const ctrl = new AbortController();
          abortControllers.push(ctrl);
          const el = target;
          target.addEventListener(def.trigger, () => {
            const a = def.action;
            if (a.type === "navigate") {
              if (a.newTab) window.open(a.url, "_blank");
              else window.location.href = a.url;
            } else if (a.type === "toggleClass") {
              el.classList.toggle(a.className);
            } else if (a.type === "showHide") {
              const tgt = a.targetInstanceId
                ? (() => {
                    for (const e2 of document.querySelectorAll(`[${selectorIdAttribute}]`)) {
                      const r = e2.getAttribute(selectorIdAttribute) ?? "";
                      if (r === a.targetInstanceId || r.startsWith(`${a.targetInstanceId},`)) return e2 as HTMLElement;
                    }
                    return null;
                  })()
                : el;
              if (tgt) tgt.style.display = tgt.style.display === "none" ? "" : "none";
            } else if (a.type === "animate") {
              el.animate(
                [{ transform: "translateY(0)" }, { transform: `translateY(0)` }],
                { duration: a.duration, easing: a.easing, fill: a.fill }
              );
              // Named keyframe: look up @keyframes by name in document stylesheets
              const kf = a.keyframe;
              el.style.animation = `${kf} ${a.duration}ms ${a.easing} ${a.fill}`;
              setTimeout(() => { el.style.animation = ""; }, a.duration + 100);
            }
          }, { signal: ctrl.signal });
        }
      }
    };

    const unsubMode = $isPreviewMode.subscribe(() => requestAnimationFrame(applyInteractions));
    const unsubInteract = $interactions.subscribe(() => requestAnimationFrame(applyInteractions));
    requestAnimationFrame(applyInteractions);
    return () => { unsubMode(); unsubInteract(); cleanup(); };
  }, []);

  // ── Direct instance-children update from builder PropsEditorPanel ───────────
  // Bypasses the SyncClient emitter chain (which has a startup race on demo).
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if ($isPreviewMode.get()) return;
      if (e.data?.type !== "nova:instanceChildren") return;
      const { instanceId, children } = e.data as {
        instanceId: string;
        children: { type: string; value: string }[];
      };
      const inst = $instances.get().get(instanceId);
      if (!inst) return;
      // Merge: keep non-text children, replace text children
      const nonText = inst.children.filter((c) => c.type !== "text");
      const next = new Map($instances.get());
      next.set(instanceId, { ...inst, children: [...children, ...nonText] } as Parameters<typeof next.set>[1]);
      $instances.set(next);
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  useEffect(() => initGridGuides(), []);

  useEffect(() => initSidebarDropIndicator(), []);

  useEffect(() => initAssetDrop(), []);

  useEffect(() => initDesignInterceptors(), []);

  useEffect(() => initPointerSelection(), []);

  const { elements, instances } = useElementsTree();
  const components = useStore($registeredComponents);

  console.log("[canvas] Render tick details:", {
    librariesRegistered,
    componentsSize: components.size,
    instancesSize: instances.size,
    instancesMap: Array.from(instances.entries()).map(([k, v]) => ({ id: k, children: v.children.length }))
  });

  // Don't render until libraries are registered and at least one instance exists.
  if (!librariesRegistered || components.size === 0 || instances.size === 0) {
    return null;
  }

  return (
    <>
      <GlobalStyles />
      {elements}
      <SelectionOverlay />
      <TextEditOverlay />
      <ImageLightbox />
    </>
  );
};
