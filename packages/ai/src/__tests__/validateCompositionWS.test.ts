import { describe, it, expect } from "vitest";
import { validateCompositionWS } from "../utils/validateCompositionWS.js";

const heading = (id: string, tag: string, text: string) => ({
  id, component: "Heading", label: text, props: { tag }, styles: {}, text, children: [],
});

function h1Texts(raw: unknown): string[] {
  const r = validateCompositionWS(raw);
  const h1Ids = r.props.filter((p) => p.name === "tag" && p.value === "h1").map((p) => p.instanceId);
  return r.instances
    .filter((i) => h1Ids.includes(i.id))
    .map((i) => (i.children.find((c) => c.type === "text")?.value as string) ?? "");
}

describe("validateCompositionWS — ids", () => {
  it("gives nodes that share an AI id distinct instances, each with exactly one parent", () => {
    const input = { id: "dup00001", component: "Paragraph", label: "Field", props: {}, styles: {}, text: "x", children: [] };
    const raw = {
      tree: [
        { id: "hero0001", component: "Box", label: "Hero", props: {}, styles: {}, children: [{ ...input }] },
        { id: "form0001", component: "Box", label: "Form", props: {}, styles: {}, children: [{ ...input }] },
      ],
    };
    const r = validateCompositionWS(raw);
    const ids = r.instances.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
    const parentCount = new Map<string, number>();
    for (const i of r.instances) for (const c of i.children) if (c.type === "id") parentCount.set(c.value, (parentCount.get(c.value) ?? 0) + 1);
    expect([...parentCount.values()].every((n) => n === 1)).toBe(true);
  });
});

describe("validateCompositionWS — h1 guarantee", () => {
  it("promotes the first heading in document order when the page has no h1", () => {
    const raw = {
      tree: [
        { id: "nav00001", component: "Box", label: "Nav", props: {}, styles: {}, children: [heading("brand001", "h3", "Brand")] },
        { id: "sec00001", component: "Box", label: "Hero", props: {}, styles: {}, children: [heading("hero0001", "h2", "Hero title")] },
      ],
    };
    expect(h1Texts(raw)).toEqual(["Brand"]);
  });

  it("leaves an existing h1 untouched", () => {
    const raw = { tree: [heading("a0000001", "h2", "Intro"), heading("b0000001", "h1", "Main")] };
    expect(h1Texts(raw)).toEqual(["Main"]);
  });

  it("makes generated styles fluid (responsive pass runs during validation)", () => {
    const r = validateCompositionWS({
      tree: [{ id: "c0000001", component: "Box", label: "Row", props: {}, styles: { display: "flex" }, children: [] }],
    });
    expect(r.styles.some((s) => s.property === "flexWrap")).toBe(true);
  });
});
