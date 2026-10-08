// B6 — the CSS Vars / Custom CSS panels are hidden (Tier C since 25.9.0), but values a project
// already holds must keep working: a stored variable used by a stored custom rule shows in the
// canvas, Preview and Export HTML.
//   BASE_URL=... npx playwright test -c playwright.cloud.config.ts e2e/tier-b/b6-css-vars.spec.ts
import { test, expect, type Locator } from "@playwright/test";
import { mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { freshAccount, openBuilder, deleteFreshAccount, type FreshAccount } from "../helpers/fresh-account";

const OUT = "qa-screenshots/tier-b";
mkdirSync(OUT, { recursive: true });
let acc: FreshAccount | undefined;
test.afterAll(async () => deleteFreshAccount(acc));

const PINK = "rgb(255, 0, 128)";
const RULE = "h1 { color: var(--qa-brand) !important; outline: 4px dashed var(--qa-brand); }";
const LANDING = JSON.parse(readFileSync(join(__dirname, "../fixtures/landing.schema.json"), "utf8"));
const color = (l: Locator) => l.evaluate((el) => getComputedStyle(el).color);

test("B6 stored CSS variables + Custom CSS reach canvas, preview and export", async ({ page }) => {
  acc = await freshAccount(page, "b6");
  const now = new Date().toISOString();
  const r0 = await page.request.post("/api/projects", {
    data: { name: "Vars Coffee", schema_json: { schemaVersion: "5.0", meta: { name: "Vars Coffee", createdAt: now, updatedAt: now }, data: LANDING, cssVars: { "qa-brand": PINK }, customCss: RULE } },
  });
  expect(r0.status()).toBe(201);
  const { id } = (await r0.json()) as { id: string };

  // Canvas
  await openBuilder(page, id);
  const canvasH1 = page.frameLocator('iframe[title="Canvas"]').locator("h1").first();
  await expect.poll(() => color(canvasH1)).toBe(PINK);
  await page.screenshot({ path: `${OUT}/b6-02-custom-css-canvas.png` });

  // Preview
  await page.goto(`/preview/${id}`);
  const previewH1 = page.frameLocator("iframe").first().locator("h1").first();
  await previewH1.waitFor({ timeout: 120_000 });
  await expect.poll(() => color(previewH1)).toBe(PINK);
  await page.screenshot({ path: `${OUT}/b6-03-preview.png` });

  // Export HTML
  const r = await page.request.get(`/api/export/${id}`);
  expect(r.status()).toBe(200);
  const html = await r.text();
  expect(html).toContain(RULE);
  expect(html, "export defines the variable").toContain("--qa-brand:");
  await page.setContent(html, { waitUntil: "load" });
  await page.screenshot({ path: `${OUT}/b6-04-export.png` });
  await expect.poll(() => color(page.locator("h1").first())).toBe(PINK);
});
