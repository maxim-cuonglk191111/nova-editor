import { test, expect, type Page } from "@playwright/test";

// First-purchase prices + price points. /api/promo is answered by the test so the UI can be checked
// without a bank account configured; the server-side rules (who is eligible, the amount
// saved on the order) are covered by unit tests in src/lib/__tests__/promo.test.ts.

const OFFER = { active: true, endsAt: "2026-12-26T23:59:59+07:00", eligible: null };

async function answerPromo(page: Page, body: object) {
  await page.route("**/api/promo", (route) => route.fulfill({ contentType: "application/json", body: JSON.stringify(body) }));
}

test("list prices end in 9 and Pro is 249,000", async ({ page }) => {
  await answerPromo(page, { ...OFFER, active: false });
  await page.addInitScript(() => localStorage.setItem("nova_locale", "en"));
  await page.goto("/pricing");
  await expect(page.getByText("249,000 VND")).toBeVisible({ timeout: 30_000 });
  const prices = (await page.locator("main").innerText()).match(/[\d,]+ VND/g) ?? [];
  expect(prices).toEqual(expect.arrayContaining(["249,000 VND", "1,289,000 VND"]));
  for (const p of prices.filter((x) => x !== "0 VND")) expect(p).toMatch(/9,000 VND$/); // Free is 0
  await expect(page.locator(".promo")).toHaveCount(0);
});

test("a visitor who never bought sees the banner, the end date, the first-purchase label and struck-through prices", async ({ page }) => {
  await answerPromo(page, OFFER);
  await page.addInitScript(() => localStorage.setItem("nova_locale", "en"));
  await page.goto("/pricing");
  const banner = page.locator(".promo");
  await expect(banner).toBeVisible({ timeout: 30_000 });
  await expect(banner).toContainText("First purchase: Pro for 129,000 VND instead of 249,000 VND");
  await expect(banner).toContainText("26 December 2026");
  await expect(banner.getByRole("link", { name: /free account/i })).toHaveAttribute("href", "/signup");
  await expect(page.locator("s", { hasText: "249,000 VND" })).toBeVisible();
  await expect(page.getByText("129,000 VND", { exact: false }).first()).toBeVisible();
  await expect(page.getByText("649,000 VND")).toBeVisible();
  await expect(page.getByText("First purchase", { exact: true }).first()).toBeVisible();
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
  await expect(page.locator(".promo")).toContainText("Lần mua đầu tiên: gói Pro chỉ 129.000 VND", { timeout: 30_000 });
});
