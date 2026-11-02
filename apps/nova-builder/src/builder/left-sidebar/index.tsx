"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { Navigator } from "./navigator";
import { PagesPanel } from "./pages";
import { ComponentsPanel } from "./components";
import { AssetsPanel } from "./assets";
import { StylesPanel } from "./styles";
import { CommentsPanel } from "@/builder/CommentsPanel";
import { ActivityPanel } from "@/builder/ActivityPanel";
import { CustomCSSPanel } from "./custom-css";
import { MarketplacePanel } from "./marketplace";
import { AIChatPanel } from "@/builder/ai-chat/AIChatPanel";
import { SymbolsPanel } from "./symbols";
import { useStore } from "@nanostores/react";
import { $projectMeta } from "@/lib/data-stores";
import { $aiPanelOpen } from "@/lib/nano-states";
import { UI_VARS as C } from "@/lib/uiTheme";
import { useI18n } from "@/lib/i18n";

type TabId = "ai" | "components" | "pages" | "navigator" | "assets" | "styles" | "comments" | "activity" | "css" | "marketplace" | "symbols";

// Tabs a remembered choice may reopen (hidden tabs fall back to the navigator).
const TAB_IDS: TabId[] = ["ai", "components", "pages", "navigator", "assets", "marketplace"];

const TAB_KEY = "nova-sidebar-tab";
const WIDTH_KEY = "nova-sidebar-width";
const MIN_WIDTH = 180;
const MAX_WIDTH = 360;
const DEFAULT_WIDTH = 220;
// A conversation needs more room than a list: the AI tab keeps its own width.
const AI_WIDTH_KEY = "nova-sidebar-width-ai";
const AI_MIN_WIDTH = 300;
const AI_MAX_WIDTH = 560;
const AI_DEFAULT_WIDTH = 380;

function loadTab(): TabId {
  if (typeof localStorage === "undefined") return "navigator";
  const saved = localStorage.getItem(TAB_KEY) as TabId | null;
  if (saved && TAB_IDS.includes(saved)) return saved;
  return "navigator";
}

function loadWidth(): number {
  if (typeof localStorage === "undefined") return DEFAULT_WIDTH;
  const raw = localStorage.getItem(WIDTH_KEY);
  if (raw) {
    const n = parseInt(raw, 10);
    if (!isNaN(n)) return Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, n));
  }
  return DEFAULT_WIDTH;
}

function loadAiWidth(): number {
  if (typeof localStorage === "undefined") return AI_DEFAULT_WIDTH;
  const n = parseInt(localStorage.getItem(AI_WIDTH_KEY) ?? "", 10);
  return isNaN(n) ? AI_DEFAULT_WIDTH : Math.min(AI_MAX_WIDTH, Math.max(AI_MIN_WIDTH, n));
}

type TabItem = { id: TabId; label: string; short: string; icon: string };

const RAIL_WIDTH = 56;

function TabIcon({ tab, isActive, onClick }: { tab: TabItem; isActive: boolean; onClick: () => void }) {
  return (
    <button
      title={tab.label}
      aria-label={tab.label}
      aria-pressed={isActive}
      onClick={onClick}
      style={{
        width: RAIL_WIDTH,
        height: 48,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 2,
        background: isActive ? "rgba(124,58,237,0.08)" : "none",
        border: "none",
        cursor: "pointer",
        color: isActive ? C.tabActive : C.tabInactive,
        borderLeft: isActive ? `2px solid ${C.tabActive}` : "2px solid transparent",
        flexShrink: 0,
        transition: "color 0.15s, background 0.15s",
        padding: 0,
      }}
    >
      <span style={{ fontSize: 15, lineHeight: 1 }}>{tab.icon}</span>
      <span style={{ fontSize: 9, fontFamily: C.font, lineHeight: 1, letterSpacing: "0.03em", textTransform: "uppercase", fontWeight: 600 }}>
        {tab.short}
      </span>
    </button>
  );
}

export function LeftSidebar() {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<TabId | null>(loadTab);
  const [listWidth, setListWidth] = useState(loadWidth);
  const [aiWidth, setAiWidth] = useState(loadAiWidth);
  const meta = useStore($projectMeta);
  const isResizing = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(0);

  const tabs: TabItem[] = [
    { id: "ai", label: t.tools.aiChat.title, short: t.tools.rail.ai, icon: "✦" },
    { id: "components", label: t.builder.components, short: t.tools.rail.components, icon: "⊞" },
    // { id: "symbols",    label: t.builder.symbols,    short: "Sym",    icon: "◆" },
    { id: "pages", label: t.builder.pages, short: t.tools.rail.pages, icon: "☰" },
    { id: "navigator", label: t.builder.navigator, short: t.tools.rail.navigator, icon: "◫" },
    { id: "assets", label: t.builder.assets, short: t.tools.rail.assets, icon: "⊡" },
    // Tier C (task 007): CSS variables and custom CSS work, but are developer
    // tools a first-time user cannot use without help. Hidden; saved values still render.
    // { id: "styles", label: t.builder.cssVars, short: t.tools.rail.styles, icon: "§" },
    // { id: "css", label: t.builder.customCss, short: t.tools.rail.css, icon: "♯" },
    { id: "marketplace", label: t.builder.templates, short: t.tools.rail.marketplace, icon: "◈" },
    // { id: "comments",   label: t.builder.comments,   short: "Chat",   icon: "💬" },
    // { id: "activity",   label: t.builder.activity,   short: "Log",    icon: "◎" },
  ];

  useEffect(() => {
    if (activeTab !== null) localStorage.setItem(TAB_KEY, activeTab);
  }, [activeTab]);

  useEffect(() => {
    localStorage.setItem(WIDTH_KEY, String(listWidth));
  }, [listWidth]);

  useEffect(() => {
    localStorage.setItem(AI_WIDTH_KEY, String(aiWidth));
  }, [aiWidth]);

  // `$aiPanelOpen` means "the AI tab is the open tab": the top-bar AI button, the ⌘⇧A command and
  // the landing-page prompt set it, and the tab follows. Clicking tabs here sets it back.
  useEffect(() => {
    $aiPanelOpen.set(activeTab === "ai");
    return $aiPanelOpen.listen((open) => {
      setActiveTab((prev) => (open ? "ai" : prev === "ai" ? null : prev));
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleTabClick(id: TabId) {
    const next = activeTab === id ? null : id;
    setActiveTab(next);
    $aiPanelOpen.set(next === "ai");
  }

  const isAi = activeTab === "ai";
  const panelWidth = isAi ? aiWidth : listWidth;
  const minWidth = isAi ? AI_MIN_WIDTH : MIN_WIDTH;
  const maxWidth = isAi ? AI_MAX_WIDTH : MAX_WIDTH;
  const setPanelWidth = isAi ? setAiWidth : setListWidth;

  // Resize handle — right edge of sidebar
  const handleResizeMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isResizing.current = true;
    startX.current = e.clientX;
    startWidth.current = panelWidth;
    // Cover the canvas iframe while dragging: over it, mouse events go to the
    // iframe's document and the panel stopped following the pointer.
    const cover = document.createElement("div");
    cover.style.cssText = "position:fixed;inset:0;z-index:99999;cursor:col-resize;";
    document.body.appendChild(cover);

    function onMove(ev: MouseEvent) {
      if (!isResizing.current) return;
      const delta = ev.clientX - startX.current;
      const newWidth = Math.min(maxWidth, Math.max(minWidth, startWidth.current + delta));
      setPanelWidth(newWidth);
    }
    function onUp() {
      isResizing.current = false;
      cover.remove();
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    }
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }, [panelWidth, minWidth, maxWidth, setPanelWidth]);

  const totalWidth = activeTab !== null ? RAIL_WIDTH + panelWidth : RAIL_WIDTH;

  return (
    <div
      style={{
        gridArea: "left",
        display: "flex",
        flexDirection: "row",
        background: C.bg,
        borderRight: `1px solid ${C.border}`,
        overflow: "hidden",
        width: totalWidth,
        minWidth: totalWidth,
        flexShrink: 0,
        position: "relative",
        transition: activeTab !== null ? "none" : "width 0.15s ease",
      }}
    >
      {/* Icon rail */}
      <div
        style={{
          width: RAIL_WIDTH,
          flexShrink: 0,
          background: C.bg,
          borderRight: `1px solid ${C.border}`,
          display: "flex",
          flexDirection: "column",
          paddingTop: 4,
        }}
      >
        {tabs.map((tab) => (
          <TabIcon
            key={tab.id}
            tab={tab}
            isActive={activeTab === tab.id}
            onClick={() => handleTabClick(tab.id)}
          />
        ))}
      </div>

      {/* Panel content */}
      {activeTab !== null && (
        <div
          style={{
            width: panelWidth,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            flexShrink: 0,
          }}
        >
          {activeTab === "ai" && <AIChatPanel />}
          {activeTab === "navigator" && <Navigator />}
          {activeTab === "pages" && <PagesPanel />}
          {activeTab === "components" && <ComponentsPanel />}
          {activeTab === "symbols" && <SymbolsPanel />}
          {activeTab === "assets" && <AssetsPanel />}
          {activeTab === "styles" && <StylesPanel />}
          {activeTab === "css" && <CustomCSSPanel />}
          {activeTab === "marketplace" && <MarketplacePanel />}
          {activeTab === "comments" && meta && <CommentsPanel projectId={meta.id} />}
          {activeTab === "activity" && meta && <ActivityPanel projectId={meta.id} />}
        </div>
      )}

      {/* Resize handle — 4px right edge, only when a tab is open */}
      {activeTab !== null && (
        <div
          onMouseDown={handleResizeMouseDown}
          title={t.chrome.dragToResize}
          style={{
            position: "absolute",
            right: 0,
            top: 0,
            bottom: 0,
            width: 6,
            cursor: "col-resize",
            background: C.border,
            zIndex: 1,
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = C.borderHover)}
          onMouseLeave={(e) => (e.currentTarget.style.background = C.border)}
        />
      )}
    </div>
  );
}
