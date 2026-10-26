import { test, expect } from "@playwright/test";
test("landing renders after the split", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page.locator("h1").first()).toBeVisible({ timeout: 60_000 });
  expect(await page.locator(".lp").evaluate((e) => getComputedStyle(e).backgroundColor)).toBe("rgb(243, 239, 230)");
  await page.screenshot({ path: "qa-screenshots/builder-audit/l01-landing.png" });
  expect(errors).toEqual([]);
});

test("landing has no dead links", async ({ page, request }) => {
  await page.goto("/");
  await expect(page.locator("h1").first()).toBeVisible({ timeout: 60_000 });
  const hrefs = await page.locator("a[href]").evaluateAll((els) => [...new Set(els.map((e) => e.getAttribute("href") ?? ""))]);
  expect(hrefs).not.toContain("/docs");
  for (const href of hrefs.filter((h) => h.startsWith("/"))) {
    const [path, hash] = href.split("#");
    const res = await request.get(path || "/", { timeout: 120_000 });
    expect(res.status(), `${href} should resolve`).toBeLessThan(400);
    if (hash) await expect(page.locator(`[id="${hash}"]`)).toHaveCount(1);
  }
});
