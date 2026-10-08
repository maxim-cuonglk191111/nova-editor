// B10 — Accessibility check (Tools menu): clearing an image's alt text in the Props panel
// makes the checker report "Image is missing alt text" for that image.
//   BASE_URL=... npx playwright test -c playwright.cloud.config.ts e2e/tier-b/b10-a11y-check.spec.ts
import { test, expect, type Page } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { freshAccount, seedProject, openBuilder, deleteFreshAccount, type FreshAccount } from "../helpers/fresh-account";

const OUT = "qa-screenshots/tier-b";
mkdirSync(OUT, { recursive: true });
let acc: FreshAccount | undefined;
test.afterAll(async () => deleteFreshAccount(acc));

const MISSING_ALT = "This image has no description";

async function runCheck(page: Page) {
  const panel = page.locator('[role="dialog"][aria-label="Accessibility Checker"]');
  if (!(await panel.isVisible())) {
    await page.getByRole("button", { name: /^tools/i }).click();
    await page.getByRole("menuitem", { name: /accessibility/i }).first().click();
  }
  const res = page.waitForResponse((r) => r.url().includes("/api/ai/a11y"), { timeout: 120_000 });
  await panel.getByRole("button", { name: "Run Check" }).click();
  expect((await res).status()).toBe(200);
  await expect(panel.getByRole("button", { name: "Run Check" })).toBeVisible({ timeout: 30_000 });
  return panel;
}

test("B10 accessibility check flags an image without alt", async ({ page }) => {
  test.setTimeout(300_000);
  acc = await freshAccount(page, "b10");
  // The first-visit coach-marks tour puts a click-blocking backdrop over the top bar.
  await page.context().addInitScript(() => localStorage.setItem("nova-coachmarks-seen", "1"));
  const id = await seedProject(page, "A11y Cafe");
  await openBuilder(page, id);
  const canvas = page.frameLocator('iframe[title="Canvas"]');

  // Baseline: both fixture images have alt text, so no img-alt issue.
  let panel = await runCheck(page);
  await expect(panel.getByText(MISSING_ALT)).toHaveCount(0);
  await page.screenshot({ path: `${OUT}/b10-01-baseline.png` });
  await panel.getByRole("button", { name: "×" }).click();

  // Clear the alt of the first image through the Props panel.
  const img = canvas.locator('img[alt="Coffee beans and a cup of coffee"]');
  await img.scrollIntoViewIfNeeded();
  await img.click();
  await page.locator('[role="tab"]').filter({ hasText: /^props$/i }).first().click();
  const altRow = page.locator("div", { has: page.locator("label", { hasText: /^alt/i }) }).filter({ has: page.locator("input") }).last();
  const altInput = altRow.locator("input").first();
  await expect(altInput).toHaveValue("Coffee beans and a cup of coffee");
  await altInput.fill("");
  await expect(canvas.locator('img[alt="Coffee beans and a cup of coffee"]')).toHaveCount(0);
  await page.screenshot({ path: `${OUT}/b10-02-alt-cleared.png` });

  panel = await runCheck(page);
  await expect(panel.getByText(MISSING_ALT).first()).toBeVisible();
  await expect(panel.locator('[title*="img-alt"]')).not.toHaveCount(0); // rule id kept as the technical hint
  await expect(panel.getByText(/\d+ errors?/)).toBeVisible();
  await page.screenshot({ path: `${OUT}/b10-03-issue-listed.png` });
});
