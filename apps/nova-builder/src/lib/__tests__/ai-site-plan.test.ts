import { describe, it, expect } from "vitest";
import { planSitePages, navInstruction, MAX_SITE_PAGES } from "../aiSitePlan";

const keys = (p: ReturnType<typeof planSitePages>) => p?.map((x) => x.key) ?? null;

describe("planSitePages", () => {
  it("reads the client's Vietnamese shop prompt as four pages, home first", () => {
    const p = planSitePages("Tạo website bán hàng có trang chủ, danh sách sản phẩm, chi tiết sản phẩm và thanh toán");
    expect(keys(p)).toEqual(["home", "products", "product", "checkout"]);
    expect(p?.map((x) => x.path)).toEqual(["/", "/products", "/product", "/checkout"]);
  });

  it("does not count 'chi tiết sản phẩm' as a products page too", () => {
    expect(keys(planSitePages("website có chi tiết sản phẩm và giỏ hàng"))).toEqual(["home", "product", "cart"]);
  });

  it("understands English and adds home when it is not mentioned", () => {
    expect(keys(planSitePages("A shop with a products page, a cart and checkout"))).toEqual(["home", "products", "cart", "checkout"]);
  });

  it("honours an explicit multi-page request", () => {
    expect(keys(planSitePages("Website nhiều trang gồm trang chủ, giới thiệu và liên hệ"))).toEqual(["home", "about", "contact"]);
  });

  it("keeps single-page prompts single, even when they mention several sections", () => {
    expect(planSitePages("A landing page with about, pricing and contact sections")).toBeNull();
    expect(planSitePages("A SaaS pricing page with three tiers, feature comparison table, and an FAQ")).toBeNull();
    expect(planSitePages("Trang giới thiệu cho một quán cà phê — ảnh hero, món nổi bật, giờ mở cửa và bản đồ")).toBeNull();
    expect(planSitePages("")).toBeNull();
  });

  it("caps the page count", () => {
    const p = planSitePages("multi-page site: home, products, product detail, cart, checkout, about, contact, blog, faq");
    expect(p?.length).toBe(MAX_SITE_PAGES);
    expect(p?.[0]?.key).toBe("home");
  });
});

describe("navInstruction", () => {
  it("lists every page with its path", () => {
    const text = navInstruction([{ key: "home", path: "/" }, { key: "cart", path: "/cart" }], (k) => k.toUpperCase());
    expect(text).toContain("HOME → /");
    expect(text).toContain("CART → /cart");
  });
});
