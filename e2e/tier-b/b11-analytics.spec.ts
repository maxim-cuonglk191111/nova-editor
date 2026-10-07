// B11 — Analytics: a logged-out visit to the public preview records a page view that the
// owner then sees on /analytics/<id> (reached from the dashboard card).
//   BASE_URL=... npx playwright test -c playwright.cloud.config.ts e2e/tier-b/b11-analytics.spec.ts
import { test, expect, type Page } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { freshAccount, seedProject, deleteFreshAccount, type FreshAccount } from "../helpers/fresh-account";

const OUT = "qa-screenshots/tier-b";
mkdirSync(OUT, { recursive: true });
let acc: FreshAccount | undefined;
test.afterAll(async () => deleteFreshAccount(acc));

const totalViewsCard = (page: Page) =>
  page.getByText(/^TOTAL VIEWS/).locator("xpath=..");

test("B11 preview visit shows up in analytics", async ({ page, browser }) => {
  acc = await freshAccount(page, "b11");
  const id = await seedProject(page, "Analytics Cafe");

  await page.goto("/projects");
  const card = page.locator("div", { has: page.locator('[title="Analytics Cafe"]') }).filter({ has: page.locator('button[title="Delete site"]') }).last();
  await card.locator('button[title="View analytics"]').click();
  await page.waitForURL(new RegExp(`/analytics/${id}`));
  await expect(page.getByText("No views yet")).toBeVisible({ timeout: 60_000 });
  await page.screenshot({ path: `${OUT}/b11-01-analytics-empty.png` });

  // Anonymous visitor opens the share link.
  const visitor = await browser.newContext({ baseURL: process.env.BASE_URL, viewport: { width: 1440, height: 900 } });
  const v = await visitor.newPage();
  const beacon = v.waitForResponse((r) => r.url().includes("/api/analytics/track") && r.request().method() === "POST", { timeout: 120_000 });
  await v.goto(`/preview/${id}`);
  expect((await beacon).status()).toBe(200);
  await v.frameLocator('iframe[title="Preview"]').locator("h1").first().waitFor({ timeout: 120_000 });
  await v.screenshot({ path: `${OUT}/b11-02-visitor-preview.png` });
  await visitor.close();

  await page.reload();
  await expect(page.getByText("No views yet")).toHaveCount(0, { timeout: 60_000 });
  await expect(totalViewsCard(page)).toContainText(/TOTAL VIEWS[\s\S]*\b1\b/);
  const stats = (await (await page.request.get(`/api/analytics/${id}?days=30`)).json()) as { totalViews: number; topPages: { path: string }[] };
  expect(stats.totalViews).toBe(1);
  expect(stats.topPages[0]?.path, "records the site page, not the /preview URL").toBe("/");
  await page.screenshot({ path: `${OUT}/b11-03-analytics-one-view.png`, fullPage: true });
});
