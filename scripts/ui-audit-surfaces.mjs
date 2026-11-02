// Task 038 — every secondary surface of the builder (menus, dialogs, floating panels, tabs with a
// real element selected), one screenshot each, to see what still looks old.
//   node scripts/ui-audit-surfaces.mjs [outDir] [baseUrl]
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";

const out = process.argv[2] ?? "doc/screenshots/.temp/ui-audit";
const base = process.argv[3] ?? "http://localhost:3001";
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
await ctx.addInitScript(() => { localStorage.setItem("nova_locale", "en"); localStorage.setItem("nova-coachmarks-seen", "1"); });
const page = await ctx.newPage();
await page.goto(`${base}/builder/demo`);
const canvas = page.frameLocator('iframe[src*="/canvas"]');
await canvas.locator("h1").first().waitFor({ timeout: 90_000 });
const shot = async (name) => { await page.waitForTimeout(450); await page.screenshot({ path: `${out}/${name}.png` }); console.log("shot", name); };
const step = async (name, fn) => { try { await fn(); await shot(name); } catch (e) { console.log("FAILED", name, String(e).split("\n")[0]); } };
const closeAll = async () => { await page.keyboard.press("Escape"); await page.mouse.click(700, 500).catch(() => {}); await page.waitForTimeout(200); };

await step("01-menu-export", async () => { await page.getByRole("button", { name: "Export", exact: true }).click(); });
await closeAll();
await step("02-menu-tools", async () => { await page.getByRole("button", { name: "Tools", exact: true }).click(); });
await closeAll();
await step("03-breakpoint-manager", async () => { await page.locator('button[title*="breakpoint" i]').first().click(); });
await closeAll();
await step("04-save-gate-modal", async () => { await page.getByRole("button", { name: /^Save$/ }).click(); });
await page.keyboard.press("Escape");
await page.reload(); await canvas.locator("h1").first().waitFor({ timeout: 90_000 });
await step("05-history-panel", async () => { await page.getByRole("button", { name: "Tools", exact: true }).click(); await page.getByRole("menuitem", { name: /History/ }).click(); });
await page.keyboard.press("Escape");
await step("06-a11y-panel", async () => { await page.getByRole("button", { name: "Tools", exact: true }).click(); await page.getByRole("menuitem", { name: /Accessibility/ }).click(); });
await page.reload(); await canvas.locator("h1").first().waitFor({ timeout: 90_000 });
await step("07-ai-content-fill", async () => { await page.getByRole("button", { name: "Tools", exact: true }).click(); await page.getByRole("menuitem", { name: /AI Content/ }).click(); });
await page.reload(); await canvas.locator("h1").first().waitFor({ timeout: 90_000 });

// Props / Settings with a button selected
await step("08-props-button", async () => {
  await canvas.getByText("Start building free").first().click();
  await page.locator('[role="tab"]').filter({ hasText: /^Props$/ }).click();
});
await step("09-settings-button", async () => { await page.locator('[role="tab"]').filter({ hasText: /^Settings$/ }).click(); });
await step("10-style-text-selected", async () => {
  await canvas.locator("h1").first().click();
  await page.locator('[role="tab"]').filter({ hasText: /^Style$/ }).click();
  for (const name of ["Typography", "Background"]) {
    const s = page.locator("summary", { hasText: new RegExp(`^${name}`) }).first();
    if (await s.count()) await s.click();
  }
});

// left side
await step("11-pages-new-form", async () => {
  await page.locator('button[aria-pressed]').nth(2).click();
  await page.getByRole("button", { name: "+ Page" }).click();
});
await step("12-pages-seo", async () => {
  await page.keyboard.press("Escape");
  const seo = page.getByRole("button", { name: /SEO/ }).first();
  if (await seo.count()) await seo.click();
});
await step("13-layers-expanded", async () => {
  await page.locator('button[aria-pressed]').nth(3).click();
  await canvas.locator("h1").first().click();
  await page.waitForTimeout(300);
});
await step("14-templates", async () => { await page.locator('button[aria-pressed]').nth(5).click(); });

// overlays
await step("15-context-menu", async () => { await canvas.locator("h1").first().click({ button: "right" }); });
await closeAll();
await step("16-command-palette", async () => { await page.keyboard.press("Control+k"); });
await closeAll();
await step("17-shortcuts", async () => { await page.keyboard.press("Shift+/"); });
await closeAll();
await step("18-canvas-selection", async () => { await canvas.locator("h1").first().click(); });
await step("19-text-edit", async () => { await canvas.locator("h1").first().dblclick(); });
await browser.close();
