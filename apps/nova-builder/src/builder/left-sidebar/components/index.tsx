import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useStore } from "@nanostores/react";
import { useDraggable, type DropTarget } from "./useDraggable";
import { getRegistry } from "./ComponentRegistry";
import { insertComponent } from "./insertComponent";
import { ComponentCard } from "./ComponentCard";
import { CategoryList, CATEGORY_GROUPS } from "./CategoryList";
import { $addCategory, $addFlyoutOpen, FLYOUT_WIDTH } from "../sidebarTab";
import { PanelHeader } from "../PanelHeader";
import { useI18n } from "@/lib/i18n";
import { componentName } from "@/lib/i18n/componentName";
import { UI_VARS as C, UI_SHAPE as S } from "@/lib/uiTheme";

// Wide screens open the first category at once, as the reference does; narrow ones start closed so
// the canvas keeps its room (the second column pushes the canvas, it does not cover it).
const WIDE = 1280;

export function ComponentsPanel() {
  const { t } = useI18n();
  const L = t.sidebar.components;
  const nameOf = (item: { id: string; displayName: string }) => componentName(item.id, t.componentNames, item.displayName);
  const [searchQuery, setSearchQuery] = useState("");
  const category = useStore($addCategory);

  useEffect(() => {
    if ($addCategory.get() === undefined) $addCategory.set(window.innerWidth >= WIDE ? CATEGORY_GROUPS[0]!.categories[0]! : null);
  }, []);

  const searching = searchQuery.trim() !== "";
  const flyoutOpen = (category ?? null) !== null || searching;
  useEffect(() => {
    $addFlyoutOpen.set(flyoutOpen);
    return () => $addFlyoutOpen.set(false);
  }, [flyoutOpen]);

  // The card holds pointer capture during a drag, so releasing it fires a click on
  // the card too; that click must not insert a second copy.
  const lastDropAt = useRef(0);
  const dropInsert = useCallback((name: string, target: DropTarget) => {
    lastDropAt.current = Date.now();
    insertComponent(name, target);
  }, []);
  const clickInsert = (name: string) => {
    if (Date.now() - lastDropAt.current > 500) insertComponent(name);
  };
  const { isDragging, ghostPos, draggedComponent, startDrag } = useDraggable(dropInsert);

  const handleMouseDown = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    if (e.button !== 0) return;
    startDrag(id, e.clientX, e.clientY);
  };

  // Search matches names, descriptions, categories, keywords and tags.
  const matches = useMemo(() => {
    const all = getRegistry();
    const q = searchQuery.trim().toLowerCase();
    if (!q) return all;
    return all.filter(
      (item) =>
        item.displayName.toLowerCase().includes(q) ||
        nameOf(item).toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        (L.descriptions[item.id] ?? "").toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.keywords.some((kw) => kw.toLowerCase().includes(q)) ||
        (item.tags && item.tags.some((tag) => tag.toLowerCase().includes(q)))
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps -- nameOf only reads t
  }, [searchQuery, t]);

  const counts = useMemo(() => {
    const out: Record<string, number> = {};
    for (const item of matches) out[item.category] = (out[item.category] ?? 0) + 1;
    return out;
  }, [matches]);

  // While searching, every match is listed whatever category is chosen; the category rows only show the match counts.
  const shown = useMemo(() => (!searching && category ? matches.filter((i) => i.category === category) : matches), [matches, category, searching]);
  const title = !searching && category ? L.categories[category] ?? category : L.results;

  const select = (c: string) => { setSearchQuery(""); $addCategory.set(category === c && !searching ? null : c); };
  const closeFlyout = () => { $addCategory.set(null); setSearchQuery(""); };

  return (
    <div className="select-none" style={{ display: "flex", height: "100%", background: C.bg, fontFamily: C.font }} onKeyDown={(e) => { if (e.key === "Escape" && flyoutOpen) closeFlyout(); }}>
      {/* First column: search and the category rows */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", borderRight: flyoutOpen ? `1px solid ${C.border}` : "none" }}>
        <PanelHeader title={L.title} />
        <div style={{ padding: "14px 14px 0", display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ position: "relative" }}>
            <span aria-hidden="true" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: C.textMuted, pointerEvents: "none" }}>⌕</span>
            <input
              type="text"
              placeholder={L.search}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: "100%", boxSizing: "border-box", height: S.controlLg - 4, padding: "0 34px 0 32px", background: C.card, border: `1px solid ${C.border}`, borderRadius: S.radiusMd, fontSize: 14, fontFamily: C.font, color: C.text, outline: "none" }}
            />
            {searching && (
              <button type="button" onClick={() => setSearchQuery("")} aria-label={L.clearSearch} style={{ position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)", width: 28, height: 28, border: "none", background: "none", color: C.textMuted, cursor: "pointer", fontSize: 13 }}>✕</button>
            )}
          </div>
          <p style={{ margin: 0, fontSize: 12, lineHeight: 1.45, color: C.textMuted }}>{L.hint}</p>
        </div>
        <div className="custom-scrollbar" style={{ flex: 1, overflowY: "auto", padding: "14px 14px 20px" }}>
          {matches.length === 0 ? (
            <div style={{ fontSize: 14, color: C.textMuted, padding: "12px 4px" }}>{L.noResults}</div>
          ) : (
            <CategoryList counts={counts} selected={searching ? null : category ?? null} names={L.categories} groupNames={L.groups} onSelect={select} />
          )}
        </div>
      </div>

      {/* Second column: the thumbnails of the chosen category (or of the search results) */}
      {flyoutOpen && (
        <div data-testid="add-flyout" style={{ width: FLYOUT_WIDTH, flexShrink: 0, display: "flex", flexDirection: "column", background: C.surface, opacity: isDragging ? 0.35 : 1, transition: "opacity 0.1s" }}>
          <PanelHeader title={title}>
            <button type="button" onClick={closeFlyout} aria-label={L.close} style={{ width: 32, height: 32, border: "none", borderRadius: S.radiusSm, background: "transparent", color: C.textMuted, cursor: "pointer", fontSize: 14 }}>✕</button>
          </PanelHeader>
          <div className="custom-scrollbar" style={{ flex: 1, overflowY: "auto", padding: 14, display: "flex", flexDirection: "column", gap: 12 }}>
            {shown.length === 0 && <div style={{ fontSize: 14, color: C.textMuted }}>{L.noResults}</div>}
            {shown.map((item) => (
              <ComponentCard
                key={item.id}
                id={item.id}
                name={nameOf(item)}
                description={L.descriptions[item.id] ?? item.description}
                preview={item.preview()}
                onClick={clickInsert}
                onMouseDown={handleMouseDown}
              />
            ))}
          </div>
        </div>
      )}

      {/* Floating Drag Ghost Preview */}
      {isDragging && draggedComponent && (
        <>
          <style>{`
            @keyframes nova-pickup {
              0% { transform: scale(0.9) rotate(-2deg); }
              100% { transform: scale(1) rotate(-1deg); }
            }
          `}</style>
          <div
            className="fixed pointer-events-none z-50 bg-primary/20 border border-primary text-primary px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-lg backdrop-blur-sm"
            style={{ left: ghostPos.x + 10, top: ghostPos.y + 10, animation: "nova-pickup 0.15s ease-out forwards", transform: "rotate(-1deg)" }}
          >
            <span>➕</span>
            <span>{componentName(draggedComponent, t.componentNames)}</span>
          </div>
        </>
      )}
    </div>
  );
}
