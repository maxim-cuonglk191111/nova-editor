// Task 038 — screenshots of every builder surface (demo project), for before/after comparison.
//   node scripts/ui-baseline.mjs [outDir] [baseUrl]
// Default out dir is doc/screenshots/.temp/ui-baseline (gitignored).
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";

const out = process.argv[2] ?? "doc/screenshots/.temp/ui-baseline";
const base = process.argv[3] ?? "http://localhost:3001";
mkdirSync(out, { recursive: true });

const browser = await chromium.launch({ executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", headless: true });

for (const size of [{ w: 1440, h: 900 }, { w: 1024, h: 768 }]) {
  const ctx = await browser.newContext({ viewport: { width: size.w, height: size.h } });
  await ctx.addInitScript(() => { localStorage.setItem("nova_locale", "en"); localStorage.setItem("nova-coachmarks-seen", "1"); });
  const page = await ctx.newPage();
  const errors = [];
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text().slice(0, 160)); });
  await page.goto(`${base}/builder/demo`);
  const canvas = page.frameLocator('iframe[src*="/canvas"]');
  await canvas.locator("h1").first().waitFor({ timeout: 90_000 });
  const tag = `${size.w}`;
  const shot = (name) => page.screenshot({ path: `${out}/${tag}-${name}.png` });

  await shot("00-default");
  // the rail: every aria-pressed button in the left 70px below the top bar, in order
  const rail = [];
  for (const b of await page.locator("button[aria-pressed]").all()) {
    const box = await b.boundingBox();
    if (box && box.x < 70 && box.y > 50) rail.push({ b, name: (await b.getAttribute("aria-label")) ?? "tab" });
  }
  let i = 0;
  for (const { b, name } of rail) {
    await b.click(); await page.waitForTimeout(500);
    await shot(`left-${i++}-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 20)}`);
  }
  await canvas.locator("h1").first().click();
  await page.waitForTimeout(500);
  await shot("selected-heading");
  await canvas.locator("section, [data-ws-component='Box']").first().click({ position: { x: 8, y: 8 } }).catch(() => {});
  await page.waitForTimeout(500);
  await shot("selected-section");
  for (const tab of ["Props", "Settings"]) {
    const t = page.getByRole("button", { name: tab, exact: true }).or(page.getByText(tab, { exact: true })).first();
    if (await t.count()) { await t.click().catch(() => {}); await page.waitForTimeout(300); await shot(`right-${tab.toLowerCase()}`); }
  }
  const tools = page.getByRole("button", { name: /^Tools/ });
  if (await tools.count()) { await tools.first().click(); await page.waitForTimeout(300); await shot("menu-tools"); await page.keyboard.press("Escape"); }
  const exp = page.getByRole("button", { name: /^Export/ });
  if (await exp.count()) { await exp.first().click(); await page.waitForTimeout(300); await shot("menu-export"); await page.keyboard.press("Escape"); }
  console.log(tag, "console errors:", errors.length, errors.slice(0, 3));
  await ctx.close();
}
await browser.close();
