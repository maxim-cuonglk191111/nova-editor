import { test, expect, type Page } from "@playwright/test";

// Welcome offer + price points. /api/promo is answered by the test so the UI can be checked
// without a bank account configured; the server-side rules (who is eligible, the amount
// saved on the order) are covered by unit tests in src/lib/__tests__/promo.test.ts.

const OFFER = { active: true, percentOff: 50, endsAt: "2026-12-26T23:59:59+07:00", eligible: null };

async function answerPromo(page: Page, body: object) {
  await page.route("**/api/promo", (route) => route.fulfill({ contentType: "application/json", body: JSON.stringify(body) }));
}

test("list prices end in 9 and Pro is 499,000", async ({ page }) => {
  await answerPromo(page, { ...OFFER, active: false });
  await page.addInitScript(() => localStorage.setItem("nova_locale", "en"));
  await page.goto("/pricing");
  await expect(page.getByText("499,000 VND")).toBeVisible({ timeout: 30_000 });
  const prices = (await page.locator("main").innerText()).match(/[\d,]+ VND/g) ?? [];
  expect(prices).toEqual(expect.arrayContaining(["499,000 VND", "1,289,000 VND"]));
  for (const p of prices.filter((x) => x !== "0 VND")) expect(p).toMatch(/9,000 VND$/); // Free is 0
  await expect(page.locator(".promo")).toHaveCount(0);
});

test("a visitor sees the banner with the real end date and struck-through prices", async ({ page }) => {
  await answerPromo(page, OFFER);
  await page.addInitScript(() => localStorage.setItem("nova_locale", "en"));
  await page.goto("/pricing");
  const banner = page.locator(".promo");
  await expect(banner).toBeVisible({ timeout: 30_000 });
  await expect(banner).toContainText("50% off your first purchase");
  await expect(banner).toContainText("26 December 2026");
  await expect(banner.getByRole("link", { name: /free account/i })).toHaveAttribute("href", "/signup");
  await expect(page.locator("s", { hasText: "499,000 VND" })).toBeVisible();
  await expect(page.getByText("249,500 VND")).toBeVisible();
  await expect(page.getByText("644,500 VND")).toBeVisible();
});

test("the banner can be dismissed and stays dismissed", async ({ page }) => {
  await answerPromo(page, OFFER);
  await page.goto("/pricing");
  await expect(page.locator(".promo")).toBeVisible({ timeout: 30_000 });
  await page.getByRole("button", { name: /dismiss/i }).click();
  await expect(page.locator(".promo")).toHaveCount(0);
  await page.reload();
  await page.waitForLoadState("networkidle");
  await expect(page.locator(".promo")).toHaveCount(0);
});

test("an account that already paid sees no offer and the regular price", async ({ page }) => {
  await answerPromo(page, { ...OFFER, eligible: false });
  await page.goto("/pricing");
  await page.waitForLoadState("networkidle");
  await expect(page.locator(".promo")).toHaveCount(0);
  await expect(page.locator("s")).toHaveCount(0);
});

test("vietnamese banner copy", async ({ page }) => {
  await answerPromo(page, OFFER);
  await page.addInitScript(() => localStorage.setItem("nova_locale", "vi"));
  await page.goto("/pricing");
  await expect(page.locator(".promo")).toContainText("giảm 50% cho lần mua đầu tiên", { timeout: 30_000 });
});
