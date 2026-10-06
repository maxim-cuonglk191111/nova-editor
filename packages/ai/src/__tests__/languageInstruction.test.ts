import { describe, it, expect } from "vitest";
import { languageInstruction } from "../agents/composerAgentWS.js";

describe("languageInstruction", () => {
  it("asks for Vietnamese when the request has Vietnamese diacritics", () => {
    expect(languageInstruction("Một trang bảng giá SaaS với ba gói")).toMatch(/in Vietnamese/);
  });

  it("asks for the request's own language otherwise", () => {
    const text = languageInstruction("A landing page for an artisan bakery");
    expect(text).not.toMatch(/Vietnamese/);
    expect(text).toMatch(/English if it is in English/);
  });
});
