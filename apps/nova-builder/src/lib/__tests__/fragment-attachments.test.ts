import { describe, it, expect } from "vitest";
import type { Instance, Prop, StyleDecl, StyleSource, StyleSourceSelection } from "@webstudio-is/sdk";
import { collectFragment, cloneAttachments } from "../fragment-attachments";

const inst = (id: string, children: string[] = []): Instance =>
  ({ type: "instance", id, component: "Box", children: children.map((value) => ({ type: "id", value })) }) as Instance;

const doc = {
  instances: new Map([["root", inst("root", ["a"])], ["a", inst("a", ["b"])], ["b", inst("b")]]),
  props: new Map<string, Prop>([["p1", { id: "p1", instanceId: "b", name: "href", type: "string", value: "#menu" } as Prop]]),
  styleSources: new Map<string, StyleSource>([
    ["local-b", { id: "local-b", type: "local" }],
    ["tok", { id: "tok", type: "token", name: "Brand" } as StyleSource],
  ]),
  styleSourceSelections: new Map<string, StyleSourceSelection>([["b", { instanceId: "b", values: ["tok", "local-b"] }]]),
  styles: new Map<string, StyleDecl>([
    ["local-b:bp::color", { styleSourceId: "local-b", breakpointId: "bp", property: "color", value: { type: "keyword", value: "red" } } as StyleDecl],
    ["tok:bp::fontWeight", { styleSourceId: "tok", breakpointId: "bp", property: "fontWeight", value: { type: "keyword", value: "bold" } } as StyleDecl],
  ]),
};

describe("fragment attachments", () => {
  it("collects only the subtree's props and styles", () => {
    const f = collectFragment("a", doc);
    expect([...f.instances.keys()].sort()).toEqual(["a", "b"]);
    expect(f.props.size).toBe(1);
    expect(f.styles.size).toBe(2);
  });

  it("re-keys props and local styles onto the clone, keeps shared tokens", () => {
    const f = collectFragment("a", doc);
    const att = cloneAttachments(f, new Map([["a", "a2"], ["b", "b2"]]), doc.styleSources);
    const prop = [...att.props.values()][0]!;
    expect(prop.instanceId).toBe("b2");
    expect(prop.id).not.toBe("p1");
    const sel = att.styleSourceSelections.get("b2")!;
    expect(sel.values[0]).toBe("tok");
    expect(sel.values[1]).not.toBe("local-b");
    expect(att.styleSources.get(sel.values[1]!)?.type).toBe("local");
    const styles = [...att.styles.values()];
    expect(styles).toHaveLength(1);
    expect(styles[0]!.styleSourceId).toBe(sel.values[1]);
  });

  it("drops tokens the target project does not have", () => {
    const att = cloneAttachments(collectFragment("a", doc), new Map([["a", "a2"], ["b", "b2"]]), new Map());
    expect(att.styleSourceSelections.get("b2")!.values).toHaveLength(1);
  });
});
