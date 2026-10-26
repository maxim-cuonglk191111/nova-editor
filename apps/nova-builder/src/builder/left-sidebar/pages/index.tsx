"use client";
import { useState } from "react";
import { useStore } from "@nanostores/react";
import { $pages } from "@/lib/data-stores";
import { $selectedPageId } from "@/lib/nano-states";
import { PageItem } from "./PageItem";
import { FolderItem } from "./FolderItem";
import { usePageCrud } from "./usePageCrud";
import { NewPageForm } from "./NewPageForm";
import type { PageSeo } from "./usePageCrud";
import { UI_VARS as C } from "@/lib/uiTheme";
import { useI18n, fmt } from "@/lib/i18n";


const inputStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(139,92,246,0.4)",
  borderRadius: 4,
  color: C.text,
  fontSize: 12,
  fontFamily: C.font,
  padding: "4px 7px",
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
};

const headerAction: React.CSSProperties = {
  background: "none",
  border: `1px solid ${C.border}`,
  borderRadius: 4,
  color: C.text,
  fontSize: 12,
  fontFamily: C.font,
  cursor: "pointer",
  padding: "4px 8px",
  minHeight: 28,
};

export function PagesPanel() {
  const L = useI18n().t.sidebar.pages;
  const pages = useStore($pages);
  const selectedPageId = useStore($selectedPageId);
  const { createPage, renamePage, updatePageSeo, deletePage, setHomePage, createFolder, renameFolder, deleteFolder } = usePageCrud();

  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [showNewPage, setShowNewPage] = useState(false);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  if (!pages) {
    return <div style={{ padding: 12, fontSize: 13, color: C.textMuted, fontFamily: C.font }}>{L.noPages}</div>;
  }

  // Narrow for use inside closures — TypeScript doesn't track non-null through nested functions.
  const pagesData = pages;
  const activePageId = selectedPageId ?? pagesData.homePageId;
  const canDelete = pagesData.pages.size > 1;

  function toggleFolder(fid: string) {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(fid)) next.delete(fid); else next.add(fid);
      return next;
    });
  }

  function handleCreateFolder() {
    if (!newFolderName.trim()) return;
    const name = newFolderName.trim();
    createFolder(name);
    setNewFolderName(""); setShowNewFolder(false);
  }

  // Recursively render a folder's children.
  function renderChildren(childIds: string[], depth = 0): React.ReactNode {
    return childIds.map(childId => {
      const folder = pagesData.folders.get(childId);
      if (folder) {
        const isExpanded = expandedFolders.has(childId);
        return (
          <FolderItem
            key={childId}
            name={folder.name}
            isExpanded={isExpanded}
            handlers={{
              onToggle: () => toggleFolder(childId),
              onRename: (name) => renameFolder(childId, name),
              onDelete: () => {
                if (confirm(fmt(L.confirmDeleteFolder, { name: folder.name }))) {
                  deleteFolder(childId);
                }
              },
            }}
          >
            {isExpanded && renderChildren(folder.children ?? [], depth + 1)}
          </FolderItem>
        );
      }

      const page = pagesData.pages.get(childId);
      if (!page) return null;
      return (
        <PageItem
          key={page.id}
          siblings={Array.from(pagesData.pages.values()).map((p) => ({ id: p.id, path: p.path }))}
          page={{
            id: page.id,
            name: page.name,
            path: page.path,
            title: (page as any).title,
            description: (page as any).meta?.description,
            noindex: (page as any).meta?.excludePageFromSearch === "true",
          }}
          status={{ isActive: page.id === activePageId, isHome: page.id === pagesData.homePageId, canDelete }}
          handlers={{
            onClick: () => $selectedPageId.set(page.id),
            onRename: (name, path) => renamePage(page.id, name, path),
            onSeoChange: (seo: PageSeo) => updatePageSeo(page.id, seo),
            onSetHome: () => setHomePage(page.id),
            onDelete: () => {
              if (confirm(fmt(L.confirmDeletePage, { name: page.name }))) deletePage(page.id);
            },
          }}
        />
      );
    });
  }

  // Root folder children drive the top-level list.
  const rootFolder = pagesData.rootFolderId ? pagesData.folders.get(pagesData.rootFolderId) : null;
  const rootChildren: string[] = rootFolder?.children ?? [...pagesData.pages.keys()];

  return (
    <div style={{ display: "flex", flexDirection: "column", overflow: "hidden", height: "100%" }}>
      {/* Header — the add actions sit here so the form opens right beneath the button */}
      <div style={{ padding: "7px 10px 6px", borderBottom: `1px solid ${C.border}`, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <span style={{ fontSize: 12, fontFamily: C.font, color: C.textMuted, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>
          {L.title}
        </span>
        <div style={{ display: "flex", gap: 4 }}>
          <button onClick={() => { setShowNewFolder(false); setShowNewPage(true); }} disabled={showNewPage} style={headerAction}>{L.addPage}</button>
          <button onClick={() => { setShowNewPage(false); setShowNewFolder(true); }} disabled={showNewFolder} style={headerAction}>{L.addFolder}</button>
        </div>
      </div>

      {showNewPage && (
        <NewPageForm
          existing={Array.from(pagesData.pages.values()).map((p) => ({ id: p.id, path: p.path }))}
          onCreate={createPage}
          onCancel={() => setShowNewPage(false)}
        />
      )}

      {/* New folder form */}
      {showNewFolder && (
        <div style={{ padding: "8px 10px", borderTop: `1px solid ${C.border}`, display: "flex", flexDirection: "column", gap: 4, flexShrink: 0 }}>
          <input autoFocus value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} placeholder={L.folderName}
            onKeyDown={(e) => { if (e.key === "Enter") handleCreateFolder(); if (e.key === "Escape") { setShowNewFolder(false); setNewFolderName(""); } }}
            style={inputStyle} />
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={handleCreateFolder} style={{ flex: 1, padding: "4px 0", background: "#7c3aed", border: "1px solid #7c3aed", borderRadius: 4, color: "#ffffff", fontWeight: 600, fontSize: 13, fontFamily: C.font, cursor: "pointer" }}>{L.createFolder}</button>
            <button onClick={() => { setShowNewFolder(false); setNewFolderName(""); }} style={{ padding: "4px 10px", background: "none", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 4, color: C.textMuted, fontSize: 13, fontFamily: C.font, cursor: "pointer" }}>{L.cancel}</button>
          </div>
        </div>
      )}

      {/* Tree */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {renderChildren(rootChildren)}
      </div>
    </div>
  );
}
