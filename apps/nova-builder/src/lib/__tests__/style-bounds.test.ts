import { describe, it, expect } from "vitest";
import { clampNumericStyleValue } from "../styleWriteHelper";

describe("clampNumericStyleValue", () => {
  it("clamps catastrophic negative margin to -2000px", () => {
    expect(clampNumericStyleValue("margin", -99999, "px")).toBe(-2000);
    expect(clampNumericStyleValue("marginTop", -5000, "px")).toBe(-2000);
    expect(clampNumericStyleValue("marginBottom", 10000, "px")).toBe(2000);
  });

  it("clamps percentage margin to [-200%, 200%]", () => {
    expect(clampNumericStyleValue("margin", -999, "%")).toBe(-200);
    expect(clampNumericStyleValue("marginLeft", 500, "%")).toBe(200);
  });

  it("prevents negative padding", () => {
    expect(clampNumericStyleValue("padding", -50, "px")).toBe(0);
    expect(clampNumericStyleValue("paddingLeft", -10, "px")).toBe(0);
    expect(clampNumericStyleValue("padding", 24, "px")).toBe(24);
  });

  it("prevents negative dimensions (width, height, minWidth, etc.)", () => {
    expect(clampNumericStyleValue("width", -100, "px")).toBe(0);
    expect(clampNumericStyleValue("height", -50, "px")).toBe(0);
    expect(clampNumericStyleValue("gap", -16, "px")).toBe(0);
    expect(clampNumericStyleValue("borderRadius", -8, "px")).toBe(0);
  });

  it("clamps fontSize to [0, 500]", () => {
    expect(clampNumericStyleValue("fontSize", -12, "px")).toBe(0);
    expect(clampNumericStyleValue("fontSize", 600, "px")).toBe(500);
    expect(clampNumericStyleValue("fontSize", 16, "px")).toBe(16);
  });

  it("clamps opacity to [0, 1] or [0, 100] for percent", () => {
    expect(clampNumericStyleValue("opacity", -0.5, "number")).toBe(0);
    expect(clampNumericStyleValue("opacity", 1.8, "number")).toBe(1);
    expect(clampNumericStyleValue("opacity", 150, "%")).toBe(100);
  });

  it("clamps zIndex to [-9999, 9999]", () => {
    expect(clampNumericStyleValue("zIndex", -999999, "number")).toBe(-9999);
    expect(clampNumericStyleValue("zIndex", 999999, "number")).toBe(9999);
  });

  it("clamps letterSpacing to [-20, 50]", () => {
    expect(clampNumericStyleValue("letterSpacing", -100, "px")).toBe(-20);
    expect(clampNumericStyleValue("letterSpacing", 100, "px")).toBe(50);
    expect(clampNumericStyleValue("letterSpacing", -0.05, "em")).toBe(-0.05);
  });
});
