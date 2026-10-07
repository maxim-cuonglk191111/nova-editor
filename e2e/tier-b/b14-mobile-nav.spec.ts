// B14 — the AI page's navbar stays one compact row (or collapses to a menu button)
// on phones: builder breakpoint "Mobile P" and the preview at 390px.
// Known bug at the time of writing: the header wraps into a stacked column.
//   BASE_URL=... npx playwright test -c playwright.cloud.config.ts e2e/tier-b/b14-mobile-nav.spec.ts
import { test, expect, type Locator } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { freshAccount, seedProject, openBuilder, deleteFreshAccount, type FreshAccount } from "../helpers/fresh-account";

const OUT = "qa-screenshots/tier-b";
mkdirSync(OUT, { recursive: true });
let acc: FreshAccount | undefined;
test.afterAll(async () => deleteFreshAccount(acc));

// Header height, and how many distinct rows its visible nav links occupy.
const navLayout = (header: Locator) =>
  header.evaluate((h) => {
    const links = [...h.querySelectorAll("nav a")].filter((a) => (a as HTMLElement).offsetParent !== null);
    const rows = new Set(links.map((a) => Math.round(a.getBoundingClientRect().top / 8)));
    return { height: Math.round(h.getBoundingClientRect().height), visibleLinks: links.length, linkRows: rows.size };
  });
const expectCompact = async (header: Locator, where: string) => {
  const layout = await navLayout(header);
  console.log(`${where}: ${JSON.stringify(layout)}`);
  expect.soft(layout.linkRows, `${where}: nav links on one row (or hidden)`).toBeLessThanOrEqual(1);
  expect.soft(layout.height, `${where}: header is one compact row`).toBeLessThanOrEqual(90);
};

test("B14 navbar does not stack into a column on mobile", async ({ page, context }) => {
  // The helper skips the tour ("nova-tour-done") but not the builder coach marks, whose overlay eats clicks.
  await page.context().addInitScript(() => localStorage.setItem("nova-coachmarks-seen", "1"));
  acc = await freshAccount(page, "b14");
  const id = await seedProject(page, "B14 Mobile Nav");
  await openBuilder(page, id);
  const canvas = page.frameLocator('iframe[title="Canvas"]');
  await page.getByRole("button", { name: /^mobile p$/i }).click();
  await expect.poll(async () => (await page.locator('iframe[title="Canvas"]').boundingBox())?.width ?? 9999).toBeLessThan(500);
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${OUT}/b14-01-builder-mobile-p.png` });
  await expectCompact(canvas.locator("header").first(), "builder Mobile P");

  const preview = await context.newPage();
  await preview.setViewportSize({ width: 390, height: 844 });
  await preview.goto(`/preview/${id}`);
  const header = preview.frameLocator('iframe[title="Preview"]').locator("header").first();
  await header.waitFor({ timeout: 60_000 });
  await preview.waitForTimeout(1_000);
  await preview.screenshot({ path: `${OUT}/b14-02-preview-390.png` });
  await expectCompact(header, "preview 390px");
});
