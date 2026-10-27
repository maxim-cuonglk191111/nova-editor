import { describe, it, expect } from "vitest";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { DEMO_SITES, PLACEHOLDER_CONTEXT, buildProjectSchema } from "../seed/demoProjects";
import { PAYOS_PRICES_VND } from "../billing/payos";
import { migrateToLatest } from "../migrate";
import { serializeWebstudioData } from "../schema";

const NOW = "2026-10-27T00:00:00.000Z";

type Entry = [string, any];

function instancesOf(doc: { data: Record<string, any> }, component: string): string[] {
  return (doc.data.instances as Entry[]).filter(([, i]) => i.component === component).map(([id]) => id);
}

describe("demo seed projects are readable by the preview path", () => {
  it("has distinct sites with unique emails, names and slugs", () => {
    expect(DEMO_SITES.length).toBeGreaterThanOrEqual(6);
    expect(new Set(DEMO_SITES.map((b) => b.email)).size).toBe(DEMO_SITES.length);
    expect(new Set(DEMO_SITES.map((b) => b.name)).size).toBe(DEMO_SITES.length);
    expect(new Set(DEMO_SITES.map((b) => b.slug)).size).toBe(DEMO_SITES.length);
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

      it("only uses Commons photos or the site's own uploaded assets, and styles that reference known breakpoints", () => {
        const props = (doc.data.props as Entry[]).map(([, p]) => p);
        const srcs = props.filter((p) => p.name === "src").map((p) => p.value as string);
        const own = new RegExp(`^${PLACEHOLDER_CONTEXT.assetBase.replace(/[.]/g, "\\.")}/${biz.slug}/[\\w.-]+$`);
        for (const s of srcs) {
          const isCommons = /^https:\/\/commons\.wikimedia\.org\/wiki\/Special:FilePath\/.+\?width=1280$/.test(s);
          expect(isCommons || own.test(s), s).toBe(true);
        }
        // every own asset a tree points at is declared, so the seed script uploads it
        for (const s of srcs.filter((x) => own.test(x))) expect(biz.assets ?? [], s).toContain(s.split("/").pop());
        // every avatar has a portrait and a name (the name is the fallback initials)
        const avatars = instancesOf(doc, "shadcn:Avatar");
        for (const id of avatars) {
          expect(props.some((p) => p.instanceId === id && p.name === "src")).toBe(true);
          expect(props.some((p) => p.instanceId === id && p.name === "name")).toBe(true);
        }
        const bpIds = new Set((doc.data.breakpoints as Entry[]).map(([id]) => id));
        for (const [, decl] of doc.data.styles as Entry[]) expect(bpIds.has(decl.breakpointId)).toBe(true);
        const sources = new Set((doc.data.styleSources as Entry[]).map(([id]) => id));
        for (const [, decl] of doc.data.styles as Entry[]) expect(sources.has(decl.styleSourceId)).toBe(true);
      });

      it("carries no licence or credit lines in its copy", () => {
        const texts = ((doc.data.instances as Entry[]).flatMap(([, i]) => i.children).filter((c: any) => c.type === "text").map((c: any) => c.value as string));
        expect(texts.some((x) => /Wikimedia|CC BY|phạm vi công cộng/i.test(x))).toBe(false);
      });
    });
  }

  it("marks exactly the five paying customers, all on a plan the price table knows", () => {
    const buyers = DEMO_SITES.filter((b) => b.purchase).map((b) => b.slug).sort();
    expect(buyers).toEqual(["hung-le", "mai-viet", "noi-nham", "ovemo", "vyvy"]);
    for (const b of DEMO_SITES) if (b.purchase) expect(PAYOS_PRICES_VND[b.purchase.plan]).toBeGreaterThan(0);
  });

  it("ships every declared asset file next to the seed script", () => {
    for (const biz of DEMO_SITES) for (const f of biz.assets ?? []) expect(existsSync(join(__dirname, "../../../scripts/seed-assets", biz.slug, f)), `${biz.slug}/${f}`).toBe(true);
  });

  it("never reuses a photo, on one site or across all of them", () => {
    const all: string[] = [];
    for (const biz of DEMO_SITES) {
      const doc = buildProjectSchema(biz, NOW) as { data: Record<string, any> };
      for (const [, p] of doc.data.props as Entry[]) if (p.name === "src") all.push(p.value);
    }
    expect(all.length).toBeGreaterThanOrEqual(6);
    expect(new Set(all).size).toBe(all.length);
  });
});
