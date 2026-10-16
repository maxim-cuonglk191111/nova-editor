import { describe, it, expect } from "vitest";
import { toSlug } from "../../builder/left-sidebar/pages/usePageCrud";

describe("toSlug utility", () => {
  it("converts standard English titles to clean URL slugs", () => {
    expect(toSlug("About Us")).toBe("about-us");
    expect(toSlug("Contact & Support")).toBe("contact-support");
    expect(toSlug("Pricing Plans 2026!")).toBe("pricing-plans-2026");
  });

  it("normalizes Vietnamese accented characters and removes diacritics", () => {
    expect(toSlug("Giới thiệu")).toBe("gioi-thieu");
    expect(toSlug("Tin tức & Sự kiện")).toBe("tin-tuc-su-kien");
    expect(toSlug("Bảng giá Dịch vụ")).toBe("bang-gia-dich-vu");
    expect(toSlug("Đội ngũ")).toBe("doi-ngu");
  });

  it("handles edge cases: multiple hyphens, leading/trailing symbols, empty strings", () => {
    expect(toSlug("---hello---world---")).toBe("hello-world");
    expect(toSlug("   ")).toBe("");
    expect(toSlug("Special @#$% Characters")).toBe("special-characters");
  });
});
