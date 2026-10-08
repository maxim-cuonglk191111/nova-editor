// Task 009 batch 2 — the whole builder in Vietnamese. Visits every panel twice (EN, then VI)
// and reports per panel: text that is clipped / overflowing, and builder text that is identical
// in both languages (untranslated candidates). Screenshots v*.png, report vi-ui-report.json.
//   pwsh scripts/audit-run.ps1 e2e/builder-audit/vi-ui.spec.ts
import { test, type Page, type Browser } from "@playwright/test";
import { writeFileSync } from "node:fs";
import { freshAccount, pinLocale, seedProject, openBuilder, deleteFreshAccount, type FreshAccount } from "../helpers/fresh-account";
import { OUT } from "./audit";

let acc: FreshAccount | undefined;
test.afterAll(async () => deleteFreshAccount(acc));

type Snapshot = { texts: string[]; clipped: string[] };

/** Visible builder text (canvas iframe excluded) and elements whose text does not fit. */
const capture = (page: Page) =>
  page.evaluate((): Snapshot => {
    const texts = new Set<string>();
    const clipped: string[] = [];
    const visible = (el: Element) => {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return r.width > 0 && r.height > 0 && cs.visibility !== "hidden" && cs.display !== "none" && Number(cs.opacity) > 0.05;
    };
    for (const el of Array.from(document.body.querySelectorAll("*"))) {
      if (el.closest("iframe, script, style, svg")) continue;
      if (!visible(el)) continue;
      const own = Array.from(el.childNodes).filter((n) => n.nodeType === 3).map((n) => n.textContent ?? "").join(" ").replace(/\s+/g, " ").trim();
      for (const attr of ["placeholder", "title", "aria-label"]) {
        const v = el.getAttribute(attr)?.trim();
        if (v) texts.add(`[${attr}] ${v}`);
      }
      if (!own) continue;
      texts.add(own);
      const cs = getComputedStyle(el);
      const he = el as HTMLElement;
      const cut = cs.overflowX !== "visible" || cs.textOverflow === "ellipsis";
      if (cut && he.scrollWidth > he.clientWidth + 1) clipped.push(`${own.slice(0, 60)} (${he.clientWidth}px < ${he.scrollWidth}px)`);
      const pr = he.parentElement?.getBoundingClientRect();
      const r = he.getBoundingClientRect();
      if (pr && r.right > pr.right + 2 && getComputedStyle(he.parentElement!).overflowX !== "visible") {
        clipped.push(`${own.slice(0, 60)} (spills ${Math.round(r.right - pr.right)}px out of its box)`);
      }
    }
    return { texts: [...texts], clipped };
  });

type Step = { name: string; open: (page: Page) => Promise<void> };
const tools = (page: Page) => page.getByRole("button", { name: /^(tools|công cụ)/i }).click();
const close = async (page: Page) => { await page.keyboard.press("Escape"); await page.mouse.click(700, 880); await page.waitForTimeout(300); };
const rail = (i: number) => async (page: Page) => { await page.locator("button[aria-pressed]").nth(i).click(); };
const tab = (i: number) => async (page: Page) => {
  await page.frameLocator('iframe[title="Canvas"]').locator("h1").first().click();
  await page.locator('[role="tab"]').nth(i).click();
};
const toolItem = (i: number) => async (page: Page) => { await tools(page); await page.getByRole("menuitem").nth(i).click(); };

const STEPS: Step[] = [
  { name: "01-style", open: tab(0) },
  { name: "02-style-advanced", open: async (p) => { await tab(0)(p); await p.getByText(/advanced effects|hiệu ứng nâng cao/i).first().click(); } },
  { name: "03-props", open: tab(1) },
  { name: "04-settings", open: tab(2) },
  { name: "05-rail-add", open: rail(0) },
  { name: "06-rail-pages", open: rail(1) },
  { name: "07-rail-layers", open: rail(2) },
  { name: "08-rail-assets", open: rail(3) },
  { name: "09-rail-templates", open: rail(4) },
  { name: "10-export-menu", open: (p) => p.getByRole("button", { name: /^(export|xuất)/i }).click() },
  { name: "11-tools-menu", open: tools },
  { name: "12-tool-1", open: toolItem(0) },
  { name: "13-tool-2", open: toolItem(1) },
  { name: "14-tool-3", open: toolItem(2) },
  { name: "15-generate", open: (p) => p.locator("button", { hasText: "✦" }).last().click() },
  { name: "16-breakpoints", open: (p) => p.locator('button[title*="reakpoint"]').first().click() },
  { name: "17-save-dialog", open: async (p) => { await p.frameLocator('iframe[title="Canvas"]').locator("p").first().click(); await p.keyboard.press("Delete"); await p.keyboard.press("ControlOrMeta+s"); } },
  { name: "18-context-menu", open: (p) => p.frameLocator('iframe[title="Canvas"]').locator("h1").first().click({ button: "right" }) },
  { name: "19-palette", open: async (p) => { await p.frameLocator('iframe[title="Canvas"]').locator("h1").first().click(); await p.keyboard.press("ControlOrMeta+k"); } },
  { name: "20-mobile-p", open: (p) => p.getByRole("button", { name: /^(mobile p|di động dọc)$/i }).click() },
];

async function walk(page: Page, id: string, locale: "en" | "vi") {
  const result: Record<string, Snapshot> = {};
  await openBuilder(page, id);
  for (const s of STEPS) {
    try {
      await s.open(page);
      await page.waitForTimeout(700);
      result[s.name] = await capture(page);
      if (locale === "vi") await page.screenshot({ path: `${OUT}/v${s.name}.png` });
    } catch (err) {
      result[s.name] = { texts: [], clipped: [`STEP FAILED: ${(err as Error).message.split("\n")[0]}`] };
      if (locale === "vi") await page.screenshot({ path: `${OUT}/v${s.name}-FAILED.png` });
    }
    await close(page);
    if (s.name === "17-save-dialog") await page.keyboard.press("ControlOrMeta+z");
  }
  return result;
}

async function signedIn(browser: Browser, locale: "en" | "vi") {
  const page = await (await browser.newContext({ baseURL: process.env.BASE_URL, viewport: { width: 1440, height: 900 } })).newPage();
  await pinLocale(page, locale);
  await page.goto("/login");
  await page.locator('input[type="email"]').fill(acc!.email);
  await page.locator('input[type="password"]').fill(acc!.password);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(/\/projects/, { timeout: 120_000 });
  return page;
}

test("builder in Vietnamese: every panel, clipped text, untranslated strings", async ({ page, browser }) => {
  test.setTimeout(900_000);
  acc = await freshAccount(page, "viui");
  const id = await seedProject(page, "Vietnamese UI");
  const en = await walk(page, id, "en");
  const vi = await walk(await signedIn(browser, "vi"), id, "vi");

  // Builder chrome strings that stay the same in both languages. Layer names and project
  // content are the user's data, so the reviewer reads this list rather than asserting on it.
  const report = Object.fromEntries(STEPS.map(({ name }) => {
    const enTexts = new Set(en[name]?.texts ?? []);
    const same = (vi[name]?.texts ?? []).filter((t) => enTexts.has(t) && /[a-z]{3,}/i.test(t) && !/^(nova|css|html|url|seo|vnd|px|rem|em|%|ai)$/i.test(t));
    return [name, { untranslated: same, clipped: vi[name]?.clipped ?? [] }];
  }));
  writeFileSync(`${OUT}/vi-ui-report.json`, JSON.stringify(report, null, 2));
  for (const [name, r] of Object.entries(report)) console.log(`${name}: ${r.untranslated.length} same-as-EN, ${r.clipped.length} clipped`);
});
