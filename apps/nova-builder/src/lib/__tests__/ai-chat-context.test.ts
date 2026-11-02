import { describe, it, expect } from "vitest";
import { buildEditContext, parentMap, sectionOf, MAX_CONTEXT_NODES, type DocView } from "../aiChat/context";

type Child = { type: "id" | "text"; value: string };
const inst = (id: string, component: string, children: Child[] = [], label?: string) => ({ type: "instance" as const, id, component, label, children });
const text = (v: string): Child => ({ type: "text", value: v });
const ref = (id: string): Child => ({ type: "id", value: id });

function doc(): DocView {
  const instances = new Map(
    [
      inst("root", "Body", [ref("s1"), ref("s2")], "Page Root"),
      inst("s1", "Box", [ref("h1"), ref("p1"), ref("btn")], "Hero"),
      inst("h1", "Heading", [text("Welcome to the café")]),
      inst("p1", "Paragraph", [text("Fresh coffee every morning")]),
      inst("btn", "shadcn:Button", [text("Order")], "Order button"),
      inst("s2", "Box", [ref("h2")], "Menu"),
      inst("h2", "Heading", [text("Menu")]),
    ].map((i) => [i.id, i])
  );
  const props = new Map([
    ["pr1", { id: "pr1", instanceId: "h1", name: "tag", type: "string", value: "h1" }],
    ["pr2", { id: "pr2", instanceId: "btn", name: "href", type: "string", value: "#menu" }],
  ]);
  const styles = new Map([
    ["src1:base::backgroundColor", { styleSourceId: "src1", breakpointId: "base", property: "backgroundColor", value: { type: "color", value: { r: 255, g: 247, b: 237, alpha: 1 } } }],
    ["src1:base::padding", { styleSourceId: "src1", breakpointId: "base", property: "padding", value: { type: "unit", value: 48, unit: "px" } }],
    ["src1:base::color", { styleSourceId: "src1", breakpointId: "base", property: "color", value: { type: "keyword", value: "#1f2937" } }],
  ]);
  const styleSourceSelections = new Map([["s1", { instanceId: "s1", values: ["src1"] }]]);
  return { instances, props, styles, styleSourceSelections } as unknown as DocView;
}

const page = { id: "p", name: "Home", rootInstanceId: "root" };

describe("buildEditContext", () => {
  it("an element selected: scope element, its section is the context, chips name both", () => {
    const { ref: chips, context } = buildEditContext(doc(), page, "h1", "base");
    expect(context.scope).toBe("element");
    expect(context.targetId).toBe("h1");
    expect(chips).toMatchObject({ scope: "element", targetId: "h1", sectionId: "s1", sectionLabel: "Hero", pageName: "Home" });
    expect(context.nodes.map((n) => n.id)).toEqual(["s1", "h1", "p1", "btn"]);
    expect(context.sections).toEqual([{ id: "s1", label: "Hero" }, { id: "s2", label: "Menu" }]);
    expect(context.rootId).toBe("root");
  });

  it("a section selected: scope section", () => {
    const { ref: chips, context } = buildEditContext(doc(), page, "s2", "base");
    expect(context.scope).toBe("section");
    expect(chips.targetId).toBe("s2");
    expect(context.nodes.map((n) => n.id)).toEqual(["s2", "h2"]);
  });

  it("nothing (or the page root) selected: the whole page", () => {
    for (const sel of [undefined, "root", "unknown"]) {
      const { context } = buildEditContext(doc(), page, sel, "base");
      expect(context.scope).toBe("page");
      expect(context.targetId).toBeUndefined();
      expect(context.nodes.map((n) => n.id)).toEqual(["root", "s1", "h1", "p1", "btn", "s2", "h2"]);
    }
  });

  it("removing chips only widens the scope", () => {
    expect(buildEditContext(doc(), page, "h1", "base", "section").context.scope).toBe("section");
    expect(buildEditContext(doc(), page, "h1", "base", "section").ref.targetId).toBe("s1");
    expect(buildEditContext(doc(), page, "h1", "base", "page").context.scope).toBe("page");
    expect(buildEditContext(doc(), page, "s1", "base", "element").context.scope).toBe("section");
  });

  it("carries text, a few props and a few readable styles, and nothing else", () => {
    const { context } = buildEditContext(doc(), page, "s1", "base");
    const byId = new Map(context.nodes.map((n) => [n.id, n]));
    expect(byId.get("h1")).toMatchObject({ component: "Heading", text: "Welcome to the café", props: { tag: "h1" } });
    expect(byId.get("btn")).toMatchObject({ label: "Order button", text: "Order", props: { href: "#menu" } });
    expect(byId.get("s1")?.text).toBeUndefined();
    expect(byId.get("s1")?.styles).toEqual({ backgroundColor: "rgb(255, 247, 237)", padding: "48px", color: "#1f2937" });
  });

  it("cuts a long page at MAX_CONTEXT_NODES", () => {
    const d = doc();
    const kids: Child[] = [];
    for (let i = 0; i < MAX_CONTEXT_NODES + 40; i++) {
      d.instances.set(`n${i}`, inst(`n${i}`, "Paragraph", [text(`t${i}`)]) as never);
      kids.push(ref(`n${i}`));
    }
    d.instances.set("s1", inst("s1", "Box", kids, "Hero") as never);
    expect(buildEditContext(d, page, undefined, "base").context.nodes).toHaveLength(MAX_CONTEXT_NODES);
  });
});

describe("tree helpers", () => {
  it("finds the top-level section of any element", () => {
    const d = doc();
    const parents = parentMap(d.instances);
    expect(sectionOf("btn", "root", parents)).toBe("s1");
    expect(sectionOf("s2", "root", parents)).toBe("s2");
    expect(sectionOf("root", "root", parents)).toBeUndefined();
  });
});
