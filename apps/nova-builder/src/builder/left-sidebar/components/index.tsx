import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useDraggable, type DropTarget } from "./useDraggable";
import { getRegistry } from "./ComponentRegistry";
import { insertComponent } from "./insertComponent";
import { useI18n } from "@/lib/i18n";
import { componentName } from "@/lib/i18n/componentName";

// ── Lazy Render Component Preview ───────────────────────────────────────────
function LazyComponentPreview({ children }: { children: React.ReactNode }) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "100px" }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="w-full flex items-center justify-center min-h-[50px]">
      {isVisible ? children : (
        <div className="flex flex-col items-center justify-center gap-2 w-full py-4">
          <div className="w-6 h-6 rounded-full border-2 border-border border-t-primary animate-spin" />
        </div>
      )}
    </div>
  );
}

// ── Constraint & Scaling Visual Component Preview ────────────────────────────
function ComponentPreview({ id, children }: { id: string; children: React.ReactNode }) {
  // Identify large components that need to scale down to fit the preview card
  const isLarge = [
    "shadcn:Sidebar",
    "shadcn:Table",
    "shadcn:DataTable",
    "shadcn:Dialog",
    "shadcn:AlertDialog",
    "shadcn:Drawer",
    "shadcn:Sheet",
    "shadcn:Carousel",
    "shadcn:Command",
    "shadcn:Row",
    "shadcn:Row2Cols",
    "shadcn:Row3Cols",
    "shadcn:Row4Cols",
    "shadcn:Calendar"
  ].includes(id);

  const scaleClass = isLarge ? "scale-[0.62]" : "scale-[0.88]";

  return (
    <div className="w-full h-[120px] flex items-center justify-center relative overflow-hidden bg-muted/20 border-b border-border/40 p-4 select-none pointer-events-none">
      {/* Light dot grid background for the playground visual look */}
      <div className="absolute inset-0 opacity-[0.05] dark:opacity-[0.08] bg-[radial-gradient(ellipse_at_center,_var(--ui-text)_1px,_transparent_1px)] bg-[size:10px_10px]" />
      
      <div className={`transform ${scaleClass} origin-center max-w-full max-h-full flex items-center justify-center transition-all duration-300`}>
        <LazyComponentPreview>
          {children}
        </LazyComponentPreview>
      </div>
    </div>
  );
}

// ── Custom Collapsible Chevron Icon ─────────────────────────────────────────
function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2.5}
      stroke="currentColor"
      className={`w-3 h-3 text-muted-foreground transition-transform duration-200 ${expanded ? "transform rotate-90" : ""}`}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
    </svg>
  );
}

export function ComponentsPanel() {
  const { t } = useI18n();
  const L = t.sidebar.components;
  const nameOf = (item: { id: string; displayName: string }) => componentName(item.id, t.componentNames, item.displayName);
  const [searchQuery, setSearchQuery] = useState("");
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  // Draggable hook integration
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

  const handleMouseDown = (e: React.MouseEvent, componentName: string) => {
    e.preventDefault();
    if (e.button !== 0) return;
    startDrag(componentName, e.clientX, e.clientY);
  };

  // Filter components registry supporting tags, categories, keywords, aliases
  const filteredRegistry = useMemo(() => {
    const registryList = getRegistry();
    if (!searchQuery) return registryList;
    const q = searchQuery.toLowerCase();
    return registryList.filter(
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

  // Group components by shadcn design system categories
  const categoriesMap = useMemo(() => {
    // Page-building basics first (sections, text, images), then forms and widgets.
    const map: Record<string, ReturnType<typeof getRegistry>> = {
      Layout: [],
      Typography: [],
      Display: [],
      Inputs: [],
      Navigation: [],
      Feedback: [],
      Overlay: [],
      Advanced: [],
    };

    filteredRegistry.forEach((item) => {
      if (map[item.category]) {
        map[item.category].push(item);
      } else {
        map[item.category] = [item];
      }
    });

    return map;
  }, [filteredRegistry]);

  const toggleCategory = (cat: string) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [cat]: !prev[cat],
    }));
  };

  return (
    <div className="flex flex-col h-full bg-background border-r border-border select-none relative overflow-hidden font-sans">
      {/* Header & Search (V0.dev / Figma assets style) */}
      <div className="p-4 flex flex-col gap-2.5 border-b border-border bg-background/60 backdrop-blur-md z-10">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{L.title}</span>
        </div>
        <div className="relative flex items-center">
          <span className="absolute left-3 text-xs text-muted-foreground/70 pointer-events-none">🔍</span>
          <input
            type="text"
            placeholder={L.search}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-10 py-1.5 bg-muted/40 hover:bg-muted/70 focus:bg-background border border-border/80 focus:border-primary/60 rounded-md text-xs text-foreground placeholder:text-muted-foreground/60 transition-all outline-none"
          />
          {searchQuery ? (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 text-[10px] text-muted-foreground hover:text-foreground font-bold"
            >
              ✕
            </button>
          ) : null}
        </div>
        <p className="text-[11px] leading-snug text-muted-foreground">{L.hint}</p>
      </div>

      {/* Component Explorer List */}
      <div className="flex-1 p-4 flex flex-col gap-4.5 overflow-y-auto custom-scrollbar">
        {Object.entries(categoriesMap).map(([category, items]) => {
          if (items.length === 0) return null;
          const isCollapsed = !!collapsedCategories[category];

          return (
            <div key={category} className="flex flex-col gap-2">
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(category)}
                className="flex items-center justify-between w-full py-1 text-left hover:opacity-85 transition-opacity"
              >
                <div className="flex items-center gap-2">
                  <ChevronIcon expanded={!isCollapsed} />
                  <span className="text-xs font-semibold text-foreground/80 tracking-wide">{L.categories[category] ?? category}</span>
                </div>
                <span className="text-[9px] text-muted-foreground bg-muted/60 border border-border/50 px-1.5 py-0.5 rounded-full font-semibold">
                  {items.length}
                </span>
              </button>

              {/* Grid of Preview Cards */}
              {!isCollapsed && (
                <div className="grid grid-cols-1 gap-3.5 mt-1.5">
                  {items.map((item) => {
                    return (
                      <div
                        key={item.id}
                        role="button"
                        aria-label={nameOf(item)}
                        className="group relative rounded-xl border transition-all duration-300 cursor-pointer overflow-hidden flex flex-col bg-card select-none border-border hover:shadow-md hover:border-primary/50 hover:scale-[1.02] transform active:scale-[0.98]"
                        onClick={() => clickInsert(item.id)}
                        onMouseDown={(e) => handleMouseDown(e, item.id)}
                      >
                        {/* Scaled visual preview element */}
                        <ComponentPreview id={item.id}>
                          {item.preview()}
                        </ComponentPreview>

                        {/* Metadata Details */}
                        <div className="p-3.5 flex flex-col gap-0.5 bg-card/60 border-t border-border/10">
                          <div className="text-xs font-semibold flex items-center gap-1.5 text-foreground leading-none">
                            {nameOf(item)}
                          </div>
                          <p className="text-[10px] text-muted-foreground line-clamp-1 mt-1 leading-normal font-medium">
                            {L.descriptions[item.id] ?? item.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

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
            style={{
              left: ghostPos.x + 10,
              top: ghostPos.y + 10,
              animation: "nova-pickup 0.15s ease-out forwards",
              transform: "rotate(-1deg)"
            }}
          >
            <span>➕</span>
            <span>{componentName(draggedComponent, t.componentNames)}</span>
          </div>
        </>
      )}
    </div>
  );
}
