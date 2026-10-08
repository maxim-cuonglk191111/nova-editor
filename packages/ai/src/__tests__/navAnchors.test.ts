import { describe, it, expect } from "vitest";
import { validateCompositionWS } from "../utils/validateCompositionWS.js";

const link = (text: string, href: string) => ({ component: "Link", props: { href }, text, children: [] });
const section = (label: string, heading: string) => ({
  component: "Box", label, props: { tag: "section" },
  children: [{ component: "Heading", props: { tag: "h2" }, text: heading, children: [] }],
});

describe("navbar anchors", () => {
  const page = {
    tree: [
      { component: "Box", label: "Navbar", props: { tag: "header" }, children: [link("Menu", "#menu"), link("Liên hệ", "#lien-he"), link("Blog", "#blog")] },
      section("Hero Section", "Fresh bread every morning"),
      section("Menu Section", "Our breads"),
      section("Contact", "Liên hệ đặt hàng"),
    ],
  };
  const r = validateCompositionWS(page);
  const idOf = (label: string) => r.props.find((p) => p.name === "id" && p.instanceId === r.instances.find((i) => i.label === label)!.id)?.value;

  it("gives the matching section the id the link points to", () => {
    expect(idOf("Menu Section")).toBe("menu");
  });

  it("matches Vietnamese headings without diacritics", () => {
    expect(idOf("Contact")).toBe("lien-he");
  });

  it("leaves links without a matching section alone", () => {
    expect(r.props.filter((p) => p.name === "id").map((p) => p.value)).not.toContain("blog");
    expect(idOf("Hero Section")).toBeUndefined();
  });
});
