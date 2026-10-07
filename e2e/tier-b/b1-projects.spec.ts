// B1 — dashboard: search filters, clone copies the content, delete removes it.
//   BASE_URL=... npx playwright test -c playwright.cloud.config.ts e2e/tier-b/b1-projects.spec.ts
import { test, expect } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { freshAccount, seedProject, deleteFreshAccount, type FreshAccount } from "../helpers/fresh-account";

const OUT = "qa-screenshots/tier-b";
mkdirSync(OUT, { recursive: true });
let acc: FreshAccount | undefined;
test.afterAll(async () => deleteFreshAccount(acc));

test("B1 clone / delete / search projects", async ({ page }) => {
  acc = await freshAccount(page, "b1");
  const alphaId = await seedProject(page, "Alpha Coffee");
  await seedProject(page, "Beta Bakery");
  await page.goto("/projects");
  const card = (name: string) => page.locator("div", { has: page.locator(`[title="${name}"]`) }).filter({ has: page.locator('button[title="Delete site"]') }).last();
  await expect(card("Alpha Coffee")).toBeVisible();
  await expect(card("Beta Bakery")).toBeVisible();
  await page.screenshot({ path: `${OUT}/b1-01-two-projects.png` });

  // Search
  const search = page.locator('input[placeholder*="earch"]').first();
  await search.fill("beta");
  await expect(card("Beta Bakery")).toBeVisible();
  await expect(page.locator('[title="Alpha Coffee"]')).toHaveCount(0);
  await page.screenshot({ path: `${OUT}/b1-02-search-beta.png` });
  await search.fill("zzz-no-match");
  await expect(page.locator('button[title="Delete site"]')).toHaveCount(0);
  await expect(page.getByText(/zzz-no-match/).first()).toBeVisible();
  await page.screenshot({ path: `${OUT}/b1-03-search-empty.png` });
  await search.fill("");

  // Clone
  await card("Alpha Coffee").locator('button[title="Duplicate site"]').click();
  await expect(page.locator('button[title="Delete site"]')).toHaveCount(3, { timeout: 30_000 });
  const list = (await (await page.request.get("/api/projects")).json()) as { projects?: { id: string; project_name?: string; name?: string }[] };
  const projects = list.projects ?? (list as unknown as { id: string; project_name?: string; name?: string }[]);
  const copy = projects.find((p) => p.id !== alphaId && /alpha/i.test(p.project_name ?? p.name ?? ""));
  expect(copy, "clone listed").toBeTruthy();
  const original = (await (await page.request.get(`/api/projects/${alphaId}`)).json()) as { data: { instances: unknown } };
  const cloned = (await (await page.request.get(`/api/projects/${copy!.id}`)).json()) as { data: { instances: unknown } };
  expect(JSON.stringify(cloned.data.instances)).toBe(JSON.stringify(original.data.instances));
  await page.screenshot({ path: `${OUT}/b1-04-cloned.png` });
  await page.goto(`/builder/${copy!.id}`);
  await page.frameLocator('iframe[title="Canvas"]').locator("h1").first().waitFor({ timeout: 120_000 });
  await page.screenshot({ path: `${OUT}/b1-05-clone-opens.png` });

  // Delete the clone
  await page.goto("/projects");
  const copyName = copy!.project_name ?? copy!.name!;
  await card(copyName).locator('button[title="Delete site"]').click();
  await page.screenshot({ path: `${OUT}/b1-06-delete-confirm.png` });
  await page.getByRole("button", { name: /^delete$/i }).click();
  await expect(page.locator('button[title="Delete site"]')).toHaveCount(2, { timeout: 30_000 });
  expect((await page.request.get(`/api/projects/${copy!.id}`)).status()).toBe(404);
  await page.reload();
  await expect(page.locator('button[title="Delete site"]')).toHaveCount(2);
  await page.screenshot({ path: `${OUT}/b1-07-after-delete.png` });
});
