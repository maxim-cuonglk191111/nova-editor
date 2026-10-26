import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Pages } from "@webstudio-is/sdk";
import type { WSCompositionResult } from "@studio/ai";
import { $pages, $instances, $breakpoints } from "../data-stores";
import { $selectedPageId } from "../nano-states";
import { registerContainers } from "../sync-stores";
import { applySite, buildPageMessage, composeSite, pointNavLinksAtPages } from "../generateSite";
import type { SitePage } from "../aiSitePlan";

const PAGES: SitePage[] = [
  { key: "home", path: "/" },
  { key: "products", path: "/products" },
  { key: "checkout", path: "/checkout" },
];
const nameOf = (k: string) => k.toUpperCase();

function composition(label: string): WSCompositionResult {
  const id = `sec_${label}`;
  return {
    instances: [{ type: "instance", id, component: "Box", label, children: [] }],
    rootIds: [id],
    props: [],
    styles: [],
    styleSources: [],
    styleSourceSelections: [],
    usedComponents: ["Box"],
  } as unknown as WSCompositionResult;
}

let registered = false;
function seedProject() {
  if (!registered) { registerContainers(); registered = true; }
  $instances.set(new Map([["root_home", { type: "instance", id: "root_home", component: "Body", children: [] }]]) as never);
  $breakpoints.set(new Map([["base", { id: "base", label: "Base" }]]) as never);
  $pages.set({
    homePageId: "home",
    pages: new Map([["home", { id: "home", name: "Home", title: "Home", path: "/", rootInstanceId: "root_home", meta: {} }]]),
    folders: new Map([["root", { id: "root", name: "Root", slug: "", children: ["home"] }]]),
    rootFolderId: "root",
  } as unknown as Pages);
  $selectedPageId.set("home");
}

describe("buildPageMessage", () => {
  it("keeps the user's words and names the page, the site map and the exact nav hrefs", () => {
    const msg = buildPageMessage("Cửa hàng bánh", PAGES[1]!, PAGES, nameOf);
    expect(msg).toContain("Cửa hàng bánh");
    expect(msg).toContain('Build ONLY the "PRODUCTS" page at /products');
    expect(msg).toContain("HOME (/), PRODUCTS (/products), CHECKOUT (/checkout)");
    expect(msg).toContain("HOME → /; PRODUCTS → /products; CHECKOUT → /checkout");
  });
});

describe("composeSite", () => {
  beforeEach(() => vi.unstubAllGlobals());

  it("requests each page in order and returns every composition", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ composition: composition("x") }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const seen: string[] = [];
    const out = await composeSite({ prompt: "p", pages: PAGES, nameOf, projectId: null, onProgress: (_i, n) => seen.push(n) });
    expect(out.failure).toBeUndefined();
    expect(out.results.map((r) => r.page.path)).toEqual(["/", "/products", "/checkout"]);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(seen).toEqual(["HOME", "PRODUCTS", "CHECKOUT"]);
  });

  it("stops at the first failure, keeps finished pages and makes no further request", async () => {
    let n = 0;
    const fetchMock = vi.fn(async () =>
      ++n < 3 ? new Response(JSON.stringify({ composition: composition("x") }), { status: 200 })
              : new Response(JSON.stringify({ error: "Daily limit reached" }), { status: 429 })
    );
    vi.stubGlobal("fetch", fetchMock);
    const out = await composeSite({ prompt: "p", pages: PAGES, nameOf, projectId: null });
    expect(out.results).toHaveLength(2);
    expect(out.failure).toEqual({ message: "Daily limit reached", status: 429 });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});

describe("applySite", () => {
  it("fills the home page, creates the other pages at their paths and opens home", () => {
    seedProject();
    applySite(PAGES.map((page) => ({ page, name: nameOf(page.key), composition: composition(page.key) })));

    const pages = Array.from($pages.get()!.pages.values());
    expect(pages.map((p) => p.path).sort()).toEqual(["/", "/checkout", "/products"]);
    expect(pages.find((p) => p.path === "/products")?.name).toBe("PRODUCTS");

    // every page now points at a root holding its own generated section
    for (const p of pages) {
      const root = $instances.get().get(p.rootInstanceId)!;
      const first = root.children[0];
      expect(first && first.type === "id" && $instances.get().get(first.value)?.label).toBe(
        p.path === "/" ? "home" : p.path.slice(1)
      );
    }
    expect($selectedPageId.get()).toBe("home");
  });
});

describe("pointNavLinksAtPages", () => {
  const link = (id: string, text: string) => ({ type: "instance", id, component: "Link", children: [{ type: "text", value: text }] });
  const names: Record<string, string> = { home: "Trang chủ", products: "Sản phẩm", product: "Chi tiết sản phẩm", checkout: "Thanh toán" };
  const site: SitePage[] = [
    { key: "home", path: "/" }, { key: "products", path: "/products" },
    { key: "product", path: "/product" }, { key: "checkout", path: "/checkout" },
  ];

  it("rewires anchor links whose text names a page, longest name first, and leaves others alone", () => {
    const comp = {
      instances: [link("a", "Trang chủ"), link("b", "Sản phẩm"), link("c", "Chi tiết sản phẩm"), link("d", "Thanh toán"), link("e", "Facebook")],
      rootIds: [], styles: [], styleSources: [], styleSourceSelections: [], usedComponents: [],
      props: [
        { id: "p1", instanceId: "a", name: "href", type: "string", value: "#home" },
        { id: "p5", instanceId: "e", name: "href", type: "string", value: "https://facebook.com" },
      ],
    } as unknown as WSCompositionResult;
    const out = pointNavLinksAtPages(comp, site, (k) => names[k]!);
    const href = (id: string) => out.props.find((p) => p.instanceId === id && p.name === "href")?.value;
    expect(href("a")).toBe("/");
    expect(href("b")).toBe("/products");
    expect(href("c")).toBe("/product");
    expect(href("d")).toBe("/checkout");
    expect(href("e")).toBe("https://facebook.com");
    expect(comp.props[0]).toMatchObject({ value: "#home" }); // input not mutated
  });
});
