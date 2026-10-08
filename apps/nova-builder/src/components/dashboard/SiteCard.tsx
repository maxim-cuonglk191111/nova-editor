"use client";
// One site on the dashboard: open it, rename it in place, and labelled actions
// (visits, form messages, duplicate, delete) — icons alone were not understood.
import { useState } from "react";
import { useI18n, fmt, formatTimeAgo, type I18nTimeAgoDictionary } from "@/lib/i18n";
import { UI_VARS as C } from "@/lib/uiTheme";

export type Site = { id: string; name: string; updatedAt: string | null };

export type SiteCardActions = {
  open: () => void;
  rename: (name: string) => Promise<void>;
  analytics: () => void;
  leads: () => void;
  clone: () => void;
  remove: () => void;
};

function timeAgo(iso: string | null, d: I18nTimeAgoDictionary): string {
  if (!iso) return "";
  const days = (Date.now() - new Date(iso).getTime()) / 86_400_000;
  return days < 30 ? formatTimeAgo(iso, d) : new Date(iso).toLocaleDateString();
}

const chip = (danger = false): React.CSSProperties => ({
  padding: "4px 8px", borderRadius: 6, border: `1px solid ${C.border}`, background: "transparent",
  color: danger ? C.danger : C.textMuted, fontSize: 12, fontFamily: C.font, cursor: "pointer", whiteSpace: "nowrap",
});

export function SiteCard({ site, actions, isCloning }: { site: Site; actions: SiteCardActions; isCloning: boolean }) {
  const { t } = useI18n();
  const P = t.dashboard.projects;
  const [hovered, setHovered] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [draft, setDraft] = useState(site.name);

  async function commitRename() {
    const name = draft.trim();
    setRenaming(false);
    if (name && name !== site.name) await actions.rename(name);
    else setDraft(site.name);
  }

  return (
    <div
      style={{
        background: C.surface, border: `1px solid ${hovered ? C.borderHover : C.border}`, borderRadius: 12,
        padding: "0 0 14px", display: "flex", flexDirection: "column", transition: "border-color 0.15s, box-shadow 0.15s",
        boxShadow: hovered ? "0 4px 20px rgba(0,0,0,0.3)" : "none", cursor: "pointer", overflow: "hidden",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={renaming ? undefined : actions.open}
    >
      <div style={{ width: "100%", height: 120, background: "linear-gradient(135deg, rgba(124,58,237,0.12) 0%, rgba(79,70,229,0.06) 100%)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12, flexShrink: 0 }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" style={{ opacity: 0.2 }}>
          <rect x="2" y="3" width="20" height="14" rx="2" stroke="white" strokeWidth="1.5" />
          <path d="M8 21h8M12 17v4" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M5 7h14M5 11h8" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>

      <div style={{ padding: "0 14px", display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
        {renaming ? (
          <input
            autoFocus
            aria-label={P.renameLabel}
            value={draft}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.currentTarget.blur();
              if (e.key === "Escape") { setDraft(site.name); setRenaming(false); }
            }}
            style={{ fontSize: 13, fontWeight: 600, color: C.text, background: C.bg, border: `1px solid ${C.accent}`, borderRadius: 6, padding: "3px 6px", fontFamily: C.font, outline: "none" }}
          />
        ) : (
          <div style={{ fontSize: 13, fontWeight: 600, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={site.name}>
            {site.name}
          </div>
        )}
        <div style={{ fontSize: 13, color: C.textMuted }}>
          {site.updatedAt ? fmt(P.edited, { time: timeAgo(site.updatedAt, t.tools.time) }) : P.neverSaved}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }} onClick={(e) => e.stopPropagation()}>
          <button
            onClick={actions.open}
            style={{ padding: "5px 0", borderRadius: 6, border: "none", background: C.accent, color: "#fff", fontSize: 13, fontFamily: C.font, fontWeight: 600, cursor: "pointer" }}
          >
            {P.edit}
          </button>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            <button onClick={() => { setDraft(site.name); setRenaming(true); }} title={P.renameLabel} style={chip()}>✎ {P.rename}</button>
            <button onClick={actions.analytics} title={P.viewAnalytics} style={chip()}>◑ {P.visits}</button>
            <button onClick={actions.leads} title={P.viewSubmissions} style={chip()}>✉ {P.messages}</button>
            <button onClick={actions.clone} disabled={isCloning} title={P.duplicate} style={{ ...chip(), opacity: isCloning ? 0.5 : 1, cursor: isCloning ? "default" : "pointer" }}>⧉ {P.copy}</button>
            <button onClick={actions.remove} title={P.deleteSite} style={chip(true)}>✕ {P.remove}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
