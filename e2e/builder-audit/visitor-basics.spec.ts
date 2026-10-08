// Task 009 batch 4 — the parts of "what the visitor gets" that need no AI: on the seeded
// landing page, a signed-out visitor sees every image of the preview, and the HTML export
// keeps the look of library buttons (Tailwind's preflight used to make them transparent).
//   pwsh scripts/audit-run.ps1 e2e/builder-audit/visitor-basics.spec.ts
import { test, expect } from "@playwright/test";
import { freshAccount, seedProject, deleteFreshAccount, type FreshAccount } from "../helpers/fresh-account";
import { OUT } from "./audit";

let acc: FreshAccount | undefined;
test.afterAll(async () => deleteFreshAccount(acc));

test("signed-out visitor sees the images; export keeps button styles", async ({ page, browser }) => {
  acc = await freshAccount(page, "vbasics");
  const id = await seedProject(page, "Visitor Basics");

  const visitor = await browser.newContext({ baseURL: process.env.BASE_URL, viewport: { width: 1440, height: 900 } });
  const v = await visitor.newPage();
  await v.goto(`/preview/${id}`);
  const site = v.frameLocator('iframe[title="Preview"]');
  await site.locator("h1").first().waitFor({ timeout: 120_000 });
  const frame = () => v.frames().find((f) => f !== v.mainFrame())!;
  // Scroll through so lazy images load, then count the broken ones.
  const h = await frame().evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < h; y += 700) { await frame().evaluate((yy) => window.scrollTo(0, yy), y); await v.waitForTimeout(300); }
  await expect.poll(() => frame().evaluate(() => Array.from(document.images).filter((i) => !i.complete).length), { timeout: 30_000 }).toBe(0);
  const images = await frame().evaluate(() => Array.from(document.images).map((i) => ({ src: i.currentSrc.slice(0, 90), ok: i.naturalWidth > 0 })));
  console.log("preview images (signed out):", JSON.stringify(images));
  await frame().evaluate(() => window.scrollTo(0, 0));
  await v.screenshot({ path: `${OUT}/vb01-preview-signed-out.png` });
  expect(images.length).toBeGreaterThan(0);
  expect(images.filter((i) => !i.ok), "broken images for a signed-out visitor").toEqual([]);
  await visitor.close();

  const html = await (await page.request.get(`/api/export/${id}`)).text();
  await page.setContent(html, { waitUntil: "load" });
  await page.waitForTimeout(1_500);
  const buttons = await page.locator('[data-ws-component="shadcn:Button"]').evaluateAll((els) =>
    els.map((e) => ({ text: (e.textContent ?? "").trim(), bg: getComputedStyle(e).backgroundColor, padding: getComputedStyle(e).paddingLeft })));
  console.log("export buttons:", JSON.stringify(buttons));
  await page.screenshot({ path: `${OUT}/vb02-export.png` });
  expect(buttons.length).toBeGreaterThan(0);
  for (const b of buttons) {
    expect(b.bg, `"${b.text}" has a background in the export`).not.toBe("rgba(0, 0, 0, 0)");
    expect(b.padding, `"${b.text}" keeps its padding`).not.toBe("0px");
  }
});
