// Task 038 — the Pages tab on its own: the new-page form, the SEO form, a folder, Templates.
//   node scripts/ui-audit-pages.mjs [outDir] [baseUrl]
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";

const out = process.argv[2] ?? "doc/screenshots/.temp/ui-audit-pages";
const base = process.argv[3] ?? "http://localhost:3001";
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
await ctx.addInitScript(() => { localStorage.setItem("nova_locale", "en"); localStorage.setItem("nova-coachmarks-seen", "1"); });
const page = await ctx.newPage();
await page.goto(`${base}/builder/demo`);
await page.frameLocator('iframe[src*="/canvas"]').locator("h1").first().waitFor({ timeout: 90_000 });
const shot = async (name) => { await page.waitForTimeout(400); await page.screenshot({ path: `${out}/${name}.png` }); console.log("shot", name); };
const rail = (label) => page.locator(`button[aria-label="${label}"][aria-pressed]`);
try {
  await rail("Pages").click();
  await shot("p1-pages");
  await page.getByRole("button", { name: "+ Page" }).click();
  await page.getByPlaceholder("Page name", { exact: true }).fill("Our services");
  await shot("p2-new-page-form");
  await page.getByRole("button", { name: "Cancel" }).click();
  await page.getByRole("button", { name: "+ Folder" }).click();
  await shot("p3-new-folder");
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: /SEO/ }).first().click();
  await shot("p4-seo");
  await rail("Templates").click();
  await shot("p5-templates");
} catch (e) { console.log("FAILED", String(e).split("\n")[0]); }
await browser.close();
