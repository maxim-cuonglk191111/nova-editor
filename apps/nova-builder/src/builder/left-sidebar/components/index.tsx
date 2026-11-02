import React, { useState, useMemo, useEffect, useLayoutEffect, useRef, useCallback } from "react";
import { useDraggable, type DropTarget } from "./useDraggable";
import { getRegistry } from "./ComponentRegistry";
import { insertComponent } from "./insertComponent";
import { ComponentCard } from "./ComponentCard";
import { CategoryList } from "./CategoryList";
import { PanelHeader } from "../PanelHeader";
import { Icon } from "@/builder/icons";
import { useI18n } from "@/lib/i18n";
import { componentName } from "@/lib/i18n/componentName";
import { UI_VARS as C, UI_SHAPE as S } from "@/lib/uiTheme";

const FLYOUT_WIDTH = 304;

type Anchor = { left: number; top: number; height: number };

export function ComponentsPanel() {
  const { t } = useI18n();
  const L = t.sidebar.components;
  const nameOf = (item: { id: string; displayName: string }) => componentName(item.id, t.componentNames, item.displayName);
  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);

  const searching = searchQuery.trim() !== "";
  const flyoutOpen = category !== null || searching;

  // The thumbnails float over the canvas, anchored to the right edge of this panel: opening them never
  // changes the size of the canvas.
  const rootRef = useRef<HTMLDivElement>(null);
  const flyoutRef = useRef<HTMLDivElement>(null);
  const [anchor, setAnchor] = useState<Anchor | null>(null);
  useLayoutEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const measure = () => {
      const r = el.getBoundingClientRect();
      setAnchor({ left: r.right, top: r.top, height: r.height });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    window.addEventListener("resize", measure);
    return () => { observer.disconnect(); window.removeEventListener("resize", measure); };
  }, []);

  const closeFlyout = useCallback(() => { setCategory(null); setSearchQuery(""); }, []);

  // A click anywhere else (the canvas, the inspector) puts the thumbnails away.
  useEffect(() => {
    if (!flyoutOpen) return;
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (rootRef.current?.contains(target) || flyoutRef.current?.contains(target)) return;
      closeFlyout();
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [flyoutOpen, closeFlyout]);

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

  const select = (c: string) => { setSearchQuery(""); setCategory(category === c && !searching ? null : c); };

  return (
    <div ref={rootRef} className="select-none" style={{ display: "flex", flexDirection: "column", height: "100%", background: C.bg, fontFamily: C.font }} onKeyDown={(e) => { if (e.key === "Escape" && flyoutOpen) closeFlyout(); }}>
      <PanelHeader title={L.title} />
      <div style={{ padding: "14px 14px 0", display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ position: "relative" }}>
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: C.textMuted, pointerEvents: "none", display: "inline-flex" }}><Icon name="search" size={18} /></span>
          <input
            type="text"
            placeholder={L.search}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: "100%", boxSizing: "border-box", height: S.controlLg - 4, padding: "0 34px 0 38px", background: C.card, border: `1px solid ${C.border}`, borderRadius: S.radiusMd, fontSize: 14, fontFamily: C.font, color: C.text, outline: "none" }}
          />
          {searching && (
            <button type="button" onClick={() => setSearchQuery("")} aria-label={L.clearSearch} style={{ position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)", width: 28, height: 28, border: "none", background: "none", color: C.textMuted, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" }}><Icon name="close" size={14} weight="bold" /></button>
          )}
        </div>
        <p style={{ margin: 0, fontSize: 12, lineHeight: 1.45, color: C.textMuted }}>{L.hint}</p>
      </div>
      <div className="custom-scrollbar" style={{ flex: 1, overflowY: "auto", padding: "14px 14px 20px" }}>
        {matches.length === 0 ? (
          <div style={{ fontSize: 14, color: C.textMuted, padding: "12px 4px" }}>{L.noResults}</div>
        ) : (
          <CategoryList counts={counts} selected={searching ? null : category} names={L.categories} groupNames={L.groups} onSelect={select} />
        )}
      </div>

      {/* The thumbnails of the chosen category (or of the search results), floating over the canvas */}
      {flyoutOpen && anchor && (
        <div
          ref={flyoutRef}
          data-testid="add-flyout"
          style={{ position: "fixed", left: anchor.left, top: anchor.top, height: anchor.height, width: FLYOUT_WIDTH, zIndex: 90, display: "flex", flexDirection: "column", background: C.surface, borderRight: `1px solid ${C.border}`, boxShadow: C.shadowPop, opacity: isDragging ? 0.35 : 1, transition: "opacity 0.1s" }}
        >
          <PanelHeader title={title}>
            <button type="button" onClick={closeFlyout} aria-label={L.close} style={{ width: 32, height: 32, border: "none", borderRadius: S.radiusSm, background: "transparent", color: C.textMuted, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" }}><Icon name="close" size={16} weight="bold" /></button>
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
            <Icon name="plus" size={14} weight="bold" />
            <span>{componentName(draggedComponent, t.componentNames)}</span>
          </div>
        </>
      )}
    </div>
  );
}
