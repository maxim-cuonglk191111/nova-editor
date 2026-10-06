import { describe, it, expect, vi } from "vitest";
import type { AIProvider, ProviderName } from "../providers/base.js";

const outputs: Partial<Record<ProviderName, () => Promise<string>>> = {};

vi.mock("../providers/registry.js", () => ({
  getProvider: (name: ProviderName): AIProvider => ({
    id: name,
    name,
    complete: () => (outputs[name] ?? (() => Promise.reject(new Error("no key"))))(),
  }),
}));

const { composeWithFallback, providerChain } = await import("../agents/composeWithFallback.js");

const page = JSON.stringify({
  tree: [{ id: "a1B2c3D4", component: "Heading", label: "Title", props: { tag: "h1" }, styles: {}, text: "Hi", children: [] }],
});

describe("providerChain", () => {
  it("puts the preferred providers first and de-duplicates", () => {
    expect(providerChain(["groq", "groq"], "openrouter,groq,mistral")).toEqual(["groq", "openrouter", "mistral"]);
  });

  it("drops unknown names and empty preferences", () => {
    expect(providerChain([undefined, "nope"], "mistral, google")).toEqual(["mistral", "google"]);
  });

  it("uses the default order when no fallback list is set", () => {
    expect(providerChain([], undefined)[0]).toBe("openrouter");
  });
});

describe("composeWithFallback", () => {
  it("skips a failing provider and returns the next one's composition", async () => {
    outputs.anthropic = () => Promise.reject(new Error("ANTHROPIC_API_KEY is not configured"));
    outputs.openrouter = () => Promise.resolve(page);
    const result = await composeWithFallback(["anthropic", "openrouter"], "a page");
    expect(result.provider).toBe("openrouter");
    expect(result.composition.instances.length).toBeGreaterThan(0);
    expect(result.failures[0]?.provider).toBe("anthropic");
  });

  it("treats an empty page as a failure", async () => {
    outputs.groq = () => Promise.resolve('{"tree":[]}');
    outputs.mistral = () => Promise.resolve(page);
    const result = await composeWithFallback(["groq", "mistral"], "a page");
    expect(result.provider).toBe("mistral");
  });

  it("retries a provider once on a transient error", async () => {
    let calls = 0;
    outputs.mistral = () => (++calls === 1 ? Promise.reject(new Error("429 status code (no body)")) : Promise.resolve(page));
    const result = await composeWithFallback(["mistral"], "a page", 0);
    expect(result.provider).toBe("mistral");
    expect(calls).toBe(2);
  });

  it("does not retry a non-transient error", async () => {
    let calls = 0;
    outputs.openai = () => { calls++; return Promise.reject(new Error("OPENAI_API_KEY is not configured")); };
    outputs.openrouter = () => Promise.resolve(page);
    await composeWithFallback(["openai", "openrouter"], "a page", 0);
    expect(calls).toBe(1);
  });

  it("throws with every provider's error when all fail", async () => {
    await expect(composeWithFallback(["google"], "a page")).rejects.toThrow(/google: no key/);
  });
});
