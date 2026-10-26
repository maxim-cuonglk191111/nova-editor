import { describe, it, expect } from "vitest";
import { assertSignedIn, AuthRequiredError } from "../saveProject";

function res(status: number, init: { redirected?: boolean; url?: string } = {}): Response {
  const r = new Response(null, { status });
  Object.defineProperty(r, "redirected", { value: init.redirected ?? false });
  Object.defineProperty(r, "url", { value: init.url ?? "http://localhost:3001/api/projects" });
  return r;
}

describe("assertSignedIn", () => {
  it("throws on a 401", () => {
    expect(() => assertSignedIn(res(401))).toThrow(AuthRequiredError);
  });

  it("throws when the API call was redirected to the login page (HTML 200)", () => {
    expect(() => assertSignedIn(res(200, { redirected: true, url: "http://localhost:3001/login?callbackUrl=%2Fapi%2Fprojects" }))).toThrow(AuthRequiredError);
  });

  it("lets normal and non-auth error responses through", () => {
    expect(() => assertSignedIn(res(200))).not.toThrow();
    expect(() => assertSignedIn(res(500))).not.toThrow();
    expect(() => assertSignedIn(res(409))).not.toThrow();
  });
});
