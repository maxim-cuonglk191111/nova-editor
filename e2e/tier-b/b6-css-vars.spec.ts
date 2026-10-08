// B6 — a CSS variable (CSS Vars panel) used by a Custom CSS rule shows in canvas, Preview and Export HTML.
//   BASE_URL=... npx playwright test -c playwright.cloud.config.ts e2e/tier-b/b6-css-vars.spec.ts
import { test, expect, type Locator } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { freshAccount, seedProject, openBuilder, deleteFreshAccount, type FreshAccount } from "../helpers/fresh-account";

const OUT = "qa-screenshots/tier-b";
mkdirSync(OUT, { recursive: true });
let acc: FreshAccount | undefined;
test.afterAll(async () => deleteFreshAccount(acc));

const PINK = "rgb(255, 0, 128)";
const RULE = "h1 { color: var(--qa-brand) !important; outline: 4px dashed var(--qa-brand); }";
const color = (l: Locator) => l.evaluate((el) => getComputedStyle(el).color);

test("B6 CSS variables + Custom CSS reach preview and export", async ({ page }) => {
  acc = await freshAccount(page, "b6");
  const id = await seedProject(page, "Vars Coffee");
  await openBuilder(page, id);
  const canvasH1 = page.frameLocator('iframe[title="Canvas"]').locator("h1").first();

  // Add the variable
  await page.locator('button[aria-label="CSS Vars"]').click();
  await page.getByPlaceholder(/^name \(e\.g\./).fill("qa-brand");
  await page.getByPlaceholder(/^value \(e\.g\./).fill(PINK);
  await page.getByRole("button", { name: "+ Add variable" }).click();
  await expect(page.getByText("--qa-brand")).toBeVisible();
  await page.screenshot({ path: `${OUT}/b6-01-var-added.png` });

  // Use it from a custom rule
  await page.locator('button[aria-label="Custom CSS"]').click();
  await page.locator("textarea").first().fill(RULE);
  await expect.poll(() => color(canvasH1)).toBe(PINK);
  await page.screenshot({ path: `${OUT}/b6-02-custom-css-canvas.png` });

  // Save
  await page.getByRole("button", { name: /^save$/i }).click();
  await page.getByRole("button", { name: /^update$/i }).click();
  await expect(page.getByRole("alert").filter({ hasText: /saved/i })).toBeVisible({ timeout: 60_000 }); // Update stays in the editor (25.11.0)
  const saved = (await (await page.request.get(`/api/projects/${id}`)).json()) as { cssVars: Record<string, string>; customCss: string };
  expect(saved.cssVars).toEqual({ "qa-brand": PINK });
  expect(saved.customCss).toBe(RULE);

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
  await page.setContent(html, { waitUntil: "load" });
  await page.screenshot({ path: `${OUT}/b6-04-export.png` });
  expect(html, "export defines the variable").toContain("--qa-brand:");
  await expect.poll(() => color(page.locator("h1").first())).toBe(PINK);
});
