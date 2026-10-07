// B4 — UI language: English by default (no IP guess), no toggle on the pages
// themselves; changed only in Settings → Display Language (account menu). The choice
// must switch UI strings and survive a reload, a new page and the builder.
// No pinLocale(): its init script would rewrite nova_locale on every load and mask persistence.
import { test, expect, type Page } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { seedProject, deleteFreshAccount, type FreshAccount } from "../helpers/fresh-account";

const OUT = "qa-screenshots/tier-b";
mkdirSync(OUT, { recursive: true });
let acc: FreshAccount | undefined;
test.afterAll(async () => deleteFreshAccount(acc));

const stored = (page: Page) => page.evaluate(() => localStorage.getItem("nova_locale"));
const search = (page: Page) => page.locator("input[placeholder]").first();
const canvasReady = (page: Page) =>
  page.frameLocator('iframe[title="Canvas"]').locator("h1").first().waitFor({ timeout: 120_000 });

test("B4 language toggle EN <-> VI persists", async ({ page, context }) => {
  acc = { email: `qa.b4.${Date.now()}@testqa.dev`, password: "QaTierB!2026" };
  expect((await page.request.post("/api/auth/register", { data: { ...acc, name: "QA b4" } })).ok()).toBe(true);
  await page.goto("/login");
  await page.evaluate(() => {
    localStorage.setItem("nova-tour-done", "1");
    localStorage.setItem("nova-coachmarks-seen", "1");
  });
  await page.reload();
  // Fresh visitor: English, and no language switcher on the page
  await expect(page.locator('input[type="email"]')).toBeVisible();
  expect(await page.getByRole("button", { name: /^(us|vn)?\s*(EN|VI)$/ }).count()).toBe(0);
  await page.locator('input[type="email"]').fill(acc.email);
  await page.locator('input[type="password"]').fill(acc.password);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(/\/projects/, { timeout: 120_000 });
  const projectId = await seedProject(page, "Lang Test");

  // Dashboard in EN
  await page.goto("/projects");
  await expect(search(page)).toHaveAttribute("placeholder", "Search sites…");
  await page.screenshot({ path: `${OUT}/b4-01-dashboard-en.png` });

  // Account menu → Display Language → Vietnamese
  await page.locator('button[aria-haspopup="menu"]').first().click();
  await page.getByRole("link", { name: "Display Language" }).click();
  await page.waitForURL(/\/settings\/language/);
  await expect(page.getByRole("heading", { name: "Language & Localization" })).toBeVisible();
  await page.getByRole("button", { name: /Tiếng Việt/ }).click();
  await expect(page.getByRole("heading", { name: "Ngôn ngữ & Vùng miền" })).toBeVisible();
  await expect(page.getByText("Ngôn ngữ hiển thị", { exact: true })).toBeVisible();
  expect(await stored(page)).toBe("vi");
  await page.screenshot({ path: `${OUT}/b4-02-settings-vi.png` });
  await page.reload();
  await expect(page.getByRole("heading", { name: "Ngôn ngữ & Vùng miền" })).toBeVisible();

  // Dashboard in VI, after reload and in a brand-new page
  await page.goto("/projects");
  await expect(search(page)).toHaveAttribute("placeholder", "Tìm kiếm trang…");
  await page.screenshot({ path: `${OUT}/b4-03-dashboard-vi.png` });
  const fresh = await context.newPage();
  await fresh.goto("/projects");
  await expect(search(fresh)).toHaveAttribute("placeholder", "Tìm kiếm trang…");
  await fresh.close();

  // Builder in VI
  await page.goto(`/builder/${projectId}`);
  await canvasReady(page);
  await expect(page.getByText("Công cụ ▾")).toBeVisible();
  await expect(page.getByText("Giao diện CSS").first()).toBeVisible();
  await page.screenshot({ path: `${OUT}/b4-04-builder-vi.png` });

  // No language switcher in the builder; back to English only through Settings
  expect(await page.getByRole("button", { name: /^(us|vn)?\s*(EN|VI)$/ }).count()).toBe(0);
  await page.goto("/settings/language");
  await page.getByRole("button", { name: /English/ }).click();
  expect(await stored(page)).toBe("en");
  await page.goto(`/builder/${projectId}`);
  await canvasReady(page);
  await expect(page.getByText("Tools ▾")).toBeVisible();
  await page.screenshot({ path: `${OUT}/b4-05-builder-en.png` });
});
