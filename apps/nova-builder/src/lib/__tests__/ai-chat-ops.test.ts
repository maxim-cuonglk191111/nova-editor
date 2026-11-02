import { describe, it, expect } from "vitest";
import { validateCompositionWS } from "@studio/ai";
import type { EditOp } from "@studio/ai";
import { applyOpsToDraft, demoteH1 } from "../aiChat/applyOps";
import { describeOps } from "../aiChat/describe";

type Child = { type: "id" | "text"; value: string };
const inst = (id: string, component: string, children: Child[] = [], label?: string) => ({ type: "instance" as const, id, component, label, children });
const text = (v: string): Child => ({ type: "text", value: v });
const ref = (id: string): Child => ({ type: "id", value: id });

function draft() {
  const instances = new Map<string, ReturnType<typeof inst>>(
    [
      inst("root", "Body", [ref("s1"), ref("s2")], "Page Root"),
      inst("s1", "Box", [ref("h1"), ref("p1")], "Hero"),
      inst("h1", "Heading", [text("Welcome")]),
      inst("p1", "Paragraph", [text("Fresh coffee")]),
      inst("s2", "Box", [ref("h2")], "Menu"),
      inst("h2", "Heading", [text("Menu")]),
    ].map((i) => [i.id, i])
  );
  const props = new Map<string, unknown>([
    ["pr1", { id: "pr1", instanceId: "h1", name: "tag", type: "string", value: "h1" }],
    ["pr2", { id: "pr2", instanceId: "p1", name: "title", type: "string", value: "old" }],
  ]);
  const styleSources = new Map<string, unknown>([["src1", { id: "src1", type: "local" }]]);
  const styleSourceSelections = new Map<string, unknown>([["s1", { instanceId: "s1", values: ["src1"] }]]);
  const styles = new Map<string, unknown>([["src1:base::color", { styleSourceId: "src1", breakpointId: "base", property: "color", value: { type: "keyword", value: "#111" } }]]);
  return { instances, props, styleSources, styleSourceSelections, styles, pages: {}, breakpoints: new Map(), dataSources: new Map(), resources: new Map(), assets: new Map() } as never;
}

const section = () => validateCompositionWS({ tree: [{ component: "Box", label: "Pricing", text: "", styles: { padding: "40px" }, children: [{ component: "Heading", props: { tag: "h1" }, text: "Plans" }, { component: "Paragraph", text: "Three plans" }] }] });

const run = (d: ReturnType<typeof draft>, ops: EditOp[]) => applyOpsToDraft(d, ops, "root", "base");
const get = (d: ReturnType<typeof draft>, id: string) => (d as unknown as { instances: Map<string, ReturnType<typeof inst>> }).instances.get(id);
const maps = (d: ReturnType<typeof draft>) => d as unknown as { instances: Map<string, ReturnType<typeof inst>>; props: Map<string, { instanceId: string; name: string; value: unknown }>; styles: Map<string, { value: { value: string } }>; styleSources: Map<string, unknown>; styleSourceSelections: Map<string, { values: string[] }> };

describe("applyOpsToDraft", () => {
  it("setText replaces the text of a leaf element only", () => {
    const d = draft();
    const r = run(d, [{ op: "setText", id: "h1", text: "Hello" }, { op: "setText", id: "s1", text: "never" }]);
    expect(r).toEqual({ applied: 1, skipped: 1 });
    expect(get(d, "h1")?.children).toEqual([text("Hello")]);
    expect(get(d, "s1")?.children).toHaveLength(2);
  });

  it("setStyle writes keyword values on the instance's local source, creating it when missing", () => {
    const d = draft();
    run(d, [{ op: "setStyle", id: "s1", styles: { color: "#222", padding: "32px" } }, { op: "setStyle", id: "h1", styles: { fontSize: "40px" } }]);
    const m = maps(d);
    expect(m.styles.get("src1:base::color")?.value.value).toBe("#222");
    expect(m.styles.get("src1:base::padding")?.value.value).toBe("32px");
    const newSource = m.styleSourceSelections.get("h1")!.values[0]!;
    expect(m.styleSources.get(newSource)).toMatchObject({ type: "local" });
    expect(m.styles.get(`${newSource}:base::fontSize`)?.value.value).toBe("40px");
  });

  it("setProp updates an existing prop in place and creates a missing one", () => {
    const d = draft();
    run(d, [{ op: "setProp", id: "p1", name: "title", value: "new" }, { op: "setProp", id: "h1", name: "tag", value: "h2" }, { op: "setProp", id: "h2", name: "alt", value: "x" }]);
    const props = [...maps(d).props.values()];
    expect(props.filter((p) => p.instanceId === "p1" && p.name === "title")).toHaveLength(1);
    expect(props.find((p) => p.instanceId === "p1" && p.name === "title")?.value).toBe("new");
    expect(props.find((p) => p.instanceId === "h1" && p.name === "tag")?.value).toBe("h2");
    expect(props.find((p) => p.instanceId === "h2" && p.name === "alt")?.value).toBe("x");
  });

  it("remove deletes the subtree with its props and styles and detaches it from the parent", () => {
    const d = draft();
    const r = run(d, [{ op: "remove", id: "s1" }, { op: "remove", id: "root" }]);
    const m = maps(d);
    expect(r).toEqual({ applied: 1, skipped: 1 });
    expect([...m.instances.keys()].sort()).toEqual(["h2", "root", "s2"]);
    expect(m.instances.get("root")?.children).toEqual([ref("s2")]);
    expect(m.props.size).toBe(0);
    expect(m.styles.size).toBe(0);
    expect(m.styleSources.size).toBe(0);
    expect(m.styleSourceSelections.has("s1")).toBe(false);
  });

  it("insertSection puts the composed section after the given one, or first, and never adds a second h1", () => {
    const d = draft();
    const r = run(d, [{ op: "insertSection", after: "s1", brief: "pricing", composition: section() }, { op: "insertSection", after: null, brief: "top", composition: section() }]);
    const m = maps(d);
    expect(r.applied).toBe(2);
    const order = m.instances.get("root")!.children.map((c) => c.value);
    expect(order).toHaveLength(4);
    expect(order[1]).toBe("s1");
    expect(order[3]).toBe("s2");
    expect(m.instances.get(order[0]!)?.label).toBe("Pricing");
    expect(m.instances.get(order[2]!)?.label).toBe("Pricing");
    expect([...m.props.values()].filter((p) => p.name === "tag" && p.value === "h1").map((p) => p.instanceId)).toEqual(["h1"]);
  });

  it("replaceSection swaps a section in place", () => {
    const d = draft();
    const r = run(d, [{ op: "replaceSection", id: "s2", brief: "cards", composition: section() }]);
    const m = maps(d);
    expect(r.applied).toBe(1);
    const order = m.instances.get("root")!.children.map((c) => c.value);
    expect(order[0]).toBe("s1");
    expect(m.instances.has("s2")).toBe(false);
    expect(m.instances.has("h2")).toBe(false);
    expect(m.instances.get(order[1]!)?.label).toBe("Pricing");
  });

  it("skips what no longer exists or was never composed", () => {
    const d = draft();
    const r = run(d, [
      { op: "setText", id: "ghost", text: "x" },
      { op: "insertSection", after: "ghost", brief: "x", composition: section() },
      { op: "insertSection", after: "s1", brief: "no composition" },
      { op: "replaceSection", id: "s9", brief: "x", composition: section() },
    ]);
    expect(r).toEqual({ applied: 0, skipped: 4 });
    expect(maps(d).instances.size).toBe(6);
  });
});

describe("demoteH1", () => {
  it("turns h1 headings of an inserted section into h2", () => {
    const c = demoteH1(section());
    expect(c.props.filter((p) => p.name === "tag").map((p) => p.value)).not.toContain("h1");
  });
});

describe("describeOps", () => {
  const instances = maps(draft()).instances as never;
  it("merges texts, styles and props into one line each and keeps structural ops apart", () => {
    const lines = describeOps(
      [
        { op: "setText", id: "h1", text: "A" }, { op: "setText", id: "p1", text: "B" },
        { op: "setStyle", id: "s1", styles: { color: "#111", padding: "8px" } }, { op: "setStyle", id: "h1", styles: { color: "#222" } },
        { op: "remove", id: "s2" },
        { op: "insertSection", after: "s1", brief: "A pricing section" },
        { op: "replaceSection", id: "s2", brief: "Three cards" },
      ],
      instances
    );
    expect(lines.map((l) => [l.kind, l.count])).toEqual([["text", 2], ["style", 2], ["remove", 1], ["insert", 1], ["replace", 1]]);
    expect(lines[0]!.ids).toEqual(["h1", "p1"]);
    expect(lines[1]!.detail).toBe("color, padding");
    expect(lines[2]!.label).toBe("Menu");
    expect(lines[3]).toMatchObject({ label: "A pricing section", ids: ["s1"] });
  });

  it("names a single changed element", () => {
    const [line] = describeOps([{ op: "setText", id: "h1", text: "Hello there" }], instances);
    expect(line).toMatchObject({ kind: "text", count: 1, label: "Welcome", detail: "Hello there" });
  });
});
