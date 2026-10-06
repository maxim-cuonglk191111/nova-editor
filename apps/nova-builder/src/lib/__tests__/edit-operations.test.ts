import { describe, it, expect } from "vitest";
import type { Instance, Instances } from "@webstudio-is/sdk";
import { deleteInstance } from "../edit-operations";

const box = (id: string, kids: string[] = []): Instance => ({
  type: "instance",
  id,
  component: "Box",
  children: kids.map((value) => ({ type: "id" as const, value })),
});

const tree = (): Instances =>
  new Map([
    ["root", box("root", ["a", "b", "c"])],
    ["a", box("a")],
    ["b", box("b")],
    ["c", box("c")],
  ]);

describe("deleteInstance nextSelectedId", () => {
  it("selects the next sibling", () => {
    expect(deleteInstance("a", tree()).nextSelectedId).toBe("b");
  });

  it("selects the previous sibling when the last child is deleted", () => {
    expect(deleteInstance("c", tree()).nextSelectedId).toBe("b");
  });

  it("selects the parent when the only child is deleted", () => {
    const instances: Instances = new Map([
      ["root", box("root", ["only"])],
      ["only", box("only")],
    ]);
    expect(deleteInstance("only", instances).nextSelectedId).toBe("root");
  });

  it("does not delete the root", () => {
    const result = deleteInstance("root", tree());
    expect(result.deleted).toBe(false);
    expect(result.nextSelectedId).toBeUndefined();
  });
});
