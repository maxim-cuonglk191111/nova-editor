// Navbar links point at "#menu", "#about"… but models rarely give the sections a
// matching id, so the links went nowhere. For each in-page link, find the top-level
// section whose label or headings mention the anchor and give it that id.
type WSInstance = { id: string; component: string; label?: string; children: { type: "id" | "text"; value: string }[] };
type WSProp = { id: string; instanceId: string; name: string; type: "string" | "number" | "boolean" | "json"; value: unknown };
type GenId = (prefix: string) => string;

const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/gi, "d").toLowerCase();

/** The section's own label plus the text of every heading inside it. */
function sectionText(byId: Map<string, WSInstance>, sectionId: string): string {
  const parts = [byId.get(sectionId)?.label ?? ""];
  const stack = [sectionId];
  while (stack.length > 0) {
    const inst = byId.get(stack.pop()!);
    if (!inst) continue;
    for (const child of inst.children) {
      if (child.type === "id") stack.push(child.value);
      else if (inst.component === "Heading") parts.push(child.value);
    }
  }
  return fold(parts.join(" "));
}

export function linkNavAnchors(instances: WSInstance[], props: WSProp[], rootIds: string[], genId: GenId): void {
  const byId = new Map(instances.map((i) => [i.id, i]));
  const propOf = (id: string, name: string) => props.find((p) => p.instanceId === id && p.name === name);
  const targets = rootIds.slice(1); // the first section is the navbar
  const texts = new Map(targets.map((id) => [id, sectionText(byId, id)]));
  const taken = new Set<string>();

  for (const link of instances.filter((i) => i.component === "Link")) {
    const href = propOf(link.id, "href");
    const raw = typeof href?.value === "string" ? href.value : "";
    if (!raw.startsWith("#") || raw.length < 2) continue;
    const anchor = raw.slice(1);
    const existing = targets.find((id) => propOf(id, "id")?.value === anchor);
    if (existing) { taken.add(existing); continue; }
    // Whole-word match; short words ("he", "us") only count when the anchor has nothing longer.
    const all = fold(anchor).split(/[^a-z0-9]+/).filter(Boolean);
    const words = all.some((w) => w.length >= 3) ? all.filter((w) => w.length >= 3) : all;
    let match: string | undefined;
    let best = 0;
    for (const id of targets) {
      if (taken.has(id) || propOf(id, "id")) continue;
      const have = new Set(texts.get(id)!.split(/[^a-z0-9]+/));
      const score = words.filter((w) => have.has(w)).length;
      if (score > best) { best = score; match = id; }
    }
    if (!match) continue;
    taken.add(match);
    props.push({ id: genId("prop_"), instanceId: match, name: "id", type: "string", value: anchor });
  }
}
