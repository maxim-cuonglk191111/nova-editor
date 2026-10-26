import { describe, it, expect } from "vitest";
import type { Instance, Instances } from "@webstudio-is/sdk";
import { acceptsChildren, checkDirectNesting, checkNesting, VOID_COMPONENTS } from "../nestingGuard";
import { canAcceptChildren } from "../treeMove";

const inst = (id: string, component: string, childIds: string[] = []): Instance => ({
  type: "instance",
  id,
  component,
  children: childIds.map((value) => ({ type: "id" as const, value })),
});

describe("void components never receive children (React error #137)", () => {
  it.each(["Image", "Input", "Checkbox", "RadioButton", "Separator"])("%s is void and rejects children", (name) => {
    expect(VOID_COMPONENTS.has(name)).toBe(true);
    expect(acceptsChildren(name)).toBe(false);
    expect(checkDirectNesting(name, "Button")?.code).toBe("void");
  });

  it("checkNesting blocks a Button dropped into an Image", () => {
    const instances: Instances = new Map([
      ["card", inst("card", "Box", ["img"])],
      ["img", inst("img", "Image")],
    ]);
    expect(checkNesting("img", "Button", instances)?.code).toBe("void");
    expect(checkNesting("card", "Button", instances)).toBeNull();
  });

  it("text-only components still reject children", () => {
    expect(checkDirectNesting("Heading", "Span")?.code).toBe("text-only");
  });

  it("treeMove.canAcceptChildren agrees with the guard", () => {
    for (const name of ["Image", "Input", "Heading", "Box", "Button"]) {
      expect(canAcceptChildren(name)).toBe(acceptsChildren(name));
    }
  });
});
