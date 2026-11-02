// The prompt for the second AI step of a chat edit: building one new section. The edit agent
// writes a short brief; the page composer (curated images, vetted components) builds it. The
// prompt asks for a single section that looks like the page it joins, so the existing colours
// and fonts are read off the context and stated.
import type { EditContext, EditOp } from "@studio/ai";

type SectionOp = Extract<EditOp, { op: "insertSection" | "replaceSection" }>;

const LOOK_PROPERTIES = ["backgroundColor", "color", "fontFamily"] as const;

/** The most common value of each look property across the page, e.g. { color: "#1f2937" }. */
export function pageLook(ctx: EditContext): Partial<Record<(typeof LOOK_PROPERTIES)[number], string>> {
  const look: Partial<Record<(typeof LOOK_PROPERTIES)[number], string>> = {};
  for (const prop of LOOK_PROPERTIES) {
    const counts = new Map<string, number>();
    for (const node of ctx.nodes) {
      const v = node.styles?.[prop];
      if (v) counts.set(v, (counts.get(v) ?? 0) + 1);
    }
    const best = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
    if (best) look[prop] = best[0];
  }
  return look;
}

export function sectionPrompt(op: SectionOp, ctx: EditContext, requestLanguageHint: string): string {
  const look = pageLook(ctx);
  const lookLine = Object.entries(look).map(([k, v]) => `${k} ${v}`).join(", ");
  return [
    `Compose ONE section of an existing website page, not a whole page: ${op.brief}`,
    "Output a tree with a single top-level Box that is the section. No navbar, no footer, no page-wide wrapper, and no h1 (use h2 for the section title).",
    lookLine ? `Match the look of the rest of the page: ${lookLine}.` : "",
    `The page is called "${ctx.pageName}".`,
    requestLanguageHint,
  ].filter(Boolean).join("\n");
}
