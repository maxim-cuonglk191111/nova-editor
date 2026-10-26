// Decide, from the user's prompt alone, whether they asked for a multi-page site and
// which pages. Pure and free: no AI call and no credits are spent on planning.
//
// Deliberately conservative — "a landing page with about, pricing and contact sections"
// is ONE page. A prompt only becomes multi-page when it says so ("nhiều trang",
// "multi-page", "các trang…") or describes a shop flow (≥ 2 of products / product
// detail / cart / checkout).

export type SitePageKey =
  | "home" | "products" | "product" | "cart" | "checkout"
  | "about" | "contact" | "pricing" | "blog" | "faq";

export type SitePage = { key: SitePageKey; path: string };

/** Pages are generated one AI call each, so the count is capped. */
export const MAX_SITE_PAGES = 6;

// Most specific first: matched text is blanked so "chi tiết sản phẩm" is not also "sản phẩm".
const KINDS: { key: SitePageKey; path: string; re: RegExp }[] = [
  { key: "product", path: "/product", re: /chi tiet san pham|product (?:detail|details|page)|trang san pham don|single product/ },
  { key: "products", path: "/products", re: /danh sach san pham|san pham|cua hang|products?|catalog(?:ue)?|\bshop\b|\bstore\b/ },
  { key: "cart", path: "/cart", re: /gio hang|\bcart\b|\bbasket\b/ },
  { key: "checkout", path: "/checkout", re: /thanh toan|\bcheckout\b|\bpayment\b/ },
  { key: "about", path: "/about", re: /gioi thieu|ve chung toi|\babout\b/ },
  { key: "contact", path: "/contact", re: /lien he|\bcontact\b/ },
  { key: "pricing", path: "/pricing", re: /bang gia|\bpricing\b|\bplans\b/ },
  { key: "blog", path: "/blog", re: /tin tuc|bai viet|\bblog\b|\bnews\b/ },
  { key: "faq", path: "/faq", re: /cau hoi thuong gap|\bfaq\b/ },
  { key: "home", path: "/", re: /trang chu|\bhome(?:page)?\b/ },
];

const SHOP_FLOW: SitePageKey[] = ["products", "product", "cart", "checkout"];
const EXPLICIT = /nhieu trang|cac trang|\d+ trang|multi[- ]?page|\bpages\b|\d+ pages/;

const fold = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/gi, "d").toLowerCase();

/** The pages asked for, home first, or null when the prompt describes a single page. */
export function planSitePages(prompt: string): SitePage[] | null {
  const text = fold(prompt);
  let work = text;
  const found: { page: SitePage; at: number }[] = [];
  for (const kind of KINDS) {
    const m = kind.re.exec(work);
    if (!m) continue;
    found.push({ page: { key: kind.key, path: kind.path }, at: m.index });
    work = work.slice(0, m.index) + " ".repeat(m[0].length) + work.slice(m.index + m[0].length);
  }

  const keys = new Set(found.map((f) => f.page.key));
  const shopSteps = SHOP_FLOW.filter((k) => keys.has(k)).length;
  const asked = EXPLICIT.test(text) || shopSteps >= 2;
  if (!asked || found.length < 2) return null;

  const ordered = found.sort((a, b) => a.at - b.at).map((f) => f.page);
  const home = ordered.find((p) => p.key === "home") ?? { key: "home" as const, path: "/" };
  const rest = ordered.filter((p) => p.key !== "home");
  const pages = [home, ...rest].slice(0, MAX_SITE_PAGES);
  return pages.length >= 2 ? pages : null;
}

/** Navigation instruction shared by every page's request so the navbars agree. */
export function navInstruction(pages: SitePage[], nameOf: (key: SitePageKey) => string): string {
  const links = pages.map((p) => `${nameOf(p.key)} → ${p.path}`).join("; ");
  return `Navbar links MUST use exactly these hrefs, not "#" anchors: ${links}.`;
}
