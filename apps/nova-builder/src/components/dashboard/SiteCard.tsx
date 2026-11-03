"use client";
// One site on the dashboard: open it, rename it in place, and labelled actions
// (visits, form messages, duplicate, delete) — icons alone were not understood.
import { useState } from "react";
import { useI18n, fmt, formatTimeAgo, type I18nTimeAgoDictionary } from "@/lib/i18n";
import { UI_VARS as C } from "@/lib/uiTheme";
import { Icon } from "@/builder/icons";

export type Site = { id: string; name: string; updatedAt: string | null; thumbnail?: string | null };

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
  height: 34, padding: "0 12px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.card,
  color: danger ? C.danger : C.textDim, fontSize: 13, fontFamily: C.font, cursor: "pointer", whiteSpace: "nowrap",
  display: "inline-flex", alignItems: "center", gap: 6,
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
        background: C.card, border: `1px solid ${hovered ? C.borderHover : C.border}`, borderRadius: 18,
        padding: "0 0 16px", display: "flex", flexDirection: "column", transition: "border-color 0.15s, box-shadow 0.15s",
        boxShadow: hovered ? C.shadowPop : C.shadowSoft, cursor: "pointer", overflow: "hidden",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={renaming ? undefined : actions.open}
    >
      <div style={{ width: "100%", height: 150, background: `linear-gradient(135deg, ${C.accentBg} 0%, ${C.surface} 100%)`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14, flexShrink: 0, overflow: "hidden", color: C.accentText }}>
        {site.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={site.thumbnail}
            alt={site.name}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <Icon name="site" size={44} weight="duotone" />
        )}
      </div>

      <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
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
            style={{ fontSize: 16, fontWeight: 600, color: C.text, background: C.card, border: `1px solid ${C.accentBorder}`, borderRadius: 10, height: 36, padding: "0 10px", fontFamily: C.font, outline: "none" }}
          />
        ) : (
          <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: "-0.01em", color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={site.name}>
            {site.name}
          </div>
        )}
        <div style={{ fontSize: 13, color: C.textMuted }}>
          {site.updatedAt ? fmt(P.edited, { time: timeAgo(site.updatedAt, t.tools.time) }) : P.neverSaved}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 12 }} onClick={(e) => e.stopPropagation()}>
          <button
            onClick={actions.open}
            style={{ height: 42, borderRadius: 12, border: "none", background: C.primary, color: C.onPrimary, fontSize: 15, fontFamily: C.font, fontWeight: 700, cursor: "pointer" }}
          >
            {P.edit}
          </button>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            <button onClick={() => { setDraft(site.name); setRenaming(true); }} title={P.renameLabel} style={chip()}><Icon name="edit" size={16} />{P.rename}</button>
            <button onClick={actions.analytics} title={P.viewAnalytics} style={chip()}><Icon name="analytics" size={16} />{P.visits}</button>
            <button onClick={actions.leads} title={P.viewSubmissions} style={chip()}><Icon name="mail" size={16} />{P.messages}</button>
            <button onClick={actions.clone} disabled={isCloning} title={P.duplicate} style={{ ...chip(), opacity: isCloning ? 0.5 : 1, cursor: isCloning ? "default" : "pointer" }}><Icon name="copy" size={16} />{P.copy}</button>
            <button onClick={actions.remove} title={P.deleteSite} style={chip(true)}><Icon name="trash" size={16} />{P.remove}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
