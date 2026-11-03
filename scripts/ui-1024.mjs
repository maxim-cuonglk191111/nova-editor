// Task 038 — the 1024px layout: drawer, inspector hide / resize / persistence, drop with the drawer open.
//   node scripts/ui-1024.mjs [outDir] [baseUrl]
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";

const out = process.argv[2] ?? "doc/screenshots/.temp/ui-1024";
const base = process.argv[3] ?? "http://localhost:3001";
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", headless: true });
const ctx = await browser.newContext({ viewport: { width: 1024, height: 768 } });
await ctx.addInitScript(() => { if (!sessionStorage.getItem("seeded")) { localStorage.setItem("nova_locale", "en"); localStorage.setItem("nova-coachmarks-seen", "1"); sessionStorage.setItem("seeded", "1"); } });
const page = await ctx.newPage();
const results = [];
const check = (name, ok, detail = "") => { results.push({ name, ok }); console.log(ok ? "PASS" : "FAIL", name, detail); };
const shot = async (name) => { await page.waitForTimeout(450); await page.screenshot({ path: `${out}/${name}.png` }); };
const canvasW = async () => (await page.locator('iframe[title="Canvas"]').boundingBox())?.width ?? 0;
const inspectorW = async () => (await page.locator('[role="tablist"]').first().boundingBox())?.width ?? 0;

await page.goto(`${base}/builder/demo`);
const canvas = page.frameLocator('iframe[src*="/canvas"]');
await canvas.locator("h1").first().waitFor({ timeout: 90_000 });

await shot("d0-default");
const w0 = await canvasW();
check("first visit at 1024: no drawer open, canvas has room", w0 > 400, `canvas ${Math.round(w0)}px`);

// drawer over the canvas
await page.locator('button[aria-label="Navigator"][aria-pressed]').click();
await shot("d1-drawer-layers");
const w1 = await canvasW();
check("opening the drawer does not resize the canvas", Math.abs(w1 - w0) < 4, `${Math.round(w0)} -> ${Math.round(w1)}`);

// Add drawer + floating thumbnails
await page.locator('button[aria-label="Components"][aria-pressed]').click();
await page.locator("nav button").first().click();
await shot("d2-drawer-add");

// the drawer steps aside while a card is dragged, and the drop lands
const before = await canvas.locator("h1, h2, h3, p, button, section, div").count();
const card = page.locator('[data-testid="add-flyout"] [role="button"]').first();
const box = await card.boundingBox();
await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
await page.mouse.down();
await page.mouse.move(300, 400, { steps: 12 });
const hidden = await page.evaluate(() => getComputedStyle(document.querySelector(".nb-drawer")).opacity);
check("drawer hides while dragging", Number(hidden) < 0.2, `opacity ${hidden}`);
await shot("d3-dragging");
await page.mouse.up();
await page.waitForTimeout(600);
const after = await canvas.locator("h1, h2, h3, p, button, section, div").count();
check("drop on the part of the canvas the drawer covered inserts the component", after > before, `${before} -> ${after}`);

// inspector: hide, show, resize, persist
await page.mouse.click(700, 300);
const iw0 = await inspectorW();
await page.getByRole("button", { name: "Show or hide the inspector" }).first().click();
await page.waitForTimeout(500);
const wClosed = await canvasW();
check("hiding the inspector gives the canvas the room", wClosed > w0 + 150, `${Math.round(w0)} -> ${Math.round(wClosed)}`);
await shot("d4-inspector-closed");
await page.getByRole("button", { name: "Show or hide the inspector" }).last().click();
await page.waitForTimeout(500);
check("showing it again restores the width", Math.abs((await inspectorW()) - iw0) < 4);
const handle = page.locator('[title*="resize" i]').last();
const hb = await handle.boundingBox();
await page.mouse.move(hb.x + 3, hb.y + 200);
await page.mouse.down();
await page.mouse.move(hb.x - 90, hb.y + 200, { steps: 8 });
await page.mouse.up();
const iw1 = await inspectorW();
check("dragging the inspector's left edge widens it", iw1 > iw0 + 60, `${Math.round(iw0)} -> ${Math.round(iw1)}`);
await shot("d5-inspector-wider");
await page.reload();
await canvas.locator("h1").first().waitFor({ timeout: 90_000 });
check("the width is remembered after a reload", Math.abs((await inspectorW()) - iw1) < 4, `${Math.round(await inspectorW())}`);
await page.getByRole("button", { name: "Show or hide the inspector" }).first().click();
await page.reload();
await canvas.locator("h1").first().waitFor({ timeout: 90_000 });
check("closed state is remembered after a reload", (await page.locator('[role="tablist"]').count()) === 0);
await browser.close();
console.log(results.every((r) => r.ok) ? "ALL PASS" : "SOME FAILED");
