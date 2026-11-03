"use client";
import { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { Icon, type IconName } from "./icons";
import { useStore } from "@nanostores/react";
import { $commandPaletteOpen, $selectedPageId } from "@/lib/nano-states";
import { $pages } from "@/lib/data-stores";
import { getCommands, hotkeyHint } from "./commands";
import { getRegistry } from "./left-sidebar/components/ComponentRegistry";
import { insertComponent } from "./left-sidebar/components/insertComponent";
import { useI18n, fmt } from "@/lib/i18n";
import { componentName } from "@/lib/i18n/componentName";
import { UI_VARS as C } from "@/lib/uiTheme";


type Group = "Pages" | "Components" | "Actions";

type CommandItem = {
  id: string;
  label: string;
  group: Group;
  shortcut?: string;
  keywords: string[];
  action: () => void;
};

const GROUP_ICON: Record<"Pages" | "Components" | "Actions", IconName> = { Pages: "pages", Components: "add", Actions: "catAdvanced" };

// ── Shared action helpers (read atoms at call-time, not at render) ────────────

function closePalette() {
  $commandPaletteOpen.set(false);
}

// Same insertion as the Add panel: below the selection, on the open page, undoable.
function insertComponentCmd(componentId: string) {
  insertComponent(componentId);
  closePalette();
}

// ── Component: CommandPalette ─────────────────────────────────────────────────

export function CommandPalette() {
  const { t } = useI18n();
  const isOpen = useStore($commandPaletteOpen);
  const pages = useStore($pages);

  const [query, setQuery] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setActiveIdx(0);
      // Defer focus so the DOM is ready
      const t = setTimeout(() => inputRef.current?.focus(), 10);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  // Scroll active item into view when activeIdx changes
  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "nearest" });
  }, [activeIdx]);

  const allItems = useMemo<CommandItem[]>(() => {
    const items: CommandItem[] = [];

    // Pages group
    if (pages) {
      for (const page of pages.pages.values()) {
        items.push({
          id: `page:${page.id}`,
          label: page.name,
          group: "Pages",
          keywords: [page.path ?? "", "page", "go", "navigate", "open"],
          action: () => { $selectedPageId.set(page.id); closePalette(); },
        });
      }
    }

    // Components group — the Add panel's library (internal components are not insertable).
    for (const entry of getRegistry()) {
      const label = componentName(entry.id, t.componentNames, entry.displayName);
      items.push({
        id: `component:${entry.id}`,
        label: `${t.commands.insertPrefix} ${label}`,
        group: "Components",
        keywords: [label, entry.displayName, ...entry.keywords, "insert", "add", "component", entry.category],
        action: () => insertComponentCmd(entry.id),
      });
    }

    // Actions group — sourced from the command registry (one definition
    // shared with keyboard shortcuts, M1); labels from the i18n dictionary.
    for (const command of getCommands()) {
      if (command.hiddenInPalette) continue;
      items.push({
        id: `action:${command.name}`,
        label: t.commands[command.labelKey],
        group: "Actions",
        shortcut: hotkeyHint(command),
        keywords: [command.name, command.labelKey],
        action: () => {
          command.run();
          closePalette();
        },
      });
    }

    return items;
  }, [pages, t]);

  // Filter by query
  const filtered = useMemo<CommandItem[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allItems;
    return allItems.filter((item) => {
      const haystack = [item.label, ...item.keywords].join(" ").toLowerCase();
      return q.split(/\s+/).every((word) => haystack.includes(word));
    });
  }, [allItems, query]);

  // Group the filtered results preserving group order
  const groupOrder: Group[] = ["Pages", "Components", "Actions"];
  const groupLabels: Record<Group, string> = {
    Pages: t.chrome.palette.groupPages,
    Components: t.chrome.palette.groupComponents,
    Actions: t.chrome.palette.groupActions,
  };
  const grouped = useMemo(() => {
    const map = new Map<Group, CommandItem[]>(groupOrder.map((g) => [g, []]));
    for (const item of filtered) {
      map.get(item.group)!.push(item);
    }
    return map;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered]);

  // Flat index → item (for keyboard nav)
  const flatItems = useMemo(
    () => groupOrder.flatMap((g) => grouped.get(g) ?? []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [grouped]
  );

  // Clamp activeIdx when filtered list changes
  useEffect(() => {
    setActiveIdx((idx) => Math.min(idx, Math.max(0, flatItems.length - 1)));
  }, [flatItems.length]);

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") { closePalette(); return; }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, flatItems.length - 1));
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    }
    if (e.key === "Enter") {
      e.preventDefault();
      flatItems[activeIdx]?.action();
    }
  }

  if (!isOpen || typeof document === "undefined") return null;

  let flatCounter = 0;

  return createPortal(
    <div
      style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: 96, background: "rgba(17,17,17,0.42)", backdropFilter: "blur(3px)" }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) closePalette(); }}
    >
      <div style={{ width: 600, maxWidth: "90vw", background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, boxShadow: "var(--ui-shadow-pop, 0 24px 64px rgba(0,0,0,0.6))", overflow: "hidden", display: "flex", flexDirection: "column" }}>

        {/* Search input */}
        <div style={{ padding: "0 18px", minHeight: 60, display: "flex", alignItems: "center", gap: 12, borderBottom: `1px solid ${C.border}` }}>
          <span style={{ display: "inline-flex", color: C.textMuted }}><Icon name="search" size={20} /></span>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setActiveIdx(0); }}
            onKeyDown={onKeyDown}
            placeholder={t.chrome.palette.search}
            style={{ width: "100%", background: "none", border: "none", outline: "none", color: C.text, fontSize: 17, fontFamily: C.font, caretColor: "var(--ui-accent)" }}
          />
        </div>

        {/* Results */}
        <div style={{ maxHeight: 400, overflowY: "auto", padding: "6px 8px 8px" }}>
          {flatItems.length === 0 && (
            <div style={{ padding: "20px 14px", color: C.textMuted, fontSize: 13, fontFamily: C.font }}>
              {fmt(t.chrome.palette.noResults, { query })}
            </div>
          )}

          {groupOrder.map((group) => {
            const groupItems = grouped.get(group) ?? [];
            if (groupItems.length === 0) return null;

            return (
              <div key={group}>
                {/* Group heading */}
                <div style={{ padding: "12px 10px 6px", fontSize: 13, fontFamily: C.font, color: C.textMuted, fontWeight: 600 }}>
                  {groupLabels[group]}
                </div>

                {groupItems.map((item) => {
                  const itemIdx = flatCounter++;
                  const isActive = itemIdx === activeIdx;
                  return (
                    <button
                      key={item.id}
                      ref={isActive ? activeRef : undefined}
                      onClick={item.action}
                      onMouseEnter={() => setActiveIdx(itemIdx)}
                      style={{
                        display: "flex",
                        width: "100%",
                        alignItems: "center",
                        minHeight: 44,
                        padding: "0 10px",
                        background: isActive ? C.active : "none",
                        border: "none",
                        borderRadius: 12,
                        cursor: "pointer",
                        textAlign: "left",
                        gap: 12,
                      }}
                    >
                      <span style={{ width: 30, height: 30, borderRadius: 9, flexShrink: 0, display: "inline-flex", alignItems: "center", justifyContent: "center", background: isActive ? C.card : C.surface, color: isActive ? C.activeText : C.textMuted }}>
                        <Icon name={GROUP_ICON[group]} size={17} weight={isActive ? "fill" : "regular"} />
                      </span>
                      <span style={{ flex: 1, fontSize: 15, fontFamily: C.font, color: isActive ? C.activeText : C.text, fontWeight: isActive ? 600 : 400 }}>
                        {item.label}
                      </span>
                      {item.shortcut && (
                        <kbd style={{ fontSize: 12, fontFamily: C.font, color: C.textMuted, background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, padding: "2px 8px", flexShrink: 0 }}>
                          {item.shortcut}
                        </kbd>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Footer hint */}
        <div style={{ padding: "10px 18px", borderTop: `1px solid ${C.border}`, display: "flex", gap: 18, background: C.surface }}>
          {[["↑↓", t.chrome.palette.navigate], ["↵", t.chrome.palette.select], ["Esc", t.chrome.palette.close]].map(([key, label]) => (
            <span key={key} style={{ fontSize: 13, fontFamily: C.font, color: C.textMuted, display: "inline-flex", alignItems: "center", gap: 6 }}>
              <kbd style={{ fontFamily: C.font, color: C.text, background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, padding: "1px 7px", fontSize: 12 }}>{key}</kbd>{label}
            </span>
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
}
