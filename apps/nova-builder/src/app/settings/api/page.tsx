"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { UI_VARS as C } from "@/lib/uiTheme";
import { useI18n, fmt } from "@/lib/i18n";


type APIKey = { id: string; name: string; key_prefix: string; created_at: string; last_used_at: string | null };

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export default function APISettingsPage() {
  const K = useI18n().t.dashboard.apiKeys;
  const router = useRouter();
  const [keys, setKeys] = useState<APIKey[]>([]);
  const [loading, setLoading] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [revealedKey, setRevealedKey] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/keys");
      const json = await res.json() as { keys?: APIKey[] };
      setKeys(json.keys ?? []);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const create = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });
      const json = await res.json() as { fullKey?: string };
      if (json.fullKey) {
        setRevealedKey(json.fullKey);
        setNewName("");
        load();
      }
    } finally { setCreating(false); }
  };

  const revoke = async (id: string) => {
    if (!confirm(K.confirmRevoke)) return;
    await fetch(`/api/keys/${id}`, { method: "DELETE" });
    load();
  };

  const cardStyle = {
    background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 20, marginBottom: 24,
  };

  return (
    <div style={{ background: C.bg, minHeight: "100vh", padding: 32, fontFamily: C.font, color: C.text }}>
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
          <button onClick={() => router.back()} style={{ background: "none", border: "none", color: C.textMuted, cursor: "pointer", fontSize: 18 }}>←</button>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{K.title}</h1>
        </div>

        {/* Create new key */}
        <div style={cardStyle}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>{K.createTitle}</div>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") create(); }}
              placeholder={K.namePlaceholder}
              style={{
                flex: 1, background: "rgba(255,255,255,0.05)", border: `1px solid ${C.border}`,
                borderRadius: 6, color: C.text, fontSize: 12, fontFamily: C.font,
                padding: "8px 12px", outline: "none",
              }}
            />
            <button
              onClick={create}
              disabled={creating || !newName.trim()}
              style={{
                padding: "8px 18px", borderRadius: 6, border: "none",
                background: C.accent, color: "#fff", fontSize: 12, fontWeight: 700,
                cursor: creating || !newName.trim() ? "default" : "pointer", opacity: creating ? 0.7 : 1,
              }}
            >
              {creating ? K.creating : K.create}
            </button>
          </div>

          {/* Revealed key — shown once after creation */}
          {revealedKey && (
            <div style={{ marginTop: 14, padding: 12, background: "rgba(6,148,105,0.1)", border: "1px solid rgba(6,148,105,0.3)", borderRadius: 6 }}>
              <div style={{ fontSize: 13, color: "#6ee7b7", marginBottom: 6, fontWeight: 600 }}>
                {K.createdNotice}
              </div>
              <code style={{ fontSize: 13, fontFamily: C.fontMono, color: C.text, wordBreak: "break-all" }}>
                {revealedKey}
              </code>
              <button
                onClick={() => { navigator.clipboard.writeText(revealedKey); }}
                style={{ display: "block", marginTop: 8, fontSize: 13, color: C.accent, background: "none", border: "none", cursor: "pointer", padding: 0 }}
              >
                {K.copy}
              </button>
            </div>
          )}
        </div>

        {/* Existing keys */}
        <div style={cardStyle}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>{K.listTitle}</div>
          {loading && <div style={{ fontSize: 12, color: C.textMuted }}>{K.loading}</div>}
          {!loading && keys.length === 0 && (
            <div style={{ fontSize: 12, color: C.textMuted }}>{K.empty}</div>
          )}
          {keys.map((k) => (
            <div key={k.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: `1px solid ${C.border}` }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{k.name}</div>
                <div style={{ fontSize: 13, fontFamily: C.fontMono, color: C.textMuted, marginTop: 2 }}>
                  {k.key_prefix}…
                </div>
                <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>
                  {fmt(K.created, { date: formatDate(k.created_at) })}
                  {k.last_used_at ? fmt(K.lastUsed, { date: formatDate(k.last_used_at) }) : K.neverUsed}
                </div>
              </div>
              <button
                onClick={() => revoke(k.id)}
                style={{ fontSize: 13, color: C.danger, background: "none", border: `1px solid ${C.danger}`, borderRadius: 4, padding: "3px 10px", cursor: "pointer" }}
              >
                {K.revoke}
              </button>
            </div>
          ))}
        </div>

        <div style={{ fontSize: 13, color: C.textMuted, lineHeight: 1.6 }}>
          {K.footerBefore} <code style={{ fontFamily: C.fontMono }}>Authorization: Bearer &lt;key&gt;</code> {K.footerAfter}
        </div>
      </div>
    </div>
  );
}
