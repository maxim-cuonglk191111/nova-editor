// Task 038 — screenshots of the signed-in app pages around the builder (dashboard, settings,
// analytics) with a throwaway account, to compare their look with the builder's.
//   $env:BASE_URL="http://localhost:3001"; pwsh scripts/audit-run.ps1 e2e/builder-audit/app-pages-audit.spec.ts
import { test } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { deleteFreshAccount, freshAccount, seedProject, type FreshAccount } from "../helpers/fresh-account";

const OUT = "doc/screenshots/.temp/app-pages";
mkdirSync(OUT, { recursive: true });
let acc: FreshAccount | undefined;
test.afterAll(async () => deleteFreshAccount(acc));

test("app pages", async ({ page }) => {
  test.setTimeout(240_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  acc = await freshAccount(page, "apppages");
  await seedProject(page, "Da Lat Slow Coffee");
  for (const [name, path] of [["projects", "/projects"], ["profile", "/settings/profile"], ["subscription", "/settings/subscription"], ["billing", "/settings/billing"], ["teams", "/settings/teams"], ["language", "/settings/language"], ["branding", "/settings/branding"]] as const) {
    await page.goto(path);
    await page.waitForTimeout(2500);
    await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: false });
  }
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.goto("/projects");
  await page.waitForTimeout(2000);
  await page.screenshot({ path: `${OUT}/projects-1024.png` });
});
