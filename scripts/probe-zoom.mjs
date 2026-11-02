import { chromium } from "@playwright/test";
const browser = await chromium.launch({ executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
await ctx.addInitScript(() => { localStorage.setItem("nova_locale", "en"); localStorage.setItem("nova-coachmarks-seen", "1"); });
const page = await ctx.newPage();
await page.goto("http://localhost:3001/builder/demo");
await page.frameLocator('iframe[src*="/canvas"]').locator("h1").first().waitFor({ timeout: 90000 });
const zin = page.locator('button[title="Zoom in"]');
console.log("count", await zin.count());
const label = async () => (await page.locator('button[title*="Reset zoom"]').first().innerText().catch(() => "?"));
console.log("before", await label());
try { await zin.click({ timeout: 5000 }); } catch (e) { console.log("click failed:", String(e).split("\n").slice(0, 6).join(" | ")); }
console.log("after", await label());
await browser.close();
