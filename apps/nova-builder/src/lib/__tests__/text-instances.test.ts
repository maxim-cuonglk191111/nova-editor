import { describe, it, expect } from "vitest";
import type { Instance, Prop } from "@webstudio-is/sdk";
import { collectTextInstances, isWithin, MAX_FILL_TEXTS } from "../textInstances";
import { componentName } from "../i18n/componentName";

const inst = (id: string, children: Instance["children"]): [string, Instance] =>
  [id, { type: "instance", id, component: "Box", children }];

describe("collectTextInstances", () => {
  const instances = new Map<string, Instance>([
    inst("root", [{ type: "id", value: "hero" }, { type: "id", value: "menu" }]),
    inst("hero", [{ type: "id", value: "h1" }]),
    inst("h1", [{ type: "text", value: "Welcome" }]),
    inst("menu", [{ type: "id", value: "item" }, { type: "id", value: "rich" }]),
    inst("item", [{ type: "text", value: "Espresso" }]),
    inst("rich", [{ type: "text", value: "Mixed " }, { type: "id", value: "bold" }]),
    inst("bold", [{ type: "text", value: "bold" }]),
  ]);

  it("returns leaf texts of the whole page in document order", () => {
    expect(collectTextInstances(instances, "root").map((t) => t.currentText)).toEqual(["Welcome", "Espresso", "bold"]);
  });

  it("limits the fill to the selected section", () => {
    expect(collectTextInstances(instances, "menu").map((t) => t.instanceId)).toEqual(["item", "bold"]);
  });

  it("includes field placeholders when props are given", () => {
    const props = new Map<string, Prop>([
      ["p1", { id: "p1", instanceId: "item", name: "placeholder", type: "string", value: "Your name" }],
      ["p2", { id: "p2", instanceId: "item", name: "name", type: "string", value: "name" }],
    ]);
    expect(collectTextInstances(instances, "menu", props).map((t) => t.instanceId)).toEqual(["item", "item::placeholder", "bold"]);
  });

  it("knows which elements belong to the page", () => {
    expect(isWithin(instances, "root", "bold")).toBe(true);
    expect(isWithin(instances, "menu", "h1")).toBe(false);
  });

  it("caps very large pages", () => {
    const many = new Map<string, Instance>([inst("root", Array.from({ length: 200 }, (_, i) => ({ type: "id" as const, value: `t${i}` })))]);
    for (let i = 0; i < 200; i++) many.set(...inst(`t${i}`, [{ type: "text", value: `text ${i}` }]));
    expect(collectTextInstances(many, "root")).toHaveLength(MAX_FILL_TEXTS);
  });
});

describe("componentName", () => {
  it("prefers the dictionary, then the fallback, then the id without its prefix", () => {
    expect(componentName("shadcn:Button", { "shadcn:Button": "Nút" })).toBe("Nút");
    expect(componentName("shadcn:Card", {}, "Card")).toBe("Card");
    expect(componentName("shadcn:Kbd", {})).toBe("Kbd");
  });
});
