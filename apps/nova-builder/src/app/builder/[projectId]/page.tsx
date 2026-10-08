"use client";
import { ClientOnly } from "@/components/ClientOnly";

// Builder page — 3-column CSS Grid layout mirroring Webstudio's chrome.
//
// Grid areas:
//   topbar  topbar  topbar
//   left    main    right
//   footer  footer  footer
//
// Lifecycle concerns live in focused modules (SOLID S1):
//   load/seed/sync  → builder/hooks/useProjectLoad
//   keyboard        → builder/hooks/useBuilderKeyboard
//   save            → lib/saveProject
//   rich text parse → lib/richText
//   canvas messages → builder/hooks/useCanvasMessages
// This file owns only: layout and canvas zoom/fit.

import { useEffect, useRef, useCallback, useState } from "react";
import { useStore } from "@nanostores/react";
import { useParams } from "next/navigation";
import { nanoid } from "nanoid";
import { useI18n } from "@/lib/i18n";
import { useSession } from "next-auth/react";
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
import {
  $selectedBreakpoint, $aiPanelOpen, $aiInitialPrompt, $canvasZoom, $gridGuidesVisible,
  $selectedInstanceSelector, $pendingCanvasMsg,
  $cssVars, $interactions, $customCss, $isDirty, $saveTriggerCount, $importKey,
} from "@/lib/nano-states";
import { $symbols } from "@/lib/symbols";
import { saveProject } from "@/lib/saveProject";
import type { SyncEmitter } from "@/lib/sync-client";


import { useProjectLoad } from "@/builder/hooks/useProjectLoad";
import { useBuilderKeyboard } from "@/builder/hooks/useBuilderKeyboard";
import { useAutosaveExtras } from "@/builder/hooks/useAutosaveExtras";
import { useUnsavedChangesGuard } from "@/builder/hooks/useUnsavedChangesGuard";
import { useCanvasMessages } from "@/builder/hooks/useCanvasMessages";
import { Topbar } from "@/builder/Topbar";
import { LeftSidebar } from "@/builder/left-sidebar";
import { RightPanel } from "@/builder/RightPanel";
import { Footer } from "@/builder/Footer";
import { AIPanel } from "@/builder/AIPanel";
import { AIContentPanel } from "@/builder/AIContentPanel";
import { A11yPanel } from "@/builder/A11yPanel";
import { PerformancePanel } from "@/builder/PerformancePanel";
import { HistoryPanel } from "@/builder/HistoryPanel";
import { CommandPalette } from "@/builder/CommandPalette";
import { CanvasContextMenu } from "@/builder/CanvasContextMenu";
import { KeyboardShortcutsModal } from "@/builder/KeyboardShortcutsModal";
import { TextFormatToolbar } from "@/builder/TextFormatToolbar";
import { RemoteCursors, RemoteSelections, usePresence } from "@/builder/PresenceLayer";
import { CoachMarks } from "@/builder/CoachMarks";
import { ThemeProvider, $builderTheme } from "@/builder/ThemeProvider";
import { SafeModeBanner } from "@/builder/SafeModeBanner";
import { NestingToast } from "@/builder/NestingToast";

function BuilderPage() {
  const { t } = useI18n();
  const params = useParams<{ projectId: string }>();
  const projectId = params.projectId;
  const isDemo = projectId === "demo";

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const canvasAreaRef = useRef<HTMLDivElement>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [canvasCtxMenu, setCanvasCtxMenu] = useState<{ instanceId: string; x: number; y: number } | null>(null);
  const [textEditingInstanceId, setTextEditingInstanceId] = useState<string | null>(null);
  // canvasKey: bumped after a project import to reload the iframe and re-inject emitter
  const [canvasKey, setCanvasKey] = useState(0);

  const selectedBreakpoint = useStore($selectedBreakpoint);
  const canvasZoom = useStore($canvasZoom);
  const canvasMaxWidth = selectedBreakpoint?.maxWidth ? `${selectedBreakpoint.maxWidth}px` : "100%";
  const gridGuidesVisible = useStore($gridGuidesVisible);
  const builderTheme = useStore($builderTheme);

  // ── Load project + seed atoms + SyncClient (leader) ─────────────────────────
  const { loadState, errorMessage, syncEmitterRef } = useProjectLoad(projectId, isDemo);
  useAutosaveExtras(loadState === "ready" && !isDemo);
  useUnsavedChangesGuard(loadState === "ready" && !isDemo);

  // ── Track dirty state (isDirty) ─────────────────────────────────────────────
  useEffect(() => {
    if (loadState !== "ready") return;

    // Reset dirty state on load
    $isDirty.set(false);

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

    const unsubscribes = atoms.map((a) =>
      a.listen(() => {
        $isDirty.set(true);
      })
    );

    return () => {
      unsubscribes.forEach((un) => un());
    };
  }, [loadState]);

  // ── Live multiplayer presence (P56) ─────────────────────────────────────────
  const { data: session } = useSession();
  const presenceUserRef = useRef({
    id: (session?.user as { id?: string } | undefined)?.id ?? `guest_${nanoid(6)}`,
    name: session?.user?.name ?? session?.user?.email?.split("@")[0] ?? "Guest",
  });
  usePresence(canvasAreaRef, presenceUserRef.current);

  // ── Inject emitter into canvas window ────────────────────────────────────────
  // Called from both onIframeLoad and the loadState→"ready" effect to handle
  // whichever fires first: if iframe loads before the API fetch completes,
  // onIframeLoad finds no emitter yet; when the fetch completes and loadState
  // becomes "ready", the effect injects the emitter into the already-loaded iframe.
  const injectEmitter = useCallback(() => {
    const emitter = syncEmitterRef.current;
    const iframe = iframeRef.current;
    if (!emitter || !iframe?.contentWindow) return;
    (iframe.contentWindow as Window & { __webstudioSharedSyncEmitter__?: SyncEmitter })
      .__webstudioSharedSyncEmitter__ = emitter;
  }, [syncEmitterRef]);

  const onIframeLoad = useCallback(() => {
    injectEmitter();
  }, [injectEmitter]);

  // When the project finishes loading, the emitter is now set — inject into the
  // iframe if it was already loaded (i.e. onIframeLoad fired before the fetch finished).
  useEffect(() => {
    if (loadState === "ready") injectEmitter();
  }, [loadState, injectEmitter]);

  // When a project is imported, $importKey increments — reload the canvas iframe
  // so it remounts cleanly and receives the new atom state via emitter injection.
  useEffect(() => {
    return $importKey.subscribe((key) => {
      if (key > 0) setCanvasKey(key);
    });
  }, []);

  // Forward pending canvas messages from builder components (e.g. PropsEditorPanel)
  // that can't hold a ref to the iframe directly.
  useEffect(() => {
    return $pendingCanvasMsg.subscribe((msg) => {
      if (!msg) return;
      iframeRef.current?.contentWindow?.postMessage(msg, "*");
      $pendingCanvasMsg.set(null);
    });
  }, []);

  // ── Grid guides: forward toggle to canvas via postMessage ────────────────────
  useEffect(() => {
    iframeRef.current?.contentWindow?.postMessage(
      { type: "nova:gridGuides", visible: gridGuidesVisible },
      "*"
    );
  }, [gridGuidesVisible]);

  // ── Canvas zoom: Ctrl+scroll / pinch (passive:false required to preventDefault) ──
  useEffect(() => {
    const container = canvasAreaRef.current;
    if (!container) return;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const current = $canvasZoom.get();
      // Trackpad pinch delivers small deltaY; mouse wheel delivers large steps.
      const rawDelta = e.deltaY;
      // Use a proportional factor capped so one wheel click ≈ 10%.
      const step = Math.min(0.1, Math.abs(rawDelta) * 0.001);
      const next = rawDelta > 0
        ? Math.max(0.1, current - step)
        : Math.min(3, current + step);
      $canvasZoom.set(Math.round(next * 100) / 100);
    };
    container.addEventListener("wheel", onWheel, { passive: false });
    return () => container.removeEventListener("wheel", onWheel);
  }, []); // canvasAreaRef is stable — register once on mount

  // ── Fit-to-width: zoom out (or reset) so breakpoint canvas fits container ──
  const fitToWidth = useCallback(() => {
    const container = canvasAreaRef.current;
    const bp = $selectedBreakpoint.get();
    if (!container || !bp?.maxWidth) {
      // Desktop (no maxWidth): canvas fills container naturally → 100%
      $canvasZoom.set(1);
      return;
    }
    const containerW = container.clientWidth;
    const fitZoom = Math.min(1, containerW / bp.maxWidth);
    $canvasZoom.set(Math.round(fitZoom * 100) / 100);
  }, []);

  // ── Auto-open AI panel with pending prompt for new empty sites ───────────────
  useEffect(() => {
    if (loadState !== "ready") return;
    const pending = sessionStorage.getItem("nova-pending-prompt");
    if (!pending) return;
    // Only auto-trigger if the site is empty (≤2 instances = root + maybe one placeholder)
    if ($instances.get().size > 2) return;
    sessionStorage.removeItem("nova-pending-prompt");
    $aiInitialPrompt.set(pending);
    $aiPanelOpen.set(true);
  }, [loadState]);

  // ── Canvas postMessage bridge (builder/hooks/useCanvasMessages) ──
  useCanvasMessages({
    enabled: loadState === "ready",
    iframeRef,
    onContextMenu: setCanvasCtxMenu,
    onTextEditing: setTextEditingInstanceId,
  });

  // ── Save: button + Ctrl+S ────────────────────────────────────────────────────
  const handleSave = useCallback(() => {
    if (loadState !== "ready") return;
    $saveTriggerCount.set($saveTriggerCount.get() + 1);
  }, [loadState]);

  const toggleShortcuts = useCallback(() => setShortcutsOpen((v) => !v), []);
  useBuilderKeyboard({
    enabled: loadState === "ready",
    onSave: handleSave,
    onFitToWidth: fitToWidth,
    onToggleShortcuts: toggleShortcuts,
  });

  // ─── Render ──────────────────────────────────────────────────────────────────

  if (loadState === "error") {
    return (
      <ThemeProvider style={{ fontFamily: "system-ui, sans-serif", background: "var(--ui-card)", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div role="alert" style={{ maxWidth: 420, textAlign: "center", padding: 32, color: "var(--ui-text)" }}>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{t.chrome.loadFailed}</div>
          <div style={{ fontSize: 14, color: "var(--ui-text-muted)", lineHeight: 1.5, marginBottom: 20 }}>
            {/404/.test(errorMessage ?? "") ? t.chrome.loadNotFound : t.chrome.loadFailedHint}
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
            <button onClick={() => window.location.reload()} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid var(--ui-border)", background: "transparent", color: "var(--ui-text)", cursor: "pointer", fontSize: 13 }}>
              {t.chrome.loadRetry}
            </button>
            <a href="/projects" style={{ padding: "8px 16px", borderRadius: 8, background: "var(--ui-accent)", color: "#fff", textDecoration: "none", fontSize: 13, fontWeight: 600 }}>
              {t.builder.backToMySites}
            </a>
          </div>
          <div style={{ marginTop: 16, fontSize: 11, color: "var(--ui-text-muted)" }}>{errorMessage}</div>
        </div>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider
      style={{
        display: "grid",
        gridTemplate: `
          "topbar topbar topbar" 44px
          "left   main   right"  1fr
          "footer footer footer" 36px
          / auto 1fr 280px
        `,
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        background: "var(--ui-card)",
      }}
    >
      {/* Topbar */}
      <Topbar isDemo={isDemo} />

      {/* Left sidebar — only mount once ready (needs atom data for navigator/pages) */}
      {loadState === "ready" && <LeftSidebar />}
      {loadState === "loading" && (
        <div style={{ gridArea: "left", background: "var(--ui-bg)", borderRight: "1px solid var(--ui-border)" }} />
      )}

      {/* Canvas — centered, constrained by active breakpoint, scalable */}
      <div
        ref={canvasAreaRef}
        style={{
          gridArea: "main",
          background: "#e5e7eb",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "center",
          overflow: "auto",
          position: "relative",
        }}
      >
        {/* Live collaborator cursors (P56) */}
        {loadState === "ready" && <RemoteCursors containerRef={canvasAreaRef} />}
        {/* Remote selection outlines (M12 co-editing) */}
        {loadState === "ready" && <RemoteSelections iframeRef={iframeRef} containerRef={canvasAreaRef} />}
        {/* Safe-mode banner: empty page call-to-action */}
        {loadState === "ready" && <SafeModeBanner />}

        {loadState === "loading" && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--ui-text-muted)",
              fontFamily: "system-ui, sans-serif",
              fontSize: 14,
            }}
          >
            {t.chrome.loadingProject}
          </div>
        )}
        {/* Text format toolbar — appears during double-click text editing */}
        {textEditingInstanceId && <TextFormatToolbar iframeRef={iframeRef} />}

        {loadState === "ready" && (
          // Scale wrapper — zoom applied here, not on the iframe, so iframe stays interactive
          <div
            style={{
              transform: `scale(${canvasZoom})`,
              transformOrigin: "top center",
              flexShrink: 0,
              width: canvasMaxWidth,
              // Extend the layout footprint to match the visual size at zoom > 1,
              // so the outer container gains a real scrollable area.
              // Formula: visual height = H * zoom; layout height = H; deficit = H*(zoom-1)
              marginBottom: canvasZoom > 1
                ? `calc((100vh - 80px) * ${canvasZoom - 1})`
                : 0,
              transition: "transform 0.12s ease",
            }}
          >
            <iframe
              key={canvasKey}
              ref={iframeRef}
              src={`/canvas?theme=${builderTheme}${canvasKey > 0 ? `&v=${canvasKey}` : ""}`}
              onLoad={onIframeLoad}
              style={{
                // Explicit pixel height so the scale wrapper has known dimensions.
                // 80px = topbar (44px) + footer (36px).
                width: "100%",
                height: "calc(100vh - 80px)",
                border: "none",
                display: "block",
                transition: "width 0.2s ease",
              }}
              // i18n-ignore — stable selector used by useDraggable + e2e specs
              title="Canvas"
            />
          </div>
        )}
      </div>

      {/* Right panel — Style + Settings tabs */}
      {loadState === "ready" && <RightPanel />}
      {loadState === "loading" && (
        <div style={{ gridArea: "right", background: "#0f172a", borderLeft: "1px solid rgba(255,255,255,0.08)" }} />
      )}

      {/* Footer — breadcrumb */}
      {loadState === "ready" && <Footer />}

      {/* AI panel — fixed overlay, no grid area needed */}
      {loadState === "ready" && <AIPanel />}

      {/* Tool panels — fixed overlays, toggled from Topbar */}
      {loadState === "ready" && <AIContentPanel />}
      {loadState === "ready" && <A11yPanel />}
      {loadState === "ready" && <PerformancePanel />}
      {loadState === "ready" && <HistoryPanel />}

      {/* Command palette — fixed overlay, ⌘K trigger */}
      {loadState === "ready" && <CommandPalette />}

      {/* Canvas context menu — portal anchored to right-click position */}
      {canvasCtxMenu && (
        <CanvasContextMenu
          instanceId={canvasCtxMenu.instanceId}
          x={canvasCtxMenu.x}
          y={canvasCtxMenu.y}
          onClose={() => setCanvasCtxMenu(null)}
        />
      )}
      {loadState === "loading" && (
        <div style={{ gridArea: "footer", background: "#0a0a14", borderTop: "1px solid rgba(255,255,255,0.08)" }} />
      )}

      {/* Coach marks — first-time builder onboarding (self-dismisses to localStorage) */}
      {loadState === "ready" && !isDemo && <CoachMarks visible={true} />}

      {/* Keyboard shortcuts modal — toggled by "?" key */}
      {shortcutsOpen && <KeyboardShortcutsModal onClose={() => setShortcutsOpen(false)} />}

      {/* Content-model warning toast (M5) */}
      <NestingToast />
    </ThemeProvider>
  );
}

// Client-only: skip server rendering (Worker CPU, Error 1102).
export default function Page() {
  return (
    <ClientOnly>
      <BuilderPage />
    </ClientOnly>
  );
}
