// Task 038 — the builder on a phone-sized screen (390x844).
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";
const out = process.argv[2] ?? "doc/screenshots/.temp/ui-390";
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", headless: true });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, deviceScaleFactor: 2 });
await ctx.addInitScript(() => { localStorage.setItem("nova_locale", "en"); localStorage.setItem("nova-coachmarks-seen", "1"); });
const page = await ctx.newPage();
await page.goto("http://localhost:3001/builder/demo");
await page.waitForTimeout(9000);
await page.screenshot({ path: `${out}/m0-default.png` });
const overflow = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
console.log("scrollWidth", overflow.sw, "clientWidth", overflow.cw);
await browser.close();
