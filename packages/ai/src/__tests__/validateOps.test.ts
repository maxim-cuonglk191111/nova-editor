import { describe, it, expect } from "vitest";
import { validateEditReply, needsComposition, MAX_OPS, type EditContext } from "../utils/validateOps.js";

const ctx: EditContext = {
  scope: "section",
  pageName: "Home",
  rootId: "root",
  sections: [{ id: "s1", label: "Hero" }, { id: "s2", label: "Menu" }],
  targetId: "s1",
  nodes: [
    { id: "s1", component: "Box", label: "Hero", children: ["h1", "p1", "img1"] },
    { id: "h1", component: "Heading", text: "Welcome" },
    { id: "p1", component: "Paragraph", text: "Hello there" },
    { id: "img1", component: "Image", props: { src: "https://x.test/a.jpg", alt: "a" } },
  ],
};

const reply = (ops: unknown[], text = "Done.") => validateEditReply({ reply: text, ops }, ctx);

describe("validateEditReply", () => {
  it("keeps valid operations and the reply", () => {
    const r = reply([
      { op: "setText", id: "h1", text: "Hi" },
      { op: "setStyle", id: "s1", styles: { backgroundColor: "#fff7ed", padding: "48px" } },
      { op: "setProp", id: "img1", name: "alt", value: "A warm room" },
      { op: "remove", id: "p1" },
    ]);
    expect(r.reply).toBe("Done.");
    expect(r.ops.map((o) => o.op)).toEqual(["setText", "setStyle", "setProp", "remove"]);
    expect(r.dropped).toEqual([]);
  });

  it("drops ids the model was not shown", () => {
    const r = reply([{ op: "setText", id: "ghost", text: "x" }, { op: "remove", id: "ghost" }, { op: "setStyle", id: "ghost", styles: { color: "red" } }]);
    expect(r.ops).toEqual([]);
    expect(r.dropped).toHaveLength(3);
  });

  it("setText only works on a node that has text, and never with empty text", () => {
    expect(reply([{ op: "setText", id: "s1", text: "x" }]).ops).toEqual([]);
    expect(reply([{ op: "setText", id: "h1", text: "   " }]).ops).toEqual([]);
  });

  it("never removes the page root", () => {
    const withRoot = { ...ctx, nodes: [...ctx.nodes, { id: "root", component: "Body" }] };
    expect(validateEditReply({ ops: [{ op: "remove", id: "root" }] }, withRoot).ops).toEqual([]);
  });

  it("keeps visual CSS only and refuses anything that loads or runs something", () => {
    const r = reply([{ op: "setStyle", id: "s1", styles: { color: "#111", position: "fixed", backgroundImage: "x", background: "url(https://evil.test/a.png)", padding: "1px} body{", fontSize: 20 } }]);
    expect(r.ops).toEqual([{ op: "setStyle", id: "s1", styles: { color: "#111", fontSize: "20" } }]);
    expect(reply([{ op: "setStyle", id: "s1", styles: { background: "url(a)" } }]).ops).toEqual([]);
  });

  it("checks prop names and values: safe links, https images, heading tags", () => {
    const ok = reply([
      { op: "setProp", id: "h1", name: "tag", value: "H2" },
      { op: "setProp", id: "img1", name: "src", value: "https://images.example/x.jpg" },
      { op: "setProp", id: "img1", name: "src", value: "photo-1507003211169-0a1dd7228f2d" },
      { op: "setProp", id: "h1", name: "href", value: "#menu" },
    ]);
    expect(ok.ops).toHaveLength(4);
    expect((ok.ops[0] as { value: string }).value).toBe("h2");
    const bad = reply([
      { op: "setProp", id: "h1", name: "href", value: "javascript:alert(1)" },
      { op: "setProp", id: "img1", name: "src", value: "http://insecure.test/a.jpg" },
      { op: "setProp", id: "h1", name: "tag", value: "script" },
      { op: "setProp", id: "h1", name: "onclick", value: "x" },
    ]);
    expect(bad.ops).toEqual([]);
  });

  it("section operations carry a brief and point at a real section; 'top' means first", () => {
    const r = reply([
      { op: "insertSection", after: "s2", brief: "A pricing section with three plans" },
      { op: "insertSection", after: "top", brief: "A banner" },
      { op: "replaceSection", id: "s1", brief: "Three cards" },
      { op: "insertSection", after: "h1", brief: "not a section" },
      { op: "replaceSection", id: "s9", brief: "nope" },
      { op: "insertSection", after: "s1", brief: "" },
    ]);
    expect(r.ops).toEqual([
      { op: "insertSection", after: "s2", brief: "A pricing section with three plans" },
      { op: "insertSection", after: null, brief: "A banner" },
      { op: "replaceSection", id: "s1", brief: "Three cards" },
    ]);
    expect(r.ops.filter(needsComposition)).toHaveLength(3);
  });

  it("keeps at most MAX_OPS operations and tolerates a malformed answer", () => {
    const many = Array.from({ length: MAX_OPS + 5 }, () => ({ op: "setText", id: "h1", text: "x" }));
    expect(reply(many).ops).toHaveLength(MAX_OPS);
    expect(validateEditReply("nonsense", ctx)).toEqual({ reply: "", ops: [], dropped: [] });
    expect(validateEditReply({ reply: 42, ops: "no" }, ctx)).toEqual({ reply: "", ops: [], dropped: [] });
  });
});
