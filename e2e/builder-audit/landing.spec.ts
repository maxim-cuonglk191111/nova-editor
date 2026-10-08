import { test, expect } from "@playwright/test";
test("landing renders after the split", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page.locator("h1").first()).toBeVisible({ timeout: 60_000 });
  expect(await page.locator(".origin-home").evaluate((e) => getComputedStyle(e).backgroundColor)).toBe("rgb(15, 16, 17)");
  await page.screenshot({ path: "qa-screenshots/builder-audit/l01-landing.png" });
  expect(errors).toEqual([]);
});
