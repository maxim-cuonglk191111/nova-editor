import { describe, it, expect, vi } from "vitest";
import type { AIProvider, ProviderName } from "../providers/base.js";
import type { EditContext } from "../utils/validateOps.js";

const outputs: Partial<Record<ProviderName, () => Promise<string>>> = {};
vi.mock("../providers/registry.js", () => ({
  getProvider: (name: ProviderName): AIProvider => ({
    id: name,
    name,
    complete: () => (outputs[name] ?? (() => Promise.reject(new Error("no key"))))(),
  }),
}));

const { editWithFallback, serializeContext, buildEditUserMessage } = await import("../agents/editAgent.js");

const ctx: EditContext = {
  scope: "element", pageName: "Home", rootId: "root", sections: [{ id: "s1", label: "Hero" }], targetId: "h1",
  nodes: [{ id: "s1", component: "Box", children: ["h1"] }, { id: "h1", component: "Heading", text: "Welcome", styles: { color: "#000" } }],
};
const input = { message: "make it shorter", context: ctx };
const good = JSON.stringify({ reply: "Shortened.", ops: [{ op: "setText", id: "h1", text: "Hi" }] });

describe("editWithFallback", () => {
  it("returns the first provider's valid answer", async () => {
    outputs.groq = async () => good;
    const r = await editWithFallback(["groq"], input, 0);
    expect(r.provider).toBe("groq");
    expect(r.result.ops).toHaveLength(1);
  });

  it("falls back when a provider fails or answers with nothing usable", async () => {
    outputs.google = async () => { throw new Error("region blocked"); };
    outputs.mistral = async () => "not json at all";
    outputs.groq = async () => good;
    const r = await editWithFallback(["google", "mistral", "groq"], input, 0);
    expect(r.provider).toBe("groq");
    expect(r.failures.map((f) => f.provider)).toEqual(["google", "mistral"]);
  });

  it("accepts a reply without operations (a question about the page)", async () => {
    outputs.groq = async () => JSON.stringify({ reply: "It is the main heading.", ops: [] });
    const r = await editWithFallback(["groq"], input, 0);
    expect(r.result).toMatchObject({ reply: "It is the main heading.", ops: [] });
  });

  it("throws, naming every provider, when none works", async () => {
    outputs.google = async () => { throw new Error("401"); };
    outputs.groq = async () => JSON.stringify({ reply: "", ops: [{ op: "setText", id: "ghost", text: "x" }] });
    await expect(editWithFallback(["google", "groq"], input, 0)).rejects.toThrow(/google.*groq/s);
  });

  it("retries once on a rate limit before moving on", async () => {
    let calls = 0;
    outputs.groq = async () => { calls++; if (calls === 1) throw new Error("429 rate limit"); return good; };
    const r = await editWithFallback(["groq"], input, 0);
    expect(calls).toBe(2);
    expect(r.provider).toBe("groq");
  });
});

describe("prompt building", () => {
  it("states the request, the language rule and the recent turns", () => {
    const msg = buildEditUserMessage({ ...input, message: "rút gọn tiêu đề", history: [{ role: "user", text: "hi" }, { role: "assistant", text: "hello" }] });
    expect(msg).toContain("REQUEST: rút gọn tiêu đề");
    expect(msg).toContain("Vietnamese");
    expect(msg).toContain("USER: hi");
    expect(msg).toContain('"id":"h1"');
  });

  it("shrinks an oversized context: styles first, then trailing nodes", () => {
    const big: EditContext = { ...ctx, nodes: Array.from({ length: 600 }, (_, i) => ({ id: `n${i}`, component: "Paragraph", text: "x".repeat(60), styles: { color: "#111111", fontSize: "16px" } })) };
    const json = serializeContext(big);
    expect(json.length).toBeLessThanOrEqual(14_000);
    expect(json).not.toContain('"styles"');
    expect(JSON.parse(json).nodes.length).toBeGreaterThan(10);
  });
});
