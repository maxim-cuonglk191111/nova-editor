"use client";
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@nanostores/react";
import { $breakpoints, $instances } from "@/lib/data-stores";
import {
  $selectedBreakpointId, $selectedBreakpoint,
  $selectedInstanceId, $selectedInstanceSelector,
  $brandingLogo, $brandingName,
} from "@/lib/nano-states";
import { duplicateInstanceById, deleteInstanceById } from "./commands";
import { BreakpointManager } from "./BreakpointManager";
import { BreakpointPill } from "./BreakpointPills";
import { TopbarActions } from "./TopbarActions";
import { hasUnsavedWork } from "./hooks/useUnsavedChangesGuard";
import { LogoIcon } from "@/components/LogoIcon";
import { useI18n, fmt } from "@/lib/i18n";
import { UI_VARS as C } from "@/lib/uiTheme";


export function Topbar({ isDemo }: { isDemo?: boolean }) {
  const { t } = useI18n();
  const router = useRouter();
  const breakpoints = useStore($breakpoints);
  const activeBreakpoint = useStore($selectedBreakpoint);
  const selectedId = useStore($selectedInstanceId);
  const instances = useStore($instances);
  const brandingLogo = useStore($brandingLogo);
  const brandingName = useStore($brandingName);

  const [bpManagerOpen, setBpManagerOpen] = useState(false);

  const selectedInstance = selectedId ? instances.get(selectedId) : null;
  const isRoot = !selectedInstance || selectedInstance.component === "Body";
  const canDuplicateOrDelete = Boolean(selectedId && !isRoot);
  const compName = selectedInstance?.component ?? "";

  const duplicateTitle = !selectedId
    ? t.builder.noSelectionDuplicateTooltip
    : isRoot
    ? t.builder.cannotDeleteBodyTooltip
    : fmt(t.builder.duplicateTargetTooltip, { name: compName });

  const deleteTitle = !selectedId
    ? t.builder.noSelectionDeleteTooltip
    : isRoot
    ? t.builder.cannotDeleteBodyTooltip
    : fmt(t.builder.deleteTargetTooltip, { name: compName });

  const handleDuplicate = useCallback(() => {
    if (!selectedId || isRoot) return;
    const newRootId = duplicateInstanceById(selectedId);
    if (newRootId) $selectedInstanceSelector.set([newRootId]);
  }, [selectedId, isRoot]);

  const handleDelete = useCallback(() => {
    if (selectedId && !isRoot) deleteInstanceById(selectedId);
  }, [selectedId, isRoot]);

  const sortedBreakpoints = [...breakpoints.values()].sort((a, b) => {
    const aMax = a.maxWidth ?? Infinity;
    const bMax = b.maxWidth ?? Infinity;
    return bMax - aMax;
  });

  return (
    <div style={{ gridArea: "topbar", height: 44, background: C.bg, borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", padding: "0 10px", gap: 6, fontFamily: C.font, flexShrink: 0, zIndex: 150 /* above the floating tool panels (100) so its menus open on top */ }}>
      {/* Left: back + site name */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0, flexShrink: 0 }}>
        <button onClick={() => { if (!hasUnsavedWork() || confirm(t.chrome.leaveUnsaved)) router.push(isDemo ? "/" : "/projects"); }} title={isDemo ? t.builder.backToHome : t.builder.backToMySites} style={{ background: "none", border: "none", cursor: "pointer", color: C.textMuted, fontSize: 16, padding: "2px 5px", lineHeight: 1, borderRadius: 4 }}>←</button>
        <button
          type="button"
          onClick={() => { if (!hasUnsavedWork() || confirm(t.chrome.leaveUnsaved)) router.push(isDemo ? "/" : "/projects"); }}
          title={isDemo ? t.builder.backToHome : t.builder.backToMySites}
          aria-label={isDemo ? t.builder.backToHome : t.builder.backToMySites}
          style={{ background: "none", border: "none", padding: 0, margin: 0, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
        >
          {brandingLogo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={brandingLogo} alt={brandingName || t.tools.logoAlt} style={{ height: 24, objectFit: "contain", flexShrink: 0 }} />
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <LogoIcon width={20} height={20} />
              <span style={{ fontSize: 13, fontWeight: 800, color: "#a78bfa", letterSpacing: "-0.02em", flexShrink: 0 }}>{brandingName || "Nova"}</span>
            </div>
          )}
        </button>
      </div>

      {/* Edit toolbar: labelled duplicate / delete for the selection. The bare
          ⎘ ⧉ ⊕ ⌫ glyphs meant nothing to first-time users (task 007); copy and
          paste stay in the right-click menu and the keyboard shortcuts. */}
      <div style={{ display: "flex", alignItems: "center", gap: 2, flexShrink: 0, marginLeft: 4 }}>
        <button
          onClick={handleDuplicate}
          disabled={!canDuplicateOrDelete}
          title={duplicateTitle}
          aria-label={duplicateTitle}
          style={{
            background: "none",
            border: `1px solid ${!canDuplicateOrDelete ? "transparent" : C.border}`,
            cursor: !canDuplicateOrDelete ? "not-allowed" : "pointer",
            color: !canDuplicateOrDelete ? C.textMuted : C.text,
            opacity: !canDuplicateOrDelete ? 0.35 : 1,
            fontSize: 12,
            padding: "3px 8px",
            borderRadius: 4,
            lineHeight: 1.2,
            fontFamily: C.font,
            transition: "all 0.1s",
            whiteSpace: "nowrap",
          }}
        >
          {`⧉ ${t.commands.duplicate}`}
        </button>
        <button
          onClick={handleDelete}
          disabled={!canDuplicateOrDelete}
          title={deleteTitle}
          aria-label={deleteTitle}
          style={{
            background: "none",
            border: `1px solid ${!canDuplicateOrDelete ? "transparent" : C.border}`,
            cursor: !canDuplicateOrDelete ? "not-allowed" : "pointer",
            color: !canDuplicateOrDelete ? C.textMuted : C.danger,
            opacity: !canDuplicateOrDelete ? 0.35 : 1,
            fontSize: 12,
            padding: "3px 8px",
            borderRadius: 4,
            lineHeight: 1.2,
            fontFamily: C.font,
            transition: "all 0.1s",
            whiteSpace: "nowrap",
          }}
        >
          {`🗑 ${t.commands.delete}`}
        </button>
      </div>

      <div style={{ flex: 1 }} />

      {/* Center: responsive breakpoints + manage ⚙ */}
      <div style={{ display: "flex", alignItems: "center", gap: 3, position: "relative" }}>
        {sortedBreakpoints.map((bp) => (
          <BreakpointPill key={bp.id} bp={bp} active={bp.id === activeBreakpoint?.id} onClick={() => $selectedBreakpointId.set(bp.id)} />
        ))}
        <button onClick={() => setBpManagerOpen((v) => !v)} title={t.builder.manageBreakpoints} style={{ background: bpManagerOpen ? C.accentBg : "none", border: `1px solid ${bpManagerOpen ? C.accentBorder : "transparent"}`, cursor: "pointer", color: bpManagerOpen ? C.accentText : C.textMuted, fontSize: 13, lineHeight: 1, padding: "3px 6px", borderRadius: 4, fontFamily: C.font, transition: "all 0.1s" }}>⚙</button>
        {bpManagerOpen && <BreakpointManager onClose={() => setBpManagerOpen(false)} />}
      </div>

      <div style={{ flex: 1 }} />

      {/* Right: zoom + actions (extracted) */}
      <TopbarActions isDemo={isDemo} />
    </div>
  );
}
