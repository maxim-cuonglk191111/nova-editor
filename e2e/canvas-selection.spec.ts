// Regression: the selection indicator stays on the canvas through common edits
// (it used to vanish after delete/undo until the next click or drag).
//   BASE_URL=... npx playwright test e2e/canvas-selection.spec.ts -c playwright.cloud.config.ts
import { test, expect, type Page, type FrameLocator } from "@playwright/test";

async function openAiProject(page: Page): Promise<FrameLocator> {
  await page.addInitScript(() => {
    localStorage.setItem("nova_locale", "en");
    localStorage.setItem("nova-tour-done", "1");
  });
  await page.goto("/login");
  await page.locator('input[type="email"]').fill(process.env.QA_EMAIL ?? "qa.cloud.1791213340319@testqa.dev");
  await page.locator('input[type="password"]').fill(process.env.QA_PASSWORD ?? "QaCloud!2026");
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(/projects/, { timeout: 120_000 });
  const card = page.locator("div", { hasText: new RegExp(process.env.QA_PROJECT ?? "bakery", "i") })
    .filter({ has: page.getByRole("button", { name: /^edit$/i }) })
    .last();
  await card.getByRole("button", { name: /^edit$/i }).click();
  await page.waitForURL(/\/builder\/(?!demo)/);
  const canvas = page.frameLocator('iframe[title="Canvas"]');
  await canvas.locator("h1").first().waitFor({ timeout: 120_000 });
  return canvas;
}

test("selection indicator follows the selection through edits", async ({ page }) => {
  test.setTimeout(240_000);
  const canvas = await openAiProject(page);

  const expectIndicator = async (step: string) => {
    await page.waitForTimeout(400);
    const box = await canvas.locator("[data-nova-overlay] > div").first().boundingBox({ timeout: 3000 }).catch(() => null);
    const selected = await canvas.locator("[data-ws-selected]").first().boundingBox({ timeout: 3000 }).catch(() => null);
    expect(box, `indicator after: ${step}`).not.toBeNull();
    expect(selected, `selection after: ${step}`).not.toBeNull();
    expect(Math.abs(box!.x - selected!.x) + Math.abs(box!.y - selected!.y), `indicator position after: ${step}`).toBeLessThan(4);
  };

  await canvas.locator("h1").first().click();
  await expectIndicator("click h1");
  await canvas.locator("p").nth(1).dblclick();
  await canvas.locator("h2").first().click();
  await expectIndicator("inline edit, then click elsewhere");
  const headings = canvas.locator('[data-ws-component="Heading"]');
  const headingCount = await headings.count();
  await canvas.locator("h2").first().click();
  await page.keyboard.press("ControlOrMeta+d");
  await expectIndicator("duplicate");
  await page.keyboard.press("Delete");
  await expectIndicator("delete selects a neighbour");
  await page.keyboard.press("ControlOrMeta+z");
  await expectIndicator("undo");
  // Undo the duplicate too, so the project is left as it was.
  await page.keyboard.press("ControlOrMeta+z");
  await expect(headings).toHaveCount(headingCount);
  await page.getByRole("button", { name: /^mobile p$/i }).click();
  await expectIndicator("switch to mobile breakpoint");
  await page.getByRole("button", { name: /^desktop$/i }).click();
  await expectIndicator("back to desktop");
});
