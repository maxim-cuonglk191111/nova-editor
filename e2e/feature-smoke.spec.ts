// Smoke pass over every user-visible feature outside the golden path: each page
// and builder panel is opened, screenshotted and checked for console errors /
// error screens. Evidence for the keep/cut decisions in doc/TEST-ROADMAP.md.
//   BASE_URL=... npx playwright test e2e/feature-smoke.spec.ts -c playwright.cloud.config.ts
import { test, type Page } from "@playwright/test";
import { mkdirSync } from "node:fs";

const OUT = process.env.QA_OUT ?? "qa-screenshots/smoke";
mkdirSync(OUT, { recursive: true });

type Result = { name: string; errors: number; failedRequests: number; errorScreen: boolean };
const results: Result[] = [];

async function visit(page: Page, name: string, act: () => Promise<void>) {
  const errors: string[] = [];
  const failed: string[] = [];
  const onConsole = (m: { type(): string; text(): string }) => { if (m.type() === "error") errors.push(m.text()); };
  const onResponse = (r: { status(): number; url(): string }) => { if (r.status() >= 500) failed.push(`${r.status()} ${r.url()}`); };
  page.on("console", onConsole);
  page.on("response", onResponse);
  try {
    await act();
    await page.waitForTimeout(1500);
  } catch (e) {
    errors.push(`ACTION FAILED: ${String(e).slice(0, 160)}`);
  }
  const body = await page.locator("body").innerText().catch(() => "");
  const errorScreen = /something went wrong|application error|internal server error|404|not found|unauthorized/i.test(body.slice(0, 2000));
  await page.screenshot({ path: `${OUT}/${name}.png` }).catch(() => {});
  page.off("console", onConsole);
  page.off("response", onResponse);
  results.push({ name, errors: errors.length, failedRequests: failed.length, errorScreen });
  console.log(`${errors.length || failed.length || errorScreen ? "WARN" : "OK  "} ${name} errors=${errors.length} 5xx=${failed.length} errorScreen=${errorScreen}${errors[0] ? " | " + errors[0].slice(0, 140) : ""}${failed[0] ? " | " + failed[0] : ""}`);
}

test("feature smoke", async ({ page }) => {
  test.setTimeout(900_000);
  await page.addInitScript(() => {
    localStorage.setItem("nova_locale", "en");
    localStorage.setItem("nova-tour-done", "1");
  });
  await page.goto("/login");
  await page.locator('input[type="email"]').fill(process.env.QA_EMAIL ?? "qa.cloud.1791213340319@testqa.dev");
  await page.locator('input[type="password"]').fill(process.env.QA_PASSWORD ?? "QaCloud!2026");
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(/projects/, { timeout: 120_000 });

  for (const path of [
    "/pricing", "/settings/subscription", "/settings/subscription/history", "/settings/billing", "/settings/api",
    "/settings/branding", "/settings/language", "/settings/notifications", "/settings/teams", "/admin", "/admin/flags",
  ]) {
    await visit(page, `page${path.replace(/\//g, "-")}`, async () => { await page.goto(path); });
  }

  await page.goto("/projects");
  const card = page.locator("div", { hasText: /bakery/i }).filter({ has: page.getByRole("button", { name: /^edit$/i }) }).last();
  const projectId = await (async () => {
    await card.getByRole("button", { name: /^edit$/i }).click();
    await page.waitForURL(/\/builder\/(?!demo)/);
    return page.url().split("/builder/")[1]!.split(/[?#]/)[0]!;
  })();
  for (const path of [`/analytics/${projectId}`, `/submissions/${projectId}`, `/settings/domains/${projectId}`, `/preview/${projectId}`]) {
    await visit(page, `page${path.replace(/\//g, "-").replace(projectId, "id")}`, async () => { await page.goto(path); });
  }

  await page.goto(`/builder/${projectId}`);
  const canvas = page.frameLocator('iframe[title="Canvas"]');
  await canvas.locator("h1").first().waitFor({ timeout: 120_000 });
  await canvas.locator("h1").first().click();

  for (const tab of ["Components", "Pages", "Navigator", "Assets", "CSS Vars", "Custom CSS", "Templates"]) {
    await visit(page, `sidebar-${tab.replace(/\s+/g, "-")}`, async () => {
      const button = page.locator(`button[aria-label="${tab}"]`).first();
      if ((await button.getAttribute("aria-pressed")) !== "true") await button.click({ timeout: 5000 });
    });
  }
  for (const tab of ["Style", "Props", "Settings"]) {
    await visit(page, `right-${tab}`, async () => {
      await page.locator("[role=tab], button", { hasText: new RegExp(`^${tab}$`, "i") }).first().click({ timeout: 5000 });
    });
  }
  for (const item of ["AI content", "Accessibility", "Performance", "History", "Grid guides", "CSS preview"]) {
    await visit(page, `tools-${item.replace(/\s+/g, "-")}`, async () => {
      await page.getByRole("button", { name: /^tools/i }).click({ timeout: 5000 });
      await page.getByRole("menuitem", { name: new RegExp(item, "i") }).first().click({ timeout: 5000 });
    });
    await page.keyboard.press("Escape");
  }
  await visit(page, "export-menu", async () => {
    await page.getByRole("button", { name: /^export/i }).click({ timeout: 5000 });
  });
  await page.keyboard.press("Escape");
  await visit(page, "command-palette", async () => { await page.keyboard.press("ControlOrMeta+k"); });
  await page.keyboard.press("Escape");
  await visit(page, "context-menu", async () => { await canvas.locator("h2").first().click({ button: "right" }); });
  await page.keyboard.press("Escape");

  console.log("\nSUMMARY " + JSON.stringify(results));
});
