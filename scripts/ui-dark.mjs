// Task 038 — what the builder looks like with the DARK palette (there is no theme switch yet):
// the DARK values are read from lib/uiTheme.ts and set as the --ui-* variables on the builder root.
//   node scripts/ui-dark.mjs [outDir] [baseUrl]
import { chromium } from "@playwright/test";
import { mkdirSync, readFileSync } from "node:fs";

const out = process.argv[2] ?? "doc/screenshots/.temp/ui-dark";
const base = process.argv[3] ?? "http://localhost:3001";
mkdirSync(out, { recursive: true });

const theme = readFileSync("apps/nova-builder/src/lib/uiTheme.ts", "utf8");
const block = theme.slice(theme.indexOf("export const DARK = {"), theme.indexOf("} as const;", theme.indexOf("export const DARK = {")));
const vars = {};
for (const m of block.matchAll(/^\s{2}(\w+): "([^"]*)"/gm)) {
  if (["font", "fontMono", "mono"].includes(m[1])) continue;
  vars["--ui-" + m[1].replace(/[A-Z]/g, (c) => "-" + c.toLowerCase())] = m[2];
}

const browser = await chromium.launch({ executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
await ctx.addInitScript(() => { localStorage.setItem("nova_locale", "en"); localStorage.setItem("nova-coachmarks-seen", "1"); });
const page = await ctx.newPage();
await page.goto(`${base}/builder/demo`);
const canvas = page.frameLocator('iframe[src*="/canvas"]');
await canvas.locator("h1").first().waitFor({ timeout: 90_000 });
await page.evaluate((v) => { const root = document.querySelector(".nb-root"); for (const [k, val] of Object.entries(v)) root.style.setProperty(k, val); }, vars);
const shot = async (name) => { await page.waitForTimeout(500); await page.screenshot({ path: `${out}/${name}.png` }); console.log("shot", name); };
await shot("k0-default");
await page.locator('button[aria-label="Components"][aria-pressed]').click();
await page.locator("nav button").first().click();
await shot("k1-add");
await page.keyboard.press("Escape");
await page.locator('button[aria-label="AI"][aria-pressed]').click();
await shot("k2-ai");
await canvas.locator("section, [data-ws-component='Box']").first().click({ position: { x: 8, y: 8 } }).catch(() => {});
await page.getByRole("button", { name: "Tools", exact: true }).click();
await shot("k3-menu");
await page.keyboard.press("Escape");
await page.keyboard.press("Control+k");
await shot("k4-palette");
await browser.close();
