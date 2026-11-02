"use client";
// The first column of the Add tab: the registry's categories as full-width rows (icon tile, name,
// count, chevron), in three groups. Choosing a row opens its thumbnails in the second column.
import { UI_VARS as C, UI_SHAPE as S } from "@/lib/uiTheme";

type Group = { id: "basics" | "interactive" | "more"; categories: string[] };

export const CATEGORY_GROUPS: Group[] = [
  { id: "basics", categories: ["Layout", "Typography", "Display"] },
  { id: "interactive", categories: ["Inputs", "Navigation"] },
  { id: "more", categories: ["Feedback", "Overlay", "Advanced"] },
];

const GLYPH: Record<string, string> = {
  Layout: "▦", Typography: "Aa", Display: "◧", Inputs: "☑", Navigation: "⇢", Feedback: "◔", Overlay: "❐", Advanced: "⚙",
};

type Props = {
  counts: Record<string, number>;
  selected: string | null;
  names: Record<string, string>;
  groupNames: Record<string, string>;
  onSelect: (category: string) => void;
};

export function CategoryList({ counts, selected, names, groupNames, onSelect }: Props) {
  return (
    <nav aria-label={groupNames.basics} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {CATEGORY_GROUPS.map((group) => {
        const rows = group.categories.filter((c) => (counts[c] ?? 0) > 0);
        if (rows.length === 0) return null;
        return (
          <div key={group.id} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.textMuted, fontFamily: C.font, padding: "0 4px" }}>{groupNames[group.id]}</div>
            {rows.map((category) => {
              const active = selected === category;
              return (
                <button
                  key={category}
                  type="button"
                  aria-pressed={active}
                  onClick={() => onSelect(category)}
                  style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", minHeight: 52, padding: "6px 12px 6px 8px", background: active ? C.accentBg : C.card, border: `1px solid ${active ? C.accentBorder : C.border}`, borderRadius: S.radiusMd, cursor: "pointer", fontFamily: C.font, textAlign: "left" }}
                >
                  <span aria-hidden="true" style={{ width: 36, height: 36, flexShrink: 0, display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: S.radiusSm + 2, background: C.surface, border: `1px solid ${C.border}`, color: C.accentText, fontSize: 16, fontWeight: 700 }}>
                    {GLYPH[category] ?? "◇"}
                  </span>
                  <span style={{ flex: 1, fontSize: 15, fontWeight: 600, color: C.text }}>{names[category] ?? category}</span>
                  <span style={{ fontSize: 12, color: C.textMuted }}>{counts[category]}</span>
                  <span aria-hidden="true" style={{ fontSize: 16, color: C.textMuted }}>›</span>
                </button>
              );
            })}
          </div>
        );
      })}
    </nav>
  );
}
