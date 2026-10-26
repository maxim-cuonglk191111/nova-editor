import { describe, it, expect } from "vitest";
import { edgeThreshold } from "../treeMove";

describe("edgeThreshold", () => {
  it("is a thin band on large containers (was ~75px on a 300px card)", () => {
    expect(edgeThreshold(363, 300)).toBe(8);
    expect(edgeThreshold(1200, 800)).toBe(8);
  });

  it("scales down on small containers but never below 4px", () => {
    expect(edgeThreshold(40, 30)).toBe(6);
    expect(edgeThreshold(12, 12)).toBe(4);
  });

  it("always leaves a usable interior", () => {
    for (const [w, h] of [[20, 20], [60, 40], [363, 300]] as const) {
      expect(w - 2 * edgeThreshold(w, h)).toBeGreaterThan(0);
      expect(h - 2 * edgeThreshold(w, h)).toBeGreaterThan(0);
    }
  });
});
