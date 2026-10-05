import { describe, it, expect } from "vitest";
import { makeResponsive } from "../utils/responsiveStyles.js";

describe("makeResponsive", () => {
  it("turns large fixed font sizes into clamp() that equals the original at 1440px", () => {
    expect(makeResponsive({ fontSize: "56px" }).fontSize).toBe("clamp(31px, 3.89vw, 56px)");
    expect(makeResponsive({ fontSize: "16px" }).fontSize).toBe("16px");
  });

  it("lets flex rows wrap but leaves columns and explicit wrap alone", () => {
    expect(makeResponsive({ display: "flex" }).flexWrap).toBe("wrap");
    expect(makeResponsive({ display: "flex", flexDirection: "column" }).flexWrap).toBeUndefined();
    expect(makeResponsive({ display: "flex", flexWrap: "nowrap" }).flexWrap).toBe("nowrap");
  });

  it("gives zero-basis flex items a wrapping basis", () => {
    expect(makeResponsive({ flex: "1" }).flex).toBe("1 1 280px");
  });

  it("makes max-width-only elements track their container", () => {
    expect(makeResponsive({ maxWidth: "600px" })).toEqual({ maxWidth: "600px", width: "100%" });
    expect(makeResponsive({ maxWidth: "600px", width: "auto" }).width).toBe("auto");
  });

  it("caps wide fixed widths and grids to the viewport", () => {
    expect(makeResponsive({ width: "560px" }).maxWidth).toBe("100%");
    expect(makeResponsive({ minWidth: "400px" }).minWidth).toBe("min(400px, 100%)");
    expect(makeResponsive({ gridTemplateColumns: "repeat(3, 1fr)" }).gridTemplateColumns).toBe("repeat(auto-fit, minmax(240px, 1fr))");
  });
});
