// B14 — the AI page's navbar does not stack into a column on phones (builder
// "Mobile P" and the preview at 390px). Expected layout (packages/ai mobileNavbar.ts):
// two compact rows — brand + call to action, then the links on one scrollable line.
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
    const doc = h.ownerDocument.documentElement;
    return { height: Math.round(h.getBoundingClientRect().height), visibleLinks: links.length, linkRows: rows.size, pageOverflowX: doc.scrollWidth > doc.clientWidth };
  });
const expectCompact = async (header: Locator, where: string) => {
  const layout = await navLayout(header);
  console.log(`${where}: ${JSON.stringify(layout)}`);
  expect(layout.visibleLinks, `${where}: nav links still visible`).toBeGreaterThan(0);
  expect(layout.linkRows, `${where}: nav links on one row`).toBe(1);
  expect(layout.height, `${where}: header at most two compact rows`).toBeLessThanOrEqual(110);
  expect(layout.pageOverflowX, `${where}: no horizontal page scroll`).toBe(false);
};

test("B14 navbar does not stack into a column on mobile", async ({ page, context }) => {
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
