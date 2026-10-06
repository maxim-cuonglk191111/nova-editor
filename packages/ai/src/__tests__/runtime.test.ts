import { afterEach, describe, it, expect } from "vitest";
import { capTokens } from "../providers/runtime.js";

describe("capTokens", () => {
  afterEach(() => {
    delete process.env["AI_MAX_TOKENS_GROQ"];
  });

  it("caps the request at the provider default", () => {
    expect(capTokens("groq", 12000, 8000)).toBe(8000);
    expect(capTokens("groq", 500, 8000)).toBe(500);
  });

  it("lets AI_MAX_TOKENS_<PROVIDER> override the default cap", () => {
    process.env["AI_MAX_TOKENS_GROQ"] = "4000";
    expect(capTokens("groq", 12000, 8000)).toBe(4000);
  });
});
