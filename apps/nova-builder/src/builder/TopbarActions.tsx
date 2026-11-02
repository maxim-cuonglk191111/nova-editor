"use client";
import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@nanostores/react";
import {
  $projectMeta,
  $pages,
  $assets,
  $instances,
  $props,
  $dataSources,
  $resources,
  $breakpoints,
  $styles,
  $styleSources,
  $styleSourceSelections,
} from "@/lib/data-stores";
import { serializeWebstudioData } from "@/lib/schema";
import {
  $builderMode,
  $aiPanelOpen,
  $aiContentPanelOpen,
  $a11yPanelOpen,
  $perfPanelOpen,
  $historyPanelOpen,
  $canvasZoom,
  $fitToWidthTrigger,
  $gridGuidesVisible,
  $cssPreviewOpen,
  $cssVars,
  $interactions,
  $customCss,
  $isDirty,
  $saveTriggerCount,
  showToast,
  openFeatureGate,
} from "@/lib/nano-states";
import { saveProject, SaveConflictError, AuthRequiredError, assertSignedIn, getSerializedProjectSchema } from "@/lib/saveProject";
import { captureCurrentProjectThumbnail } from "@/lib/thumbnailCapture";
import { DEMO_DRAFT_KEY } from "@/builder/hooks/useDemoDraftSync";
import { SaveProjectDialog } from "./SaveProjectDialog";
import { DeployPanel } from "./DeployPanel";
import { CollaboratorAvatars } from "./PresenceLayer";
import { TopbarMenu, type TopbarMenuItem } from "./TopbarMenu";
import { useToggleAIPanel } from "./useToggleAIPanel";
import { Icon } from "./icons";
import { exportProject } from "@/features/export/export-project";
import { importProject } from "@/features/import/import-project";
import { exportHtml } from "@/features/export-html/export-html";
import { UI_VARS as C, UI_SHAPE as S } from "@/lib/uiTheme";
import { useI18n, fmt } from "@/lib/i18n";
import { $saveStatus } from "@/lib/saveQueue";
import type { I18nBuilderDictionary } from "@/lib/i18n/types";
import { $symbols } from "@/lib/symbols";
import { useSession } from "next-auth/react";

// Sync-status chip (M2): reflects the patch-autosave queue. Conflict offers a
// reload — the only safe recovery when another tab/session saved first.
function SyncStatusChip() {
  const { t } = useI18n();
  const status = useStore($saveStatus);
  if (status === "idle") return null;
  const labels: Record<string, { key: keyof I18nBuilderDictionary; color: string }> = {
    saving: { key: "syncSaving", color: C.textMuted },
    saved: { key: "syncSaved", color: C.success },
    recovering: { key: "syncRecovering", color: C.textMuted },
    error: { key: "syncError", color: C.danger },
    conflict: { key: "syncConflict", color: C.danger },
  };
  const entry = labels[status];
  if (!entry) return null;
  return (
    <span
      role={status === "conflict" ? "alert" : undefined}
      title={status === "conflict" ? t.builder.syncConflictHint : undefined}
      style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: entry.color, fontFamily: C.font, padding: "0 4px", whiteSpace: "nowrap" }}
    >
      {t.builder[entry.key]}
      {status === "conflict" && (
        <button
          onClick={() => window.location.reload()}
          style={{ padding: "2px 8px", borderRadius: 4, border: `1px solid ${C.danger}`, background: "none", color: C.danger, fontSize: 12, fontFamily: C.font, cursor: "pointer", fontWeight: 600 }}
        >
          {t.builder.syncConflictReload}
        </button>
      )}
    </span>
  );
}

function UnsavedChangesModal({ onConfirm, onClose }: { onConfirm: () => void; onClose: () => void }) {
  const { t } = useI18n();
  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: "fixed", inset: 0, background: "rgba(17,17,17,0.42)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10000 }}
    >
      <div style={{ width: 440, background: C.card, border: `1px solid ${C.border}`, borderRadius: 24, padding: 28, display: "flex", flexDirection: "column", gap: 18, boxShadow: C.shadowPop }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h2 style={{ margin: 0, fontSize: 21, fontWeight: 700, letterSpacing: "-0.015em", color: C.text, fontFamily: C.font }}>{t.chrome.unsavedTitle}</h2>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: C.textMuted || "rgba(255,255,255,0.5)", fontSize: 18, cursor: "pointer", lineHeight: 1 }}><Icon name="close" size={14} weight="bold" /></button>
        </div>

        <p style={{ margin: 0, fontSize: 15, color: C.textMuted, fontFamily: C.font, lineHeight: 1.55 }}>
          {t.chrome.unsavedBody}
        </p>

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 8 }}>
          <button onClick={onClose}
            style={{ height: 44, padding: "0 20px", borderRadius: 12, border: `1px solid ${C.border}`, background: C.card, color: C.textDim, fontSize: 15, fontFamily: C.font, cursor: "pointer" }}>
            {t.chrome.cancel}
          </button>
          <button onClick={onConfirm}
            style={{ height: 44, padding: "0 22px", borderRadius: 12, border: "none", background: C.error, color: "#fff", fontSize: 15, fontFamily: C.font, fontWeight: 700, cursor: "pointer" }}>
            {t.chrome.import}
          </button>
        </div>
      </div>
    </div>
  );
}

type Props = {
  isDemo?: boolean;
};

// AI Content Fill, Accessibility, Performance and History float in the same
// spot; opening one closes the others so they never stack on top of each other.
const FLOATING_PANELS = [$aiContentPanelOpen, $a11yPanelOpen, $perfPanelOpen, $historyPanelOpen, $cssPreviewOpen];
function openFloatingPanel(panel: (typeof FLOATING_PANELS)[number], open: boolean) {
  if (open) for (const p of FLOATING_PANELS) if (p !== panel) p.set(false);
  panel.set(open);
}

export function TopbarActions({ isDemo }: Props) {
  const { t } = useI18n();
  const router = useRouter();
  const meta = useStore($projectMeta);
  const mode = useStore($builderMode);
  const aiToggle = useToggleAIPanel(isDemo);
  const isAIPanelOpen = aiToggle.open;
  const isAIContentOpen = useStore($aiContentPanelOpen);
  const isA11yOpen = useStore($a11yPanelOpen);
  const isPerfOpen = useStore($perfPanelOpen);
  const isHistoryOpen = useStore($historyPanelOpen);
  const canvasZoom = useStore($canvasZoom);
  const gridGuides = useStore($gridGuidesVisible);
  const cssPreview = useStore($cssPreviewOpen);

  const { status: authStatus } = useSession();
  const isLoggedIn = authStatus === "authenticated";

  const isDirty = useStore($isDirty);
  const saveTriggerCount = useStore($saveTriggerCount);

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<number | null>(null);
  const [timeLabel, setTimeLabel] = useState<string>("");
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);

  const [published, setPublished] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [deployOpen, setDeployOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importConfirmOpen, setImportConfirmOpen] = useState(false);

  const handleImportClick = () => {
    if (isDirty) {
      setImportConfirmOpen(true);
    } else {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    e.target.value = "";

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      importProject(content);
    };
    reader.readAsText(file);
  };

  const handleSaveClick = useCallback(() => {
    if (isSaving) return;
    if (isDemo && !isLoggedIn) {
      try {
        const schema = getSerializedProjectSchema();
        localStorage.setItem(DEMO_DRAFT_KEY, JSON.stringify(schema));
      } catch (e) {
        console.warn("[TopbarActions] Failed to cache demo draft:", e);
      }
      openFeatureGate("save");
      return;
    }
    setSaveDialogOpen(true);
  }, [isSaving, isDemo, isLoggedIn]);

  // Sync keyboard Ctrl+S / trigger count to show dialog
  useEffect(() => {
    if (saveTriggerCount > 0) {
      handleSaveClick();
    }
  }, [saveTriggerCount, handleSaveClick]);

  // Update time elapsed label since last save
  useEffect(() => {
    if (lastSavedTime === null || isSaving || isDirty) return;

    const updateLabel = () => {
      const diff = Date.now() - lastSavedTime;
      const seconds = Math.floor(diff / 1000);
      if (seconds < 10) {
        setTimeLabel(t.chrome.saved);
      } else if (seconds < 60) {
        setTimeLabel(fmt(t.chrome.savedSecondsAgo, { s: seconds }));
      } else {
        const minutes = Math.floor(seconds / 60);
        setTimeLabel(fmt(t.chrome.savedMinutesAgo, { m: minutes }));
      }
    };

    updateLabel();
    const interval = setInterval(updateLabel, 5000);
    return () => clearInterval(interval);
  }, [lastSavedTime, isSaving, isDirty, t]);

  const handleUpdate = async () => {
    if (!meta) return;
    setIsSaving(true);
    setSaveError(false);
    try {
      await saveProject(meta.id);
      $isDirty.set(false);
      setLastSavedTime(Date.now());
      // Stay in the editor: saving used to throw the user out to /projects.
      showToast(t.chrome.toastUpdated, "success");
    } catch (err) {
      console.error(err);
      setSaveError(true);
      showToast(err instanceof SaveConflictError ? t.chrome.saveDialog.errorConflict : t.chrome.toastUpdateFailed, "error");
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  const getProjectPayload = (name: string, description: string = "", thumbnail: string = "") => {
    const data = {
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
    };
    const serialized = serializeWebstudioData(data);
    return {
      name,
      schema_json: {
        schemaVersion: "5.0",
        data: serialized,
        cssVars: $cssVars.get(),
        interactions: $interactions.get(),
        customCss: $customCss.get(),
        symbols: $symbols.get(),
        metadata: {
          description,
          thumbnail,
        }
      }
    };
  };

  const handleCreate = async (name: string, description: string, thumbnail: string) => {
    setIsSaving(true);
    setSaveError(false);
    try {
      const finalThumb = thumbnail || captureCurrentProjectThumbnail();
      const payload = getProjectPayload(name, description, finalThumb);
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      assertSignedIn(res);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP ${res.status}`);
      }
      const { id } = (await res.json()) as { id: string };

      $projectMeta.set({ id, name, updatedAt: new Date().toISOString() });
      $isDirty.set(false);
      setLastSavedTime(Date.now());

      showToast(t.chrome.toastCreated, "success");
      router.push("/projects");
    } catch (err) {
      console.error(err);
      setSaveError(true);
      showToast(err instanceof AuthRequiredError ? t.chrome.toastSignedOut : err instanceof Error ? err.message : t.chrome.toastCreateFailed, "error");
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAs = async (newName: string) => {
    setIsSaving(true);
    setSaveError(false);
    try {
      const copyThumb = captureCurrentProjectThumbnail();
      const payload = getProjectPayload(newName, "", copyThumb);
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      assertSignedIn(res);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP ${res.status}`);
      }
      const { id } = (await res.json()) as { id: string };

      $projectMeta.set({ id, name: newName, updatedAt: new Date().toISOString() });
      $isDirty.set(false);
      setLastSavedTime(Date.now());

      showToast(t.chrome.toastCopySaved, "success");
      router.push("/projects");
    } catch (err) {
      console.error(err);
      setSaveError(true);
      showToast(err instanceof AuthRequiredError ? t.chrome.toastSignedOut : err instanceof Error ? err.message : t.chrome.toastCopyFailed, "error");
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = useCallback(() => {
    if (!meta) return;
    navigator.clipboard.writeText(`${window.location.origin}/preview/${meta.id}`).then(() => {
      setPublished(true);
      setTimeout(() => setPublished(false), 2500);
    });
  }, [meta]);

  const exportItems: TopbarMenuItem[] = [
      {
        label: t.builder.exportHtml,
        title: t.chrome.exportHtmlTitle,
        href: meta && !isDemo ? `/api/export/${meta.id}` : undefined,
        download: meta && !isDemo,
        onClick: isDemo
          ? () => {
              setExportOpen(false);
              openFeatureGate("export-html");
            }
          : undefined,
      },
      {
        label: t.builder.exportProject,
        title: t.chrome.exportProjectTitle,
        onClick: () => exportProject(meta ? meta.name : "untitled"),
      },
      {
        label: t.builder.importProject,
        title: t.chrome.importProjectTitle,
        onClick: () => { setExportOpen(false); handleImportClick(); },
      },
  ];

  const toolItems: TopbarMenuItem[] = [
      {
        label: t.builder.aiContentFill,
        active: isAIContentOpen,
        onClick: () => {
          if (isDemo && !isLoggedIn) {
            openFeatureGate("ai");
          } else {
            openFloatingPanel($aiContentPanelOpen, !isAIContentOpen);
          }
        },
      },
      { label: t.builder.accessibility, active: isA11yOpen, onClick: () => openFloatingPanel($a11yPanelOpen, !isA11yOpen) },
      { label: t.builder.history, active: isHistoryOpen, onClick: () => openFloatingPanel($historyPanelOpen, !isHistoryOpen) },
      { label: t.builder.gridGuides, active: gridGuides, onClick: () => $gridGuidesVisible.set(!gridGuides) },
  ];

  return (
    <>
      {/* Right action area — unified controls (ADR-NB-022: zero JSX branching on isDemo) */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        <CollaboratorAvatars />

        {/* Sync status chip (patch autosave) or Demo status badge */}
        {isDemo ? (
          <span
            className="nb-hide-mid"
            style={{
              fontSize: 12,
              fontFamily: C.font,
              color: C.textMuted,
              padding: "5px 10px",
              borderRadius: S.radiusPill,
              background: C.surface,
              border: `1px solid ${C.border}`,
              whiteSpace: "nowrap",
            }}
          >
            {t.builder.demoNotice}
          </span>
        ) : (
          <SyncStatusChip />
        )}

        {/* 1 — Export ▾ (HTML + Export Project + Import Project) */}
        <TopbarMenu
          className="nb-hide-narrow"
          trigger={t.builder.export}
          open={exportOpen}
          onToggle={() => { setExportOpen((v) => !v); setToolsOpen(false); }}
          onClose={() => setExportOpen(false)}
          items={exportItems}
        />

        {/* Deploy panel (opens from Export menu if active) */}
        {deployOpen && meta && !isDemo && (
          <div style={{ position: "relative" }}>
            <DeployPanel projectId={meta.id} onClose={() => setDeployOpen(false)} />
          </div>
        )}

        {/* 2 — Tools ▾ (Fill, A11y, Perf, History, Grid Guides) */}
        <TopbarMenu
          className="nb-hide-narrow"
          trigger={t.builder.tools}
          open={toolsOpen}
          onToggle={() => { setToolsOpen((v) => !v); setExportOpen(false); }}
          onClose={() => setToolsOpen(false)}
          items={toolItems}
        />

        {/* Below 1280px the two menus become one, so the primary buttons keep their room */}
        <TopbarMenu
          className="nb-show-narrow"
          trigger={t.builder.more}
          open={moreOpen}
          onToggle={() => { setMoreOpen((v) => !v); setExportOpen(false); setToolsOpen(false); }}
          onClose={() => setMoreOpen(false)}
          items={[...exportItems, ...toolItems]}
        />

        {/* 3 — Save: the one filled button of the bar */}
        <button
          onClick={handleSaveClick}
          disabled={isSaving || (!isDemo && !isDirty && !saveError)}
          style={{
            height: S.controlLg - 4,
            padding: "0 20px",
            borderRadius: S.radiusMd,
            border: "none",
            background: isSaving
              ? C.surface
              : saveError
                ? C.danger
                : (isDirty || isDemo)
                  ? C.primary
                  : C.surface,
            color: isSaving || (!isDirty && !saveError && !isDemo) ? C.textMuted : saveError ? "#fff" : C.onPrimary,
            fontSize: 14,
            fontFamily: C.font,
            cursor: isSaving || (!isDirty && !saveError && !isDemo) ? "default" : "pointer",
            fontWeight: 700,
            transition: "all 0.15s",
          }}
        >
          {isSaving
            ? t.chrome.saving
            : saveError
              ? t.chrome.saveFailedRetry
              : (isDirty || isDemo)
                ? t.chrome.save
                : lastSavedTime !== null
                  ? timeLabel
                  : t.chrome.saved}
        </button>

        {/* 4 — ✦ Generate: opens the AI tab */}
        <button
          onClick={aiToggle.toggle}
          title={t.chrome.generateWithAI}
          style={{ height: S.control, padding: "0 14px", borderRadius: S.radiusMd, border: `1px solid ${isAIPanelOpen ? C.accent : C.accentBorder}`, background: isAIPanelOpen ? C.accentBg : C.card, color: C.accentText, fontSize: 13, fontFamily: C.font, cursor: "pointer", fontWeight: 700, whiteSpace: "nowrap", display: "inline-flex", alignItems: "center", gap: 6 }}
        >
          <Icon name="ai" size={16} weight="fill" />
          {t.builder.generate}
        </button>

        {/* In Demo mode: subtle sign up button if not logged in */}
        {isDemo && !isLoggedIn && (
          <button
            onClick={() => router.push("/signup")}
            style={{
              height: S.control,
              padding: "0 14px",
              borderRadius: S.radiusMd,
              border: "none",
              background: C.accent,
              color: "#fff",
              fontSize: 13,
              fontFamily: C.font,
              cursor: "pointer",
              fontWeight: 700,
              whiteSpace: "nowrap",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            {t.builder.signUpFree}
            <Icon name="arrowRight" size={16} weight="bold" />
          </button>
        )}
      </div>

      <SaveProjectDialog
        isOpen={saveDialogOpen}
        onClose={() => setSaveDialogOpen(false)}
        isDemo={!!isDemo}
        projectName={meta?.name || ""}
        onUpdate={handleUpdate}
        onCreate={handleCreate}
        onSaveAs={handleSaveAs}
      />

      {/* Hidden file input for .nova import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".nova"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />

      {/* Confirm modal when project has unsaved changes */}
      {importConfirmOpen && (
        <UnsavedChangesModal
          onConfirm={() => {
            setImportConfirmOpen(false);
            fileInputRef.current?.click();
          }}
          onClose={() => setImportConfirmOpen(false)}
        />
      )}
    </>
  );
}
