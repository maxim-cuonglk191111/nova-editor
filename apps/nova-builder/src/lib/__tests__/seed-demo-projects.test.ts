import { describe, it, expect } from "vitest";
import { DEMO_SITES, buildProjectSchema } from "../seed/demoProjects";
import { migrateToLatest } from "../migrate";
import { serializeWebstudioData } from "../schema";

const NOW = "2026-10-27T00:00:00.000Z";

type Entry = [string, any];

function instancesOf(doc: { data: Record<string, any> }, component: string): string[] {
  return (doc.data.instances as Entry[]).filter(([, i]) => i.component === component).map(([id]) => id);
}

describe("demo seed projects are readable by the preview path", () => {
  it("has five distinct businesses with unique emails and names", () => {
    expect(DEMO_SITES).toHaveLength(5);
    expect(new Set(DEMO_SITES.map((b) => b.email)).size).toBe(5);
    expect(new Set(DEMO_SITES.map((b) => b.name)).size).toBe(5);
    for (const b of DEMO_SITES) expect(b.email).toMatch(/@nova-demo\.test$/);
  });

  for (const biz of DEMO_SITES) {
    describe(biz.slug, () => {
      const doc = buildProjectSchema(biz, NOW) as { schemaVersion: string; meta: { name: string }; data: Record<string, Entry[] | any> };

      it("round-trips through migrateToLatest and serializeWebstudioData, as /api/preview does", () => {
        const project = migrateToLatest(JSON.parse(JSON.stringify(doc)));
        const serialized = serializeWebstudioData(project.data);
        expect(project.meta.name).toBe(biz.name);
        expect(JSON.stringify(serialized).length).toBeGreaterThan(5000);
      });

      it("is a valid tree: every child exists, one parent each, no cycles, rooted at the Body", () => {
        const instances = new Map<string, any>(doc.data.instances as Entry[]);
        const parents = new Map<string, string>();
        for (const [id, inst] of instances) {
          for (const c of inst.children) {
            if (c.type !== "id") continue;
            expect(instances.has(c.value), `${id} -> ${c.value}`).toBe(true);
            expect(parents.has(c.value), `${c.value} has two parents`).toBe(false);
            parents.set(c.value, id);
          }
        }
        const page = (doc.data.pages.pages as Entry[])[0]![1];
        const root = instances.get(page.rootInstanceId);
        expect(root.component).toBe("Body");
        // walking up from any instance reaches the root without looping
        for (const id of instances.keys()) {
          let cur = id;
          for (let hops = 0; parents.has(cur); hops++) { expect(hops).toBeLessThan(40); cur = parents.get(cur)!; }
          expect(cur).toBe(root.id);
        }
      });

      it("has exactly one h1, and every nav anchor points at a section that has that id", () => {
        const props = (doc.data.props as Entry[]).map(([, p]) => p);
        const instances = new Map<string, any>(doc.data.instances as Entry[]);
        const h1s = props.filter((p) => p.name === "tag" && p.value === "h1" && instances.get(p.instanceId)?.component === "Heading");
        expect(h1s).toHaveLength(1);
        const ids = new Set(props.filter((p) => p.name === "id").map((p) => p.value));
        const anchors = props.filter((p) => p.name === "href" && typeof p.value === "string" && p.value.startsWith("#")).map((p) => p.value.slice(1));
        expect(anchors.length).toBeGreaterThanOrEqual(3);
        for (const a of anchors) expect(ids.has(a), `#${a}`).toBe(true);
      });

      it("only uses Vietnamese Commons photos and styles that reference known breakpoints", () => {
        const props = (doc.data.props as Entry[]).map(([, p]) => p);
        const srcs = props.filter((p) => p.name === "src").map((p) => p.value as string);
        for (const s of srcs) expect(s).toMatch(/^https:\/\/commons\.wikimedia\.org\/wiki\/Special:FilePath\/.+\?width=1280$/);
        // avatars carry a name and no stock face
        const avatars = instancesOf(doc, "shadcn:Avatar");
        for (const id of avatars) expect(props.some((p) => p.instanceId === id && p.name === "src")).toBe(false);
        const bpIds = new Set((doc.data.breakpoints as Entry[]).map(([id]) => id));
        for (const [, decl] of doc.data.styles as Entry[]) expect(bpIds.has(decl.breakpointId)).toBe(true);
        const sources = new Set((doc.data.styleSources as Entry[]).map(([id]) => id));
        for (const [, decl] of doc.data.styles as Entry[]) expect(sources.has(decl.styleSourceId)).toBe(true);
      });

      it("credits its photos in the footer whenever it uses any", () => {
        const props = (doc.data.props as Entry[]).map(([, p]) => p);
        const usesPhotos = props.some((p) => p.name === "src");
        const texts = ((doc.data.instances as Entry[]).flatMap(([, i]) => i.children).filter((c: any) => c.type === "text").map((c: any) => c.value as string));
        expect(texts.some((x) => /Wikimedia Commons/.test(x))).toBe(usesPhotos);
      });
    });
  }

  it("never reuses a photo, on one site or across the five", () => {
    const all: string[] = [];
    for (const biz of DEMO_SITES) {
      const doc = buildProjectSchema(biz, NOW) as { data: Record<string, any> };
      for (const [, p] of doc.data.props as Entry[]) if (p.name === "src") all.push(p.value);
    }
    expect(all.length).toBeGreaterThanOrEqual(6);
    expect(new Set(all).size).toBe(all.length);
  });
});
