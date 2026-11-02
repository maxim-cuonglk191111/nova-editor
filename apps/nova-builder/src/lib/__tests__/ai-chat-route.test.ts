import { describe, it, expect, vi, beforeEach } from "vitest";

// POST /api/ai/chat with the gate, the credit store and the providers replaced: what is checked is
// the route's own rules (validation, who is charged and when, how new sections are composed).

const openAiGate = vi.fn();
const deductCredit = vi.fn();
const editWithFallback = vi.fn();
const composeWithFallback = vi.fn();

vi.mock("@/lib/aiGate", () => ({ openAiGate: (...a: unknown[]) => openAiGate(...a) }));
vi.mock("@/lib/supabase-server", () => ({ deductCredit: (...a: unknown[]) => deductCredit(...a) }));
vi.mock("@studio/ai", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@studio/ai")>();
  return { ...actual, editWithFallback: (...a: unknown[]) => editWithFallback(...a), composeWithFallback: (...a: unknown[]) => composeWithFallback(...a) };
});

const { POST } = await import("@/app/api/ai/chat/route");

const context = {
  scope: "section", pageName: "Home", rootId: "root", targetId: "s1",
  sections: [{ id: "s1", label: "Hero" }, { id: "s2", label: "Menu" }],
  nodes: [
    { id: "s1", component: "Box", label: "Hero", styles: { backgroundColor: "#fff7ed", color: "#1f2937" } },
    { id: "h1", component: "Heading", text: "Welcome", styles: { color: "#1f2937" } },
  ],
};

const call = (body: unknown) => POST(new Request("http://localhost/api/ai/chat", { method: "POST", body: JSON.stringify(body) }));
const valid = { message: "make it warmer", context, projectId: "proj-1" };
const user = { kind: "user", user: { id: "u1", credits_remaining: 50, topup_credits_remaining: 0 }, source: "monthly" };
const editAnswer = (ops: unknown[], reply = "Done.") => ({ result: { reply, ops, dropped: [] }, provider: "groq", failures: [] });
const composition = { instances: [{ id: "x" }], props: [], styleSources: [], styleSourceSelections: [], styles: [], usedComponents: [], droppedComponents: [], rootIds: ["x"] };

beforeEach(() => {
  vi.clearAllMocks();
  openAiGate.mockResolvedValue(user);
});

describe("POST /api/ai/chat", () => {
  it("rejects a request without a message or a usable context before anything else runs", async () => {
    for (const bad of [{}, { message: "  ", context }, { message: "x" }, { message: "x", context: { rootId: "r", nodes: "no", sections: [] } }, { message: "x".repeat(2001), context }]) {
      expect((await call(bad)).status).toBe(400);
    }
    expect((await call({ message: "x", context: { ...context, nodes: Array.from({ length: 301 }, (_, i) => ({ id: `n${i}`, component: "Box" })) } })).status).toBe(400);
    expect(openAiGate).not.toHaveBeenCalled();
    expect(editWithFallback).not.toHaveBeenCalled();
  });

  it("passes a denied gate straight through: no model call, no charge", async () => {
    openAiGate.mockResolvedValue({ kind: "deny", response: Response.json({ error: "Unauthorized" }, { status: 401 }) });
    const res = await call(valid);
    expect(res.status).toBe(401);
    expect(editWithFallback).not.toHaveBeenCalled();
    expect(deductCredit).not.toHaveBeenCalled();
  });

  it("charges once, after the answer is valid, from the right balance", async () => {
    editWithFallback.mockResolvedValue(editAnswer([{ op: "setText", id: "h1", text: "Hi" }]));
    const res = await call(valid);
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json).toMatchObject({ reply: "Done.", provider: "groq", creditCost: 1, creditsRemaining: 49 });
    expect(json.ops).toEqual([{ op: "setText", id: "h1", text: "Hi" }]);
    expect(deductCredit).toHaveBeenCalledTimes(1);
    expect(deductCredit).toHaveBeenCalledWith("u1", "proj-1", 1, false);
    // The gate is asked for the most one answer can cost: the price of the first provider in the chain
    // (Gemini, 6 credits, by default); what is charged is the price of the provider that answered (Groq, 1).
    expect(openAiGate.mock.calls[0]![1]).toBe(6);
  });

  it("asks the gate for the price of the provider the user chose", async () => {
    editWithFallback.mockResolvedValue(editAnswer([{ op: "remove", id: "h1" }]));
    await call({ ...valid, provider: "groq" });
    expect(openAiGate.mock.calls[0]![1]).toBe(1);
  });

  it("charges the top-up balance when the gate chose it", async () => {
    openAiGate.mockResolvedValue({ ...user, source: "topup" });
    editWithFallback.mockResolvedValue(editAnswer([{ op: "remove", id: "h1" }]));
    await call(valid);
    expect(deductCredit).toHaveBeenCalledWith("u1", "proj-1", 1, true);
  });

  it("charges nothing in the development fallback", async () => {
    openAiGate.mockResolvedValue({ kind: "dev" });
    editWithFallback.mockResolvedValue(editAnswer([{ op: "remove", id: "h1" }]));
    const json = await (await call(valid)).json();
    expect(json.creditCost).toBe(0);
    expect(deductCredit).not.toHaveBeenCalled();
  });

  it("a provider failure is a readable 502 and costs nothing", async () => {
    editWithFallback.mockRejectedValue(new Error("All providers failed: groq: 429"));
    const res = await call(valid);
    expect(res.status).toBe(502);
    expect(await res.json()).toMatchObject({ code: "busy" });
    expect(deductCredit).not.toHaveBeenCalled();
  });

  it("puts the chosen provider first in the chain", async () => {
    editWithFallback.mockResolvedValue(editAnswer([{ op: "remove", id: "h1" }]));
    await call({ ...valid, provider: "mistral" });
    expect(editWithFallback.mock.calls[0]![0][0]).toBe("mistral");
    await call({ ...valid, provider: "auto" });
    expect(editWithFallback.mock.calls[1]![0][0]).not.toBe("mistral");
    await call({ ...valid, provider: "not-a-provider" });
    expect(editWithFallback.mock.calls[2]![0]).not.toContain("not-a-provider");
  });

  it("builds a requested section with the composer, telling it to match the page, and attaches the result", async () => {
    editWithFallback.mockResolvedValue(editAnswer([{ op: "insertSection", after: "s1", brief: "A pricing section with three plans" }]));
    composeWithFallback.mockResolvedValue({ composition, provider: "mistral", failures: [] });
    const json = await (await call({ ...valid, message: "add a pricing section below" })).json();
    expect(composeWithFallback).toHaveBeenCalledTimes(1);
    const prompt = composeWithFallback.mock.calls[0]![1] as string;
    expect(prompt).toContain("A pricing section with three plans");
    expect(prompt).toContain("no h1");
    expect(prompt).toContain("backgroundColor #fff7ed");
    expect(json.ops[0]).toMatchObject({ op: "insertSection", after: "s1", composition });
    expect(json.provider).toBe("mistral");
    expect(deductCredit).toHaveBeenCalledTimes(1);
  });

  it("composes at most two new sections per message and says the rest were left out", async () => {
    editWithFallback.mockResolvedValue(editAnswer([
      { op: "insertSection", after: "s1", brief: "one" }, { op: "insertSection", after: "s2", brief: "two" }, { op: "insertSection", after: null, brief: "three" },
    ]));
    composeWithFallback.mockResolvedValue({ composition, provider: "groq", failures: [] });
    const json = await (await call(valid)).json();
    expect(composeWithFallback).toHaveBeenCalledTimes(2);
    expect(json.ops).toHaveLength(2);
    expect(json.dropped).toContain("too many new sections");
  });

  it("drops a section that could not be built but still answers with the other changes", async () => {
    editWithFallback.mockResolvedValue(editAnswer([{ op: "setText", id: "h1", text: "Hi" }, { op: "insertSection", after: "s1", brief: "pricing" }]));
    composeWithFallback.mockRejectedValue(new Error("busy"));
    const json = await (await call(valid)).json();
    expect(json.ops.map((o: { op: string }) => o.op)).toEqual(["setText"]);
    expect(json.dropped.join(" ")).toContain("could not be built");
    expect(deductCredit).toHaveBeenCalledTimes(1);
  });

  it("answers 502 and charges nothing when nothing usable is left", async () => {
    editWithFallback.mockResolvedValue(editAnswer([{ op: "insertSection", after: "s1", brief: "pricing" }], ""));
    composeWithFallback.mockRejectedValue(new Error("busy"));
    const res = await call(valid);
    expect(res.status).toBe(502);
    expect(deductCredit).not.toHaveBeenCalled();
  });

  it("a reply without operations (a question) is a valid, charged answer", async () => {
    editWithFallback.mockResolvedValue(editAnswer([], "That is the main heading."));
    const json = await (await call({ ...valid, message: "what is this?" })).json();
    expect(json).toMatchObject({ reply: "That is the main heading.", ops: [] });
    expect(deductCredit).toHaveBeenCalledTimes(1);
  });
});
