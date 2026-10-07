// B7 — Templates panel: "Use Template" puts the template's sections on the canvas; they survive save + reload.
//   BASE_URL=... npx playwright test -c playwright.cloud.config.ts e2e/tier-b/b7-templates.spec.ts
import { test, expect } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { freshAccount, seedProject, openBuilder, deleteFreshAccount, type FreshAccount } from "../helpers/fresh-account";

const OUT = "qa-screenshots/tier-b";
mkdirSync(OUT, { recursive: true });
let acc: FreshAccount | undefined;
test.afterAll(async () => deleteFreshAccount(acc));

test("B7 templates insert and persist", async ({ page }) => {
  acc = await freshAccount(page, "b7");
  const id = await seedProject(page, "Template Coffee");
  await openBuilder(page, id);
  const canvas = page.frameLocator('iframe[title="Canvas"]');
  const originalH1 = (await canvas.locator("h1").first().innerText()).trim();
  const before = await canvas.locator("body *").count();
  await page.locator('button[aria-label="Templates"]').click();
  await page.screenshot({ path: `${OUT}/b7-01-templates-panel.png` });

  // Landing Hero, then Feature Cards
  const card = (name: string) => page.locator("div", { hasText: name }).filter({ has: page.getByRole("button", { name: /use template|applied/i }) }).last();
  await card("Landing Hero").getByRole("button", { name: /use template/i }).click();
  await expect(canvas.getByText("Build Something Amazing")).toBeVisible({ timeout: 30_000 });
  await expect(canvas.getByRole("button", { name: "Get Started Free" })).toBeVisible();
  await page.screenshot({ path: `${OUT}/b7-02-hero-applied.png` });
  const afterHero = await canvas.locator("body *").count();
  const originalStillThere = await canvas.getByText(originalH1).count();
  console.log(`elements before=${before} afterHero=${afterHero} originalH1 still on page=${originalStillThere}`);

  // Templates add to the page — the existing landing content must still be there.
  expect.soft(originalStillThere, "template appended, page kept").toBeGreaterThan(0);

  // Save + reload
  await page.getByRole("button", { name: /^save$/i }).click();
  await page.getByRole("button", { name: /^update$/i }).click();
  await page.waitForURL(/\/projects/, { timeout: 60_000 });
  await page.goto(`/builder/${id}`);
  await expect(canvas.getByText("Build Something Amazing")).toBeVisible({ timeout: 120_000 });
  await expect(canvas.getByRole("button", { name: "See a Demo" })).toBeVisible();
  await page.screenshot({ path: `${OUT}/b7-03-after-reload.png` });
});
