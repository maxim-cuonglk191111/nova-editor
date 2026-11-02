"use client";
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@nanostores/react";
import { $breakpoints, $instances, $projectMeta } from "@/lib/data-stores";
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
import { UI_VARS as C, UI_SHAPE as S } from "@/lib/uiTheme";
import { ModeSwitch } from "./topbar/ModeSwitch";
import { Icon } from "./icons";


export function Topbar({ isDemo }: { isDemo?: boolean }) {
  const { t } = useI18n();
  const router = useRouter();
  const breakpoints = useStore($breakpoints);
  const activeBreakpoint = useStore($selectedBreakpoint);
  const selectedId = useStore($selectedInstanceId);
  const instances = useStore($instances);
  const brandingLogo = useStore($brandingLogo);
  const brandingName = useStore($brandingName);
  const projectMeta = useStore($projectMeta);

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
    <div style={{ gridArea: "topbar", height: S.topbar, background: C.card, borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", padding: "0 14px", gap: 10, fontFamily: C.font, flexShrink: 0, zIndex: 150 /* above the floating tool panels (100) so its menus open on top */ }}>
      {/* Left: back + site name */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0, flexShrink: 0 }}>
        <button onClick={() => { if (!hasUnsavedWork() || confirm(t.chrome.leaveUnsaved)) router.push(isDemo ? "/" : "/projects"); }} title={isDemo ? t.builder.backToHome : t.builder.backToMySites} style={{ background: "none", border: "none", cursor: "pointer", color: C.textMuted, width: 36, height: 36, borderRadius: S.radiusSm, display: "inline-flex", alignItems: "center", justifyContent: "center" }}><Icon name="back" size={20} /></button>
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
              <LogoIcon width={24} height={24} />
              <span className="nb-hide-mid" style={{ fontSize: 15, fontWeight: 800, color: C.accentText, letterSpacing: "-0.02em", flexShrink: 0 }}>{brandingName || "Nova"}</span>
            </div>
          )}
        </button>
        {projectMeta?.name && (
          <span className="nb-hide-mid" title={projectMeta.name} style={{ marginLeft: 6, paddingLeft: 12, borderLeft: `1px solid ${C.border}`, fontSize: 14, fontWeight: 600, color: C.text, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {projectMeta.name}
          </span>
        )}
      </div>

      {/* Edit toolbar: labelled duplicate / delete for the selection. The bare
          ⎘ ⧉ ⊕ ⌫ glyphs meant nothing to first-time users (task 007); copy and
          paste stay in the right-click menu and the keyboard shortcuts. */}
      <div className="nb-hide-narrow" style={{ display: "flex", alignItems: "center", gap: 2, flexShrink: 0, marginLeft: 4 }}>
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
            fontSize: 13,
            height: S.control,
            padding: "0 10px",
            borderRadius: S.radiusSm + 2,
            fontFamily: C.font,
            transition: "all 0.1s",
            whiteSpace: "nowrap",
          }}
        >
          <Icon name="copy" size={18} /><span className="nb-hide-mid">{` ${t.commands.duplicate}`}</span>
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
            fontSize: 13,
            height: S.control,
            padding: "0 10px",
            borderRadius: S.radiusSm + 2,
            fontFamily: C.font,
            transition: "all 0.1s",
            whiteSpace: "nowrap",
          }}
        >
          <Icon name="trash" size={18} /><span className="nb-hide-mid">{` ${t.commands.delete}`}</span>
        </button>
      </div>

      <div style={{ flex: 1 }} />

      {/* Center: the work-mode switch, then the screen sizes as one pill group + manage ⚙ */}
      <ModeSwitch isDemo={isDemo} />
      <div style={{ display: "flex", alignItems: "center", gap: 2, position: "relative", padding: 4, background: C.surface, border: `1px solid ${C.border}`, borderRadius: S.radiusMd + 2 }}>
        {sortedBreakpoints.map((bp) => (
          <BreakpointPill key={bp.id} bp={bp} active={bp.id === activeBreakpoint?.id} onClick={() => $selectedBreakpointId.set(bp.id)} />
        ))}
        <button onClick={() => setBpManagerOpen((v) => !v)} title={t.builder.manageBreakpoints} style={{ background: bpManagerOpen ? C.accentBg : "none", border: "none", cursor: "pointer", color: bpManagerOpen ? C.accentText : C.textMuted, display: "inline-flex", alignItems: "center", justifyContent: "center", width: S.control - 4, height: S.control - 4, borderRadius: S.radiusSm + 2, fontFamily: C.font, transition: "all 0.1s" }}><Icon name="settings" size={18} /></button>
        {bpManagerOpen && <BreakpointManager onClose={() => setBpManagerOpen(false)} />}
      </div>

      <div style={{ flex: 1 }} />

      {/* Right: zoom + actions (extracted) */}
      <TopbarActions isDemo={isDemo} />
    </div>
  );
}
