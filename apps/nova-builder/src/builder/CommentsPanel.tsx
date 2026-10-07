"use client";
import { useState, useEffect, useCallback } from "react";
import { useStore } from "@nanostores/react";
import { $projectMeta } from "@/lib/data-stores";
import { $selectedInstanceId } from "@/lib/nano-states";
import { UI_VARS as C } from "@/lib/uiTheme";
import { useI18n, formatTimeAgo } from "@/lib/i18n";


type Comment = {
  id: string;
  body: string;
  instance_id: string | null;
  resolved: boolean;
  parent_id: string | null;
  created_at: string;
  user_id: string;
};


export function CommentsPanel({ projectId }: { projectId: string }) {
  const { t } = useI18n();
  const L = t.tools.comments;
  const meta = useStore($projectMeta);
  const pid = projectId || meta?.id;
  const selectedInstanceId = useStore($selectedInstanceId);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [body, setBody] = useState("");
  const [pinToInstance, setPinToInstance] = useState(false);
  const [showResolved, setShowResolved] = useState(false);
  const [posting, setPosting] = useState(false);

  const load = useCallback(async () => {
    if (!pid) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${pid}/comments?resolved=${showResolved}`);
      const json = await res.json() as { comments?: Comment[] };
      setComments(json.comments ?? []);
    } finally {
      setLoading(false);
    }
  }, [pid, showResolved]);

  useEffect(() => { load(); }, [load]);

  const post = async () => {
    if (!pid || !body.trim()) return;
    setPosting(true);
    try {
      await fetch(`/api/projects/${pid}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: body.trim(), instanceId: pinToInstance ? selectedInstanceId : undefined }),
      });
      setBody("");
      load();
    } finally {
      setPosting(false);
    }
  };

  const resolve = async (id: string, resolved: boolean) => {
    if (!pid) return;
    await fetch(`/api/projects/${pid}/comments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resolved }),
    });
    load();
  };

  const remove = async (id: string) => {
    if (!pid) return;
    await fetch(`/api/projects/${pid}/comments/${id}`, { method: "DELETE" });
    load();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", fontFamily: C.font }}>
      <div style={{ padding: "10px 12px", borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={L.placeholder}
          rows={2}
          style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 7, color: C.text, fontSize: 13, fontFamily: C.font, padding: "7px 10px", resize: "none", outline: "none", boxSizing: "border-box" }}
        />
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: C.textMuted, cursor: "pointer" }}>
            <input type="checkbox" checked={pinToInstance} onChange={(e) => setPinToInstance(e.target.checked)} />
            {L.pin}
          </label>
          <button onClick={post} disabled={posting || !body.trim()}
            style={{ marginLeft: "auto", padding: "4px 12px", borderRadius: 5, border: "1px solid rgba(124,58,237,0.4)", background: "rgba(124,58,237,0.15)", color: "#c4b5fd", fontSize: 12, fontFamily: C.font, fontWeight: 700, cursor: posting || !body.trim() ? "default" : "pointer" }}>
            {posting ? "…" : L.post}
          </button>
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: C.textMuted, cursor: "pointer", marginTop: 6 }}>
          <input type="checkbox" checked={showResolved} onChange={(e) => setShowResolved(e.target.checked)} />
          {L.showResolved}
        </label>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
        {loading && <div style={{ padding: "10px 12px", color: C.textMuted, fontSize: 13 }}>{L.loading}</div>}
        {!loading && comments.length === 0 && (
          <div style={{ padding: "16px 12px", color: C.textMuted, fontSize: 13, textAlign: "center" }}>{L.empty}</div>
        )}
        {comments.map((c) => (
          <div key={c.id} style={{ padding: "8px 12px", borderBottom: `1px solid rgba(255,255,255,0.04)`, opacity: c.resolved ? 0.55 : 1 }}>
            <div style={{ fontSize: 13, color: C.text, marginBottom: 4, lineHeight: 1.5, wordBreak: "break-word" }}>{c.body}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 9, color: C.textMuted }}>{formatTimeAgo(c.created_at, t.tools.time)}</span>
              {c.instance_id && <span style={{ fontSize: 9, color: "#a78bfa" }}>{L.element}</span>}
              <button onClick={() => resolve(c.id, !c.resolved)} style={{ marginLeft: "auto", fontSize: 9, color: c.resolved ? "#6ee7b7" : C.textMuted, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                {c.resolved ? L.unresolve : L.resolve}
              </button>
              <button onClick={() => remove(c.id)} style={{ fontSize: 9, color: "rgba(239,68,68,0.6)", background: "none", border: "none", cursor: "pointer", padding: 0 }}>×</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
