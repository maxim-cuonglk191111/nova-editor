"use client";
import { useState, useEffect, useCallback } from "react";
import { useStore } from "@nanostores/react";
import { $projectMeta } from "@/lib/data-stores";
import { UI_VARS as C } from "@/lib/uiTheme";
import { useI18n, fmt, formatTimeAgo, type I18nActivityDictionary } from "@/lib/i18n";


type ActivityEvent = {
  id: string;
  action: string;
  meta: Record<string, unknown> | null;
  created_at: string;
  user_id: string;
};

const ACTION_ICON: Record<string, string> = {
  save: "💾",
  ai_compose: "✦",
  snapshot: "⏱",
  deploy: "🚀",
  github_push: "⇡",
  restore: "↩",
  comment: "💬",
};

function actionLabel(action: string, meta: Record<string, unknown> | null, L: I18nActivityDictionary): string {
  const labels: Record<string, string> = {
    save: L.save,
    ai_compose: L.aiCompose,
    snapshot: meta?.label ? fmt(L.snapshotNamed, { label: String(meta.label) }) : L.snapshot,
    deploy: fmt(L.deploy, { provider: String(meta?.provider ?? L.platform) }),
    github_push: fmt(L.githubPush, { branch: String(meta?.branch ?? "main") }),
    restore: L.restore,
    comment: L.comment,
  };
  return labels[action] ?? action;
}

export function ActivityPanel({ projectId }: { projectId: string }) {
  const { t } = useI18n();
  const L = t.tools.activity;
  const meta = useStore($projectMeta);
  const pid = projectId || meta?.id;
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!pid) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${pid}/activity`);
      const json = await res.json() as { events?: ActivityEvent[] };
      setEvents(json.events ?? []);
    } finally {
      setLoading(false);
    }
  }, [pid]);

  useEffect(() => { load(); }, [load]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", fontFamily: C.font }}>
      <div style={{ padding: "8px 12px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <span style={{ fontSize: 12, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.08em" }}>{L.title}</span>
        <button onClick={load} style={{ background: "none", border: "none", color: C.textMuted, cursor: "pointer", fontSize: 13, padding: 0 }}>↻</button>
      </div>
      <div style={{ flex: 1, overflowY: "auto" }}>
        {loading && <div style={{ padding: "10px 12px", color: C.textMuted, fontSize: 13 }}>{L.loading}</div>}
        {!loading && events.length === 0 && (
          <div style={{ padding: "16px 12px", color: C.textMuted, fontSize: 13, textAlign: "center" }}>
            {L.empty}
          </div>
        )}
        {events.map((ev) => (
          <div key={ev.id} style={{ padding: "7px 12px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "flex-start", gap: 8 }}>
            <span style={{ fontSize: 14, lineHeight: 1, marginTop: 1, flexShrink: 0 }}>{ACTION_ICON[ev.action] ?? "•"}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: C.text, lineHeight: 1.4 }}>{actionLabel(ev.action, ev.meta, L)}</div>
              <div style={{ fontSize: 9, color: C.textMuted, marginTop: 2 }}>{formatTimeAgo(ev.created_at, t.tools.time)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
