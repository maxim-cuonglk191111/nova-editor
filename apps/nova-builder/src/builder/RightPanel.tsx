"use client";
import { useState } from "react";
import { useStore } from "@nanostores/react";
import { StyleInspector } from "./StyleInspector";
import { SettingsPanel } from "./SettingsPanel";
import { StyleTokensPanel } from "./StyleTokensPanel";
import { FormSettingsPanel, FORM_COMPONENTS } from "./FormSettingsPanel";
import { InteractionsPanel } from "./InteractionsPanel";
import { PropsEditorPanel } from "./PropsEditorPanel";
import { SEOPanel } from "./SEOPanel";
import { CookieBannerPanel } from "./CookieBannerPanel";
import { DataBindingPanel } from "./DataBindingPanel";
import { CMSPanel } from "./CMSPanel";
import { CssPreviewPanel } from "./CssPreviewPanel";
import { $instances } from "@/lib/data-stores";
import { $selectedInstanceId, $cssPreviewOpen } from "@/lib/nano-states";
import { UI_VARS as C, FONT } from "@/lib/uiTheme";
import { useI18n } from "@/lib/i18n";
import { $inspectorOpen, $inspectorWidth, clampInspectorWidth } from "@/lib/inspectorLayout";
import { Icon } from "./icons";

const HANDLE_IDLE = `linear-gradient(to right, ${C.border} 0, ${C.border} 1px, transparent 1px)`;
const HANDLE_HOT = `linear-gradient(to right, transparent 2px, ${C.accentLight} 2px, ${C.accentLight} 4px, transparent 4px)`;

type Tab = "style" | "settings" | "tokens" | "interact" | "props" | "seo" | "cookie" | "data" | "cms" | "css-preview";

export function RightPanel() {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<Tab>("style");
  const cssPreviewOpen = useStore($cssPreviewOpen);
  const instanceId = useStore($selectedInstanceId);
  const instances = useStore($instances);
  const instance = instanceId ? instances.get(instanceId) : undefined;
  const isFormComponent = instance ? FORM_COMPONENTS.has(instance.component) : false;

  // 3-column grid keeps all 9 labels readable at 280 px (WS-PARITY-AUDIT §8b V-1)
  const TAB_LABELS: { id: Tab; label: string }[] = [
    { id: "style", label: t.builder.style },
    { id: "props", label: t.builder.props },
    { id: "settings", label: t.builder.settings },
    // { id: "tokens",   label: t.builder.tokens },
    // { id: "interact", label: t.builder.interact },
    // { id: "data",     label: t.builder.data },
    // { id: "cms",      label: t.builder.cms },
    // { id: "seo",      label: t.builder.seo },
    // { id: "cookie",   label: t.builder.cookie },
    ...(cssPreviewOpen ? [{ id: "css-preview" as Tab, label: t.builder.cssPreview }] : []),
  ];

  const open = useStore($inspectorOpen);
  const width = useStore($inspectorWidth);

  // Dragging the left edge changes the width; a cover keeps the canvas iframe from swallowing the pointer.
  function startResize(e: React.MouseEvent) {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = width;
    const cover = document.createElement("div");
    cover.style.cssText = "position:fixed;inset:0;z-index:99999;cursor:col-resize;";
    document.body.appendChild(cover);
    const onMove = (ev: MouseEvent) => $inspectorWidth.set(clampInspectorWidth(startWidth + (startX - ev.clientX)));
    const onUp = () => {
      cover.remove();
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }

  if (!open) return null;

  return (
    <div
      style={{
        gridArea: "right",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        background: C.card,
        borderLeft: `1px solid ${C.border}`,
        overflow: "hidden",
      }}
    >
      {/* Tab header — 3-column grid so all 9 labels stay readable at 280px (V-1) */}
      <div style={{ display: "flex", alignItems: "stretch", borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
      <div
        role="tablist"
        style={{
          flex: 1,
          minWidth: 0,
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
        }}
      >
        {TAB_LABELS.map(({ id, label }) => (
          <button
            key={id}
            role="tab"
            aria-selected={activeTab === id}
            onClick={() => setActiveTab(id)}
            style={{
              padding: "8px 2px",
              minHeight: 44,
              background: activeTab === id ? C.accentBg : "none",
              border: "none",
              borderBottom: activeTab === id
                ? `2px solid ${C.accent}`
                : "2px solid transparent",
              cursor: "pointer",
              fontSize: 14,
              fontFamily: C.font,
              fontWeight: 600,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              color: activeTab === id ? C.text : C.textMuted,
              transition: "color 0.15s",
            }}
          >
            {label}
          </button>
        ))}
      </div>
        <button
          type="button"
          onClick={() => $inspectorOpen.set(false)}
          title={t.chrome.toggleInspector}
          aria-label={t.chrome.toggleInspector}
          style={{ width: 44, flexShrink: 0, border: "none", borderLeft: `1px solid ${C.border}`, background: "transparent", color: C.textMuted, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
        >
          <Icon name="caretRight" size={16} weight="bold" />
        </button>
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, overflow: "hidden" }}>
        {activeTab === "style" && <StyleInspector />}
        {activeTab === "props" && <PropsEditorPanel />}
        {activeTab === "settings" && (isFormComponent ? <FormSettingsPanel /> : <SettingsPanel />)}
        {activeTab === "tokens" && <StyleTokensPanel />}
        {activeTab === "interact" && <InteractionsPanel />}
        {activeTab === "data" && <DataBindingPanel />}
        {activeTab === "cms" && <CMSPanel />}
        {activeTab === "seo" && <SEOPanel />}
        {activeTab === "cookie" && <CookieBannerPanel />}
        {activeTab === "css-preview" && <CssPreviewPanel />}
      </div>
      <div
        onMouseDown={startResize}
        title={t.chrome.dragToResize}
        style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 8, cursor: "col-resize", zIndex: 2, background: HANDLE_IDLE }}
        onMouseEnter={(e) => (e.currentTarget.style.background = HANDLE_HOT)}
        onMouseLeave={(e) => (e.currentTarget.style.background = HANDLE_IDLE)}
      />
    </div>
  );
}
