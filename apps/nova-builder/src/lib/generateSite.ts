"use client";
// Multi-page generation: one /api/ai call per page (each charged only after it validates,
// ADR-NB-005), then all pages are applied together. Planning is free (aiSitePlan.ts).
import type { WSCompositionResult } from "@studio/ai";
import { $pages } from "./data-stores";
import { $selectedPageId } from "./nano-states";
import { applyWSComposition } from "./applyWSComposition";
import { createPageRecord } from "./pageRecords";
import { navInstruction, type SitePage, type SitePageKey } from "./aiSitePlan";

export type SiteResult = { page: SitePage; name: string; composition: WSCompositionResult };

export type SiteFailure = { message: string; status: number };

export type SiteOutcome = { results: SiteResult[]; failure?: SiteFailure };

type ComposeArgs = {
  prompt: string;
  pages: SitePage[];
  nameOf: (key: SitePageKey) => string;
  projectId: string | null;
  /** Called before each page is requested. `index` is 0-based. */
  onProgress?: (index: number, name: string) => void;
};

/** The request for one page: the user's own words plus what the other pages are. */
export function buildPageMessage(prompt: string, page: SitePage, pages: SitePage[], nameOf: (key: SitePageKey) => string): string {
  const siteMap = pages.map((p) => `${nameOf(p.key)} (${p.path})`).join(", ");
  return [
    prompt.trim(),
    "",
    `This request covers ONE page of a ${pages.length}-page website (${siteMap}).`,
    `Build ONLY the "${nameOf(page.key)}" page at ${page.path}; the other pages are generated separately.`,
    navInstruction(pages, nameOf),
    "Use the same brand name, colors and navbar/footer on every page.",
  ].join("\n");
}

const fold = (v: string) => v.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/gi, "d").toLowerCase().trim();

/**
 * Models are told the real page hrefs but the base prompt still says "#anchor", so some
 * navbars come back wired to anchors. Any Link whose text names a page of the site
 * (longest name wins: "Chi tiết sản phẩm" before "Sản phẩm") is pointed at that page.
 */
export function pointNavLinksAtPages(composition: WSCompositionResult, pages: SitePage[], nameOf: (key: SitePageKey) => string): WSCompositionResult {
  const targets = pages.map((p) => ({ path: p.path, name: fold(nameOf(p.key)) })).sort((a, b) => b.name.length - a.name.length);
  const props = composition.props.map((p) => ({ ...p }));
  const extra: typeof props = [];
  for (const inst of composition.instances) {
    if (inst.component !== "Link") continue;
    const text = fold(inst.children.map((c) => (c.type === "text" ? c.value : "")).join(" "));
    const hit = text && targets.find((t) => t.name.length >= 3 && text.includes(t.name));
    if (!hit) continue;
    const existing = props.find((p) => p.instanceId === inst.id && p.name === "href");
    if (existing) existing.value = hit.path;
    else extra.push({ id: `prop_nav_${inst.id}`, instanceId: inst.id, name: "href", type: "string", value: hit.path } as (typeof props)[number]);
  }
  return { ...composition, props: [...props, ...extra] };
}

/** Requests every page in order; stops at the first failure and returns what was built. */
export async function composeSite({ prompt, pages, nameOf, projectId, onProgress }: ComposeArgs): Promise<SiteOutcome> {
  const results: SiteResult[] = [];
  for (let i = 0; i < pages.length; i++) {
    const page = pages[i]!;
    const name = nameOf(page.key);
    onProgress?.(i, name);
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userMessage: buildPageMessage(prompt, page, pages, nameOf), projectId }),
      });
      const json = (await res.json().catch(() => ({}))) as { composition?: WSCompositionResult; error?: string };
      if (!res.ok || !json.composition) {
        return { results, failure: { message: json.error ?? "", status: res.status } };
      }
      results.push({ page, name, composition: pointNavLinksAtPages(json.composition, pages, nameOf) });
    } catch (err) {
      return { results, failure: { message: String(err), status: 0 } };
    }
  }
  return { results };
}

/** Creates any missing pages, fills each from its composition, and opens the home page. */
export function applySite(results: SiteResult[]): void {
  for (const { page, name, composition } of results) {
    const existing = Array.from($pages.get()?.pages.values() ?? []).find((p) => p.path === page.path);
    const pageId = existing?.id ?? createPageRecord(name, page.path);
    if (pageId) applyWSComposition(composition, pageId);
  }
  const home = Array.from($pages.get()?.pages.values() ?? []).find((p) => p.path === "/");
  if (home) $selectedPageId.set(home.id);
}
