import { describe, it, expect } from "vitest";
import { validateCompositionWS } from "../utils/validateCompositionWS.js";

const page = {
  tree: [
    {
      component: "Box",
      props: { tag: "header" },
      styles: { display: "flex", padding: "20px 48px" },
      children: [
        { component: "Heading", props: { tag: "h2" }, text: "Brand", children: [] },
        { component: "Box", props: { tag: "nav" }, styles: { display: "flex", gap: "24px" }, children: [{ component: "Link", text: "Menu", children: [] }] },
      ],
    },
    { component: "Box", props: { tag: "section" }, children: [{ component: "Heading", props: { tag: "h1" }, text: "Hi", children: [] }] },
  ],
};

describe("mobile navbar styles", () => {
  it("adds phone styles to the header, its nav and the nav links only", () => {
    const r = validateCompositionWS(page);
    const mobile = r.styles.filter((s) => s.breakpointId === "mobile");
    const sourceOf = (tag: string) => {
      const id = r.props.find((p) => p.name === "tag" && p.value === tag)!.instanceId;
      return r.styleSourceSelections.find((s) => s.instanceId === id)?.values[0];
    };
    const props = (src: string | undefined) => mobile.filter((s) => s.styleSourceId === src).map((s) => s.property);
    expect(props(sourceOf("header"))).toEqual(expect.arrayContaining(["flexWrap", "paddingLeft", "rowGap"]));
    expect(props(sourceOf("nav"))).toEqual(expect.arrayContaining(["order", "flexBasis", "overflowX", "flexWrap"]));
    expect(mobile.filter((s) => s.property === "whiteSpace")).toHaveLength(1);
    expect(sourceOf("section")).toBeUndefined();
  });
});
