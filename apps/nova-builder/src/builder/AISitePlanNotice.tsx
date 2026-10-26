"use client";
// Shown under the prompt when it describes a multi-page site: which pages will be built,
// what it costs (one generation each), and a way back to a single page.
import { UI_VARS as C } from "@/lib/uiTheme";
import { useI18n, fmt } from "@/lib/i18n";
import type { SitePage, SitePageKey } from "@/lib/aiSitePlan";

type Props = {
  pages: SitePage[];
  nameOf: (key: SitePageKey) => string;
  onePageOnly: boolean;
  onToggle: () => void;
};

export function AISitePlanNotice({ pages, nameOf, onePageOnly, onToggle }: Props) {
  const L = useI18n().t.tools.ai;
  const count = pages.length;
  return (
    <div role="status" style={{ padding: "10px 12px", borderRadius: 8, border: `1px solid ${C.accentBorder}`, background: C.accentBg, display: "flex", flexDirection: "column", gap: 6 }}>
      {!onePageOnly && (
        <>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.accentText }}>{fmt(L.siteNoticeTitle, { count })}</div>
          <div style={{ fontSize: 12, color: C.textMuted, lineHeight: 1.5 }}>
            {fmt(L.siteNoticeBody, { pages: pages.map((p) => `${nameOf(p.key)} (${p.path})`).join(", "), count })}
          </div>
        </>
      )}
      <button
        onClick={onToggle}
        style={{ alignSelf: "flex-start", background: "none", border: "none", padding: 0, color: C.accentText, fontSize: 12, fontFamily: C.font, fontWeight: 700, cursor: "pointer", textDecoration: "underline" }}
      >
        {onePageOnly ? fmt(L.siteAllPages, { count }) : L.siteOnePage}
      </button>
    </div>
  );
}
