import { describe, it, expect } from "vitest";
import { validateCompositionWS } from "@studio/ai";
import type { EditOp } from "@studio/ai";
import { applyOpsToDraft } from "../aiChat/applyOps";
import { checksFor, stillApplied } from "../aiChat/appliedChecks";
import type { DocView } from "../aiChat/context";

type Child = { type: "id" | "text"; value: string };
const inst = (id: string, component: string, children: Child[] = [], label?: string) => ({ type: "instance" as const, id, component, label, children });
const text = (v: string): Child => ({ type: "text", value: v });
const ref = (id: string): Child => ({ type: "id", value: id });

function doc() {
  return {
    instances: new Map<string, unknown>([
      ["root", inst("root", "Body", [ref("s1"), ref("s2")])],
      ["s1", inst("s1", "Box", [ref("h1")], "Hero")],
      ["h1", inst("h1", "Heading", [text("Welcome")])],
      ["s2", inst("s2", "Box", [], "Menu")],
    ]),
    props: new Map<string, unknown>([["p1", { id: "p1", instanceId: "h1", name: "title", type: "string", value: "old" }]]),
    styles: new Map<string, unknown>(),
    styleSources: new Map<string, unknown>(),
    styleSourceSelections: new Map<string, unknown>(),
    pages: {}, breakpoints: new Map(), dataSources: new Map(), resources: new Map(), assets: new Map(),
  };
}

const view = (d: ReturnType<typeof doc>) => d as unknown as DocView;
const apply = (d: ReturnType<typeof doc>, ops: EditOp[]) => applyOpsToDraft(d as never, ops, "root", "base");
const section = () => validateCompositionWS({ tree: [{ component: "Box", label: "New", children: [{ component: "Heading", text: "Fresh", props: { tag: "h2" } }] }] });

describe("applied checks: does the change still hold in the document?", () => {
  it("true after Apply, false once the document is back to what it was (Ctrl+Z), true again after redo", () => {
    const ops: EditOp[] = [
      { op: "setText", id: "h1", text: "Hello" },
      { op: "setStyle", id: "s1", styles: { color: "#222" } },
      { op: "setProp", id: "h1", name: "title", value: "new" },
      { op: "remove", id: "s2" },
      { op: "insertSection", after: "s1", brief: "x", composition: section() },
    ];
    const before = doc();
    const after = doc();
    apply(after, ops);
    const checks = checksFor(ops);
    expect(checks.length).toBeGreaterThanOrEqual(5);
    expect(stillApplied(checks, view(after), "base")).toBe(true);
    expect(stillApplied(checks, view(before), "base")).toBe(false); // undone
    expect(stillApplied(checks, view(after), "base")).toBe(true); // redone
  });

  it("stays true while any effect is left, for example when only one of several texts was edited back by hand", () => {
    const ops: EditOp[] = [{ op: "setText", id: "h1", text: "A" }, { op: "remove", id: "s2" }];
    const d = doc();
    apply(d, ops);
    (d.instances as Map<string, unknown>).set("s2", inst("s2", "Box", [], "Menu")); // the section came back, the text is still new
    expect(stillApplied(checksFor(ops), view(d), "base")).toBe(true);
  });

  it("replaceSection counts the old section being gone and the new one being present", () => {
    const ops: EditOp[] = [{ op: "replaceSection", id: "s2", brief: "x", composition: section() }];
    const d = doc();
    apply(d, ops);
    const checks = checksFor(ops);
    expect(checks.map((c) => c.k)).toEqual(["gone", "present"]);
    expect(stillApplied(checks, view(d), "base")).toBe(true);
    expect(stillApplied(checks, view(doc()), "base")).toBe(false);
  });

  it("nothing recorded means nothing to contradict", () => {
    expect(stillApplied(undefined, view(doc()), "base")).toBe(true);
    expect(stillApplied([], view(doc()), "base")).toBe(true);
  });

  it("keeps the list short", () => {
    const ops: EditOp[] = Array.from({ length: 30 }, (_, i) => ({ op: "setStyle" as const, id: "s1", styles: { color: `#${i}`, padding: "1px", margin: "2px" } }));
    expect(checksFor(ops).length).toBeLessThanOrEqual(40);
  });
});
