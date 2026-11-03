"use client";
import { EmptyState } from "./controls/EmptyState";
import { FloatingPanel, panelPrimary, panelQuiet } from "./FloatingPanel";
import { Icon } from "@/builder/icons";
import { useState, useEffect, useCallback } from "react";
import { useStore } from "@nanostores/react";
import { $projectMeta } from "@/lib/data-stores";
import { $historyPanelOpen } from "@/lib/nano-states";
import { restoreSnapshot } from "@/lib/snapshots";
import { UI_VARS as C } from "@/lib/uiTheme";
import { useI18n } from "@/lib/i18n";


type Snapshot = { id: string; label: string | null; created_at: string };

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function HistoryPanel() {
  const L = useI18n().t.tools.history;
  const isOpen = useStore($historyPanelOpen);
  const meta = useStore($projectMeta);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [restoring, setRestoring] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const load = useCallback(async () => {
    if (!meta?.id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${meta.id}/snapshots`);
      const json = await res.json() as { snapshots?: Snapshot[] };
      setSnapshots(json.snapshots ?? []);
    } finally {
      setLoading(false);
    }
  }, [meta?.id]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") $historyPanelOpen.set(false); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) load();
  }, [isOpen, load]);

  if (!isOpen) return null;

  const saveSnapshot = async () => {
    if (!meta?.id) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${meta.id}/snapshots`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: newLabel.trim() || null }),
      });
      if (res.ok) { setNewLabel(""); setMessage({ type: "ok", text: L.saved }); load(); }
      else setMessage({ type: "err", text: L.saveFailed });
    } finally {
      setSaving(false);
    }
    setTimeout(() => setMessage(null), 2500);
  };

  const restore = async (snapId: string) => {
    if (!meta?.id) return;
    if (!window.confirm(L.confirmRestore)) return;
    setRestoring(snapId);
    try {
      if (await restoreSnapshot(meta.id, snapId)) {
        setMessage({ type: "ok", text: L.restored });
        setTimeout(() => window.location.reload(), 800);
        return;
      } else setMessage({ type: "err", text: L.restoreFailed });
    } finally {
      setRestoring(null);
    }
    setTimeout(() => setMessage(null), 3000);
  };

  return (
    <FloatingPanel label={L.dialogLabel} title={L.title} icon="history" onClose={() => $historyPanelOpen.set(false)} width={380}>
      <div style={{ padding: "14px 16px", borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder={L.labelPlaceholder}
            onKeyDown={(e) => { if (e.key === "Enter") saveSnapshot(); }}
            style={{ flex: 1, background: C.card, border: "1px solid var(--ui-border)", borderRadius: 12, color: C.text, fontSize: 14, fontFamily: C.font, height: 36, padding: "0 12px", outline: "none" }}
          />
          <button onClick={saveSnapshot} disabled={saving}
            style={panelPrimary(saving)}>
            {saving ? "…" : L.save}
          </button>
        </div>
        {message && (
          <div style={{ marginTop: 6, fontSize: 12, color: message.type === "ok" ? C.success : C.error }}>{message.text}</div>
        )}
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
        {loading && <div style={{ padding: "20px 16px", color: C.textMuted, fontSize: 14, textAlign: "center" }}>{L.loading}</div>}
        {!loading && snapshots.length === 0 && (
          <EmptyState icon="history" text={L.empty} />
        )}
        {snapshots.map((snap) => (
          <div key={snap.id} style={{ padding: "10px 16px", display: "flex", alignItems: "center", gap: 10, borderBottom: `1px solid ${C.border}` }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: C.text, fontWeight: snap.label ? 600 : 400 }}>
                {snap.label || <span style={{ color: C.textMuted, fontStyle: "italic" }}>{L.unnamed}</span>}
              </div>
              <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>{formatDate(snap.created_at)}</div>
            </div>
            <button
              onClick={() => restore(snap.id)}
              disabled={restoring === snap.id}
              style={{ ...panelQuiet, height: 32, fontSize: 13, cursor: restoring === snap.id ? "default" : "pointer" }}
            >
              {restoring === snap.id ? "…" : L.restore}
            </button>
          </div>
        ))}
      </div>
    </FloatingPanel>
  );
}
