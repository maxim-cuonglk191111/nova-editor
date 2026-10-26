import { describe, it, expect } from "vitest";
import { normalizePagePath, pathIssue } from "../../builder/left-sidebar/pages/pagePathRules";

const pages = [
  { id: "home", path: "/" },
  { id: "about", path: "/about" },
];

describe("page path rules", () => {
  it("normalizes without inventing a path for empty input", () => {
    expect(normalizePagePath("about")).toBe("/about");
    expect(normalizePagePath("  /blog ")).toBe("/blog");
    expect(normalizePagePath("   ")).toBe("");
  });

  it("flags an empty path as required, not as the reserved root", () => {
    expect(pathIssue("", pages)).toBe("required");
  });

  it("reserves / for the home page and flags duplicates", () => {
    expect(pathIssue("/", pages)).toBe("reserved");
    expect(pathIssue("about", pages)).toBe("collision");
    expect(pathIssue("/contact", pages)).toBeNull();
  });

  it("ignores the page being edited", () => {
    expect(pathIssue("/about", pages, "about")).toBeNull();
    expect(pathIssue("/", pages, "home")).toBeNull();
    expect(pathIssue("/about", pages, "home")).toBe("collision");
  });
});
