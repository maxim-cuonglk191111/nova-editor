"use client";
import { useRef, useState, useEffect, useCallback } from "react";
import { useStore } from "@nanostores/react";
import { $assets, $instances, $projectMeta } from "@/lib/data-stores";
import { $selectedInstanceId } from "@/lib/nano-states";
import { updateData } from "@/lib/transactions";
import type { NovaAsset } from "@/lib/r2";
import type { AssetFolder } from "@/lib/db-folders";
import { useI18n, fmt } from "@/lib/i18n";
import { countAssetRefs, T, SearchIcon, UploadIcon, FolderPlusIcon, XIcon, ImagePlaceholderIcon } from "./assetShared";
import { FolderCard, FolderIllustration } from "./FolderCard";
import { AssetCard } from "./AssetCard";
import { AssetLightbox } from "./AssetLightbox";


const CHUNK_SIZE = 4 * 1024 * 1024;

// ── AssetsPanel (main) ────────────────────────────────────────────────────────

export function AssetsPanel() {
  const { t } = useI18n();
  const L = t.assets;
  const assets = useStore($assets);
  const instances = useStore($instances);
  const selectedInstanceId = useStore($selectedInstanceId);
  const projectMeta = useStore($projectMeta);

  const [activeTab, setActiveTab] = useState<"images" | "folders">("images");
  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ asset: NovaAsset; refCount: number } | null>(null);
  const [previewAsset, setPreviewAsset] = useState<NovaAsset | null>(null);

  // Folder state
  const [folders, setFolders] = useState<AssetFolder[]>([]);
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [folderError, setFolderError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const projectId = projectMeta?.id;
  const selectedInstance = selectedInstanceId ? instances.get(selectedInstanceId) : undefined;
  const isImageSelected = selectedInstance?.component === "Image";

  // Load folders
  const loadFolders = useCallback(async () => {
    if (!projectId) return;
    try {
      const res = await fetch(`/api/assets/folders?projectId=${encodeURIComponent(projectId)}`);
      if (!res.ok) return;
      const json = (await res.json()) as { folders?: AssetFolder[] };
      setFolders(json.folders ?? []);
    } catch { /* non-fatal */ }
  }, [projectId]);

  useEffect(() => { void loadFolders(); }, [loadFolders]);

  // Filter assets
  const assetList = ([...assets.values()] as NovaAsset[]).filter((a) => {
    const matchesFolder = activeFolderId === null
      ? true
      : (a.folderId ?? null) === activeFolderId;
    const matchesSearch = search
      ? a.name.toLowerCase().includes(search.toLowerCase())
      : true;
    return matchesFolder && matchesSearch;
  });

  const imageAssets = assetList.filter((a) => a.type === "image");
  const allAssets = [...assets.values()] as NovaAsset[];
  function folderAssetCount(folderId: string) {
    return allAssets.filter((a) => (a.folderId ?? null) === folderId).length;
  }

  // Upload
  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !projectId) return;
    setUploading(true); setError(null); setProgress(0);
    try {
      let asset: NovaAsset;
      if (file.size <= 8 * 1024 * 1024) {
        setProgress(30);
        const form = new FormData();
        form.append("file", file);
        form.append("projectId", projectId);
        if (activeFolderId) form.append("folderId", activeFolderId);
        const res = await fetch("/api/assets", { method: "POST", body: form });
        const json = (await res.json()) as { asset?: NovaAsset; error?: string };
        if (!res.ok) throw new Error(json.error ?? L.uploadFailed);
        asset = json.asset!; setProgress(100);
      } else {
        const totalParts = Math.ceil(file.size / CHUNK_SIZE);
        const initRes = await fetch("/api/assets/upload", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ projectId, fileName: file.name, fileType: file.type, totalParts, folderId: activeFolderId }),
        });
        const init = (await initRes.json()) as { uploadId?: string; assetId?: string; error?: string };
        if (!initRes.ok) throw new Error(init.error ?? L.uploadFailed);
        const { uploadId, assetId } = init;
        for (let i = 0; i < totalParts; i++) {
          const form = new FormData();
          form.append("uploadId", uploadId!); form.append("chunk", file.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE));
          form.append("partIndex", String(i)); form.append("totalParts", String(totalParts));
          await fetch("/api/assets/upload", { method: "PUT", body: form });
          setProgress(Math.round(((i + 1) / totalParts) * 80));
        }
        const completeRes = await fetch("/api/assets/upload", {
          method: "PATCH", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uploadId, assetId, fileName: file.name, fileType: file.type, fileSize: file.size }),
        });
        const complete = (await completeRes.json()) as { asset?: NovaAsset; error?: string };
        if (!completeRes.ok) throw new Error(complete.error ?? L.uploadFailed);
        asset = complete.asset!; setProgress(100);
      }
      updateData(({ assets: a }) => { a.set(asset.id, asset as Parameters<typeof a.set>[1]); });
    } catch (err) {
      setError(err instanceof Error ? err.message : L.uploadFailed);
    } finally {
      setUploading(false); setProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function handleInsert(asset: NovaAsset) {
    if (!selectedInstanceId) return;
    updateData(({ props }) => {
      // Find all existing src props for this instance and consolidate to one ID
      const matching: string[] = [];
      for (const p of (props as Map<string, { instanceId: string; name: string }>).values()) {
        if (p.instanceId === selectedInstanceId && p.name === "src") matching.push((p as any).id);
      }
      const propId = matching[0] ?? `${selectedInstanceId}:src`;
      // Remove duplicates
      for (let i = 1; i < matching.length; i++) props.delete(matching[i]);
      props.set(propId, { id: propId, instanceId: selectedInstanceId, name: "src", type: "string" as const, value: asset.url } as Parameters<typeof props.set>[1]);
    });
  }

  function handleDeleteRequest(asset: NovaAsset) {
    // Always confirm: the file is removed from storage, so undo cannot bring it back.
    setDeleteConfirm({ asset, refCount: countAssetRefs(asset.id) });
  }

  async function doDelete(asset: NovaAsset) {
    if (!projectId) return; setDeleteConfirm(null);
    // Remove from the panel at once; the storage delete can take seconds.
    updateData(({ assets: a }) => { a.delete(asset.id); });
    try {
      await fetch(`/api/assets/${asset.id}`, {
        method: "DELETE", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, key: asset.key, force: true, imagekitFileId: asset.imagekitFileId }),
      });
    } catch { /* */ }
  }

  async function handleCreateFolder() {
    if (!projectId || !newFolderName.trim()) return;
    const name = newFolderName.trim();
    setCreatingFolder(false); setNewFolderName(""); setFolderError(null);
    try {
      const res = await fetch("/api/assets/folders", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, projectId, parentId: null }),
      });
      const json = (await res.json()) as { folder?: AssetFolder; error?: string };
      if (!res.ok) throw new Error(json.error ?? L.createFolderFailed);
      setFolders((prev) => [...prev, json.folder!]);
      setActiveFolderId(json.folder!.id);
    } catch (err) {
      setFolderError(err instanceof Error ? err.message : L.createFolderFailed);
    }
  }

  async function handleDeleteFolder(folder: AssetFolder) {
    if (!confirm(fmt(L.confirmDeleteFolder, { name: folder.name }))) return;
    try {
      await fetch(`/api/assets/folders/${folder.id}`, { method: "DELETE" });
      setFolders((prev) => prev.filter((f) => f.id !== folder.id));
      if (activeFolderId === folder.id) setActiveFolderId(null);
    } catch (err) {
      setFolderError(err instanceof Error ? err.message : L.deleteFailed);
    }
  }

  function handleMoveAsset(assetId: string, folderId: string) {
    updateData(({ assets: a }) => {
      const asset = a.get(assetId) as NovaAsset | undefined;
      if (!asset) return;
      a.set(assetId, { ...asset, folderId } as Parameters<typeof a.set>[1]);
    });
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: T.bg, fontFamily: T.font }}>

      {/* Search bar */}
      <div style={{ padding: "12px 12px 8px" }}>
        <div style={{ position: "relative" }}>
          <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
            <SearchIcon />
          </span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={L.searchPlaceholder}
            style={{
              width: "100%", boxSizing: "border-box" as const,
              padding: "9px 10px 9px 34px",
              background: T.inputBg, border: `1.5px solid ${T.border}`,
              borderRadius: 10, fontSize: 13, color: T.text,
              fontFamily: T.font, outline: "none",
            }}
          />
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ padding: "0 12px 8px", display: "flex", gap: 8 }}>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || !projectId}
          style={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
            padding: "10px 12px", borderRadius: 10,
            background: uploading ? "rgba(124,58,237,0.5)" : T.accent,
            color: "#fff", border: "none", fontSize: 13, fontWeight: 700,
            cursor: uploading ? "not-allowed" : "pointer",
            transition: "background 0.15s",
          }}
        >
          <UploadIcon />
          {uploading ? L.uploading : L.upload}
        </button>
        <input ref={fileInputRef} type="file" accept="image/*,font/woff,font/woff2,application/font-woff,application/font-woff2" style={{ display: "none" }} onChange={handleFileChange} />
      </div>

      {/* Upload progress */}
      {uploading && (
        <div style={{ padding: "0 12px 6px" }}>
          <div style={{ height: 3, background: "#e5e5e5", borderRadius: 2 }}>
            <div style={{ height: "100%", width: `${progress}%`, background: T.accent, borderRadius: 2, transition: "width 0.2s" }} />
          </div>
        </div>
      )}



      {/* Error banner */}
      {(error || folderError) && (
        <div style={{ margin: "0 12px 8px", padding: "8px 12px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, fontSize: 12, color: T.error, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span>{error || folderError}</span>
          <button onClick={() => { setError(null); setFolderError(null); }} style={{ background: "none", border: "none", cursor: "pointer", color: T.error, padding: 0, display: "flex" }}>
            <XIcon size={10} />
          </button>
        </div>
      )}

      {/* Insert hint */}
      {isImageSelected && (
        <div style={{ margin: "0 12px 6px", padding: "6px 10px", background: "rgba(124,58,237,0.06)", border: `1px solid ${T.accentBorder}`, borderRadius: 8, fontSize: 11, color: T.accent }}>
          {L.insertHint}
        </div>
      )}

      {/* Tabs: images | folders */}
      <div style={{ padding: "0 12px", borderBottom: `1.5px solid ${T.border}`, display: "flex", gap: 24 }}>
        {(["images", "folders"] as const).map((tab) => {
          const label = tab === "images" ? L.tabImages : L.tabFolders;
          const active = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                background: "none", border: "none", padding: "10px 0",
                fontSize: 13, fontWeight: active ? 700 : 500,
                color: active ? T.accent : T.textSub,
                cursor: "pointer", fontFamily: T.font,
                borderBottom: active ? `2.5px solid ${T.accent}` : "2.5px solid transparent",
                marginBottom: -1.5, transition: "all 0.15s",
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, overflowY: "auto" }}>

        {/* ── Images tab ── */}
        {activeTab === "images" && (
          <div style={{ padding: 12 }}>
            {/* Folder breadcrumb when filtering by folder */}
            {activeFolderId && (
              <div style={{ marginBottom: 10, display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: T.textMuted }}>
                <span style={{ cursor: "pointer", color: T.accent }} onClick={() => setActiveFolderId(null)}>{L.all}</span>
                <span>&rsaquo;</span>
                <span style={{ color: T.text, fontWeight: 600 }}>
                  {folders.find((f) => f.id === activeFolderId)?.name ?? L.folder}
                </span>
                <button onClick={() => setActiveFolderId(null)} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: T.textMuted, display: "flex" }}>
                  <XIcon size={9} />
                </button>
              </div>
            )}

            {imageAssets.length === 0 ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 20px", gap: 8, textAlign: "center" }}>
                <ImagePlaceholderIcon />
                <div style={{ fontSize: 13, color: T.textMuted }}>
                  {activeFolderId ? L.emptyFolder : L.empty}
                </div>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
                {imageAssets.map((asset) => (
                  <AssetCard key={asset.id} asset={asset} canInsert={isImageSelected} onInsert={handleInsert} onDelete={handleDeleteRequest} onPreview={setPreviewAsset} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Folders tab ── */}
        {activeTab === "folders" && (
          <div style={{ padding: 12 }}>
            {folders.length === 0 && !creatingFolder ? (
              /* Empty state — matches the design */
              <div style={{
                margin: "8px 0",
                border: `1.5px dashed ${T.borderDash}`,
                borderRadius: 16, padding: "28px 24px 24px",
                display: "flex", flexDirection: "column", alignItems: "center",
                textAlign: "center", gap: 6,
              }}>
                <FolderIllustration />
                <div style={{ fontSize: 15, fontWeight: 700, color: T.text, marginTop: 8 }}>
                  {L.organizeTitle}
                </div>
                <div style={{ fontSize: 13, color: T.textMuted, lineHeight: 1.55, maxWidth: 220 }}>
                  {L.organizeDesc}
                </div>
                <button
                  onClick={() => setCreatingFolder(true)}
                  style={{
                    marginTop: 14, display: "flex", alignItems: "center", gap: 8,
                    padding: "10px 22px", borderRadius: 50,
                    background: T.bg, border: `1.5px solid ${T.border}`,
                    color: T.text, fontSize: 13, fontWeight: 600,
                    cursor: "pointer", fontFamily: T.font,
                    transition: "border-color 0.15s, box-shadow 0.15s",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = T.accent; e.currentTarget.style.color = T.accent; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.text; }}
                >
                  <FolderPlusIcon />
                  {L.createFolder}
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {folders.map((folder) => (
                  <FolderCard
                    key={folder.id}
                    folder={folder}
                    assetCount={folderAssetCount(folder.id)}
                    isActive={activeFolderId === folder.id}
                    onClick={() => { setActiveFolderId(folder.id); setActiveTab("images"); }}
                    onDelete={() => handleDeleteFolder(folder)}
                    onDrop={(assetId) => handleMoveAsset(assetId, folder.id)}
                  />
                ))}
                {/* Add new folder button (when folders exist) */}
                <button
                  onClick={() => setCreatingFolder(true)}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    padding: "10px", borderRadius: 10,
                    background: "transparent", border: `1.5px dashed ${T.borderDash}`,
                    color: T.textMuted, fontSize: 13, cursor: "pointer",
                    fontFamily: T.font, transition: "border-color 0.15s, color 0.15s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = T.accent; e.currentTarget.style.color = T.accent; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = T.borderDash; e.currentTarget.style.color = T.textMuted; }}
                >
                  <FolderPlusIcon />
                  {L.createNewFolder}
                </button>
              </div>
            )}

            {/* Create folder inline input */}
            {creatingFolder && (
              <div style={{ marginTop: folders.length > 0 ? 8 : 0, padding: "12px 14px", background: T.cardBg, border: `1.5px solid ${T.accentBorder}`, borderRadius: 10 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 8 }}>{L.folderName}</div>
                <input
                  autoFocus
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void handleCreateFolder();
                    if (e.key === "Escape") { setCreatingFolder(false); setNewFolderName(""); }
                  }}
                  placeholder={L.folderPlaceholder}
                  style={{
                    width: "100%", boxSizing: "border-box" as const,
                    padding: "8px 10px", background: T.bg,
                    border: `1.5px solid ${T.accentBorder}`, borderRadius: 8,
                    fontSize: 13, color: T.text, fontFamily: T.font, outline: "none",
                  }}
                />
                <div style={{ display: "flex", gap: 8, marginTop: 10, justifyContent: "flex-end" }}>
                  <button
                    onClick={() => { setCreatingFolder(false); setNewFolderName(""); }}
                    style={{ padding: "6px 14px", borderRadius: 7, border: `1px solid ${T.border}`, background: "transparent", color: T.textSub, fontSize: 12, cursor: "pointer" }}
                  >
                    {L.cancel}
                  </button>
                  <button
                    onClick={() => void handleCreateFolder()}
                    disabled={!newFolderName.trim()}
                    style={{
                      padding: "6px 14px", borderRadius: 7, border: "none",
                      background: newFolderName.trim() ? T.accent : "#c4b5fd",
                      color: "#fff", fontSize: 12, fontWeight: 600,
                      cursor: newFolderName.trim() ? "pointer" : "not-allowed",
                    }}
                  >
                    {L.create}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete confirm modal */}
      {deleteConfirm && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 }}>
          <div style={{ background: T.bg, borderRadius: 16, padding: "20px 22px", width: 280, boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: T.text, marginBottom: 8 }}>{L.deleteTitle}</div>
            <div style={{ fontSize: 12, color: T.textSub, lineHeight: 1.6, marginBottom: 16 }}>
              {deleteConfirm.refCount > 0
                ? `${L.deleteInUse.replace("{count}", String(deleteConfirm.refCount))} ${L.deleteWarning}`
                : L.deletePermanent}
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button onClick={() => setDeleteConfirm(null)} style={{ padding: "7px 16px", borderRadius: 8, border: `1px solid ${T.border}`, background: "transparent", color: T.textSub, fontSize: 12, cursor: "pointer" }}>{L.cancel}</button>
              <button onClick={() => void doDelete(deleteConfirm.asset)} style={{ padding: "7px 16px", borderRadius: 8, border: "none", background: T.error, color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>{L.delete}</button>
            </div>
          </div>
        </div>
      )}

      {/* Image preview lightbox */}
      {previewAsset && <AssetLightbox asset={previewAsset} onClose={() => setPreviewAsset(null)} />}
    </div>
  );
}
