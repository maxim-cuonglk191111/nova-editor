// B4 — language toggle EN <-> VI: /settings/language and the builder top-bar pill.
// UI strings must switch and the choice must survive a reload and a new page.
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
    localStorage.setItem("nova_locale", "en");
    localStorage.setItem("nova_auto_detect_ip", "false");
    localStorage.setItem("nova-tour-done", "1");
    localStorage.setItem("nova-coachmarks-seen", "1");
  });
  await page.reload();
  await page.locator('input[type="email"]').fill(acc.email);
  await page.locator('input[type="password"]').fill(acc.password);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(/\/projects/, { timeout: 120_000 });
  const projectId = await seedProject(page, "Lang Test");

  // Dashboard in EN
  await page.goto("/projects");
  await expect(search(page)).toHaveAttribute("placeholder", "Search sites…");
  await page.screenshot({ path: `${OUT}/b4-01-dashboard-en.png` });

  // Settings page -> Vietnamese
  await page.goto("/settings/language");
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

  // Builder pill -> EN, must persist across reload
  await page.getByRole("button", { name: /EN$/ }).click();
  await expect(page.getByText("Tools ▾")).toBeVisible();
  await expect(page.getByText("Style", { exact: true }).first()).toBeVisible();
  await page.screenshot({ path: `${OUT}/b4-05-builder-en.png` });
  expect.soft(await stored(page), "builder EN choice stored").toBe("en");
  await page.reload();
  await canvasReady(page);
  await expect.soft(page.getByText("Tools ▾"), "EN survives reload").toBeVisible();
  await page.screenshot({ path: `${OUT}/b4-06-builder-en-reloaded.png` });

  // Builder pill -> VI, persists into a new page (dashboard)
  await page.getByRole("button", { name: /VI$/ }).click();
  await expect(page.getByText("Công cụ ▾")).toBeVisible();
  expect.soft(await stored(page), "builder VI choice stored").toBe("vi");
  await page.reload();
  await canvasReady(page);
  await expect(page.getByText("Công cụ ▾")).toBeVisible();
  const fresh2 = await context.newPage();
  await fresh2.goto("/projects");
  await expect(search(fresh2)).toHaveAttribute("placeholder", "Tìm kiếm trang…");
  await fresh2.screenshot({ path: `${OUT}/b4-07-new-page-vi.png` });
});
