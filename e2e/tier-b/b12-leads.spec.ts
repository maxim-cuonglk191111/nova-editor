// B12 — Leads: a logged-out visitor submits the contact form on the public preview and the
// owner sees the row on /submissions/<id> (reached from the dashboard card).
// The landing fixture already contains a Form (name / email / message + "Send Message").
//   BASE_URL=... npx playwright test -c playwright.cloud.config.ts e2e/tier-b/b12-leads.spec.ts
import { test, expect } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { freshAccount, seedProject, deleteFreshAccount, type FreshAccount } from "../helpers/fresh-account";

const OUT = "qa-screenshots/tier-b";
mkdirSync(OUT, { recursive: true });
let acc: FreshAccount | undefined;
test.afterAll(async () => deleteFreshAccount(acc));

test("B12 preview form submission shows in Leads", async ({ page, browser }) => {
  acc = await freshAccount(page, "b12");
  const id = await seedProject(page, "Leads Cafe");
  const lead = { name: "Nguyen Van QA", email: `lead.${Date.now()}@testqa.dev`, message: "Table for two on Saturday" };

  // Anonymous visitor fills the contact form in the share link.
  const visitor = await browser.newContext({ baseURL: process.env.BASE_URL, viewport: { width: 1440, height: 900 } });
  const v = await visitor.newPage();
  await v.goto(`/preview/${id}`);
  const site = v.frameLocator('iframe[title="Preview"]');
  await site.locator("h1").first().waitFor({ timeout: 120_000 });
  const form = site.locator("form").first();
  await form.locator('[name="name"]').fill(lead.name);
  await form.locator('[name="email"]').fill(lead.email);
  await form.locator('[name="message"]').fill(lead.message);
  await form.scrollIntoViewIfNeeded();
  await v.screenshot({ path: `${OUT}/b12-01-form-filled.png` });
  const sent = v.waitForResponse((r) => r.url().includes("/api/submissions") && r.request().method() === "POST");
  await form.getByText("Send Message").click();
  expect((await sent).status()).toBe(200);
  const thanks = form.getByText("Thanks! Your submission was received.");
  await expect(thanks).toBeVisible();
  await thanks.scrollIntoViewIfNeeded();
  await v.screenshot({ path: `${OUT}/b12-02-form-thanks.png` });
  await visitor.close();

  // Owner opens Leads from the dashboard card.
  await page.goto("/projects");
  const card = page.locator("div", { has: page.locator('[title="Leads Cafe"]') }).filter({ has: page.locator('button[title="Delete site"]') }).last();
  await card.locator('button[title="View form submissions"]').click();
  await page.waitForURL(new RegExp(`/submissions/${id}`));
  const row = page.locator("tr", { hasText: lead.email });
  await expect(row).toBeVisible({ timeout: 60_000 });
  await expect(row).toContainText(lead.name);
  await expect(row).toContainText(lead.message);
  await page.screenshot({ path: `${OUT}/b12-03-leads-row.png`, fullPage: true });
});
