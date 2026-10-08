// B9 — AI Content Fill (Tools menu): asks AI to rewrite the page copy in Vietnamese and
// checks the heading/paragraph text changed to Vietnamese while the structure is unchanged.
// Uses the free-tier AI chain — run sparingly.
//   BASE_URL=... npx playwright test -c playwright.cloud.config.ts e2e/tier-b/b9-ai-content-fill.spec.ts
import { test, expect } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { freshAccount, seedProject, openBuilder, deleteFreshAccount, type FreshAccount } from "../helpers/fresh-account";

const OUT = "qa-screenshots/tier-b";
mkdirSync(OUT, { recursive: true });
let acc: FreshAccount | undefined;
test.afterAll(async () => deleteFreshAccount(acc));

const VIETNAMESE = /[ăâđêôơưàáạảãằắặẳẵầấậẩẫèéẹẻẽềếệểễìíịỉĩòóọỏõồốộổỗờớợởỡùúụủũừứựửữỳýỵỷỹ]/i;
const PROMPT = "Viết lại toàn bộ nội dung trang bằng tiếng Việt (Vietnamese) cho quán cà phê Đà Lạt này, giữ nguyên ý nghĩa của từng mục.";

test("B9 AI content fill rewrites copy in Vietnamese", async ({ page }) => {
  test.setTimeout(600_000);
  acc = await freshAccount(page, "b9");
  // The first-visit coach-marks tour puts a click-blocking backdrop over the top bar.
  await page.context().addInitScript(() => localStorage.setItem("nova-coachmarks-seen", "1"));
  const id = await seedProject(page, "Content Fill Cafe");
  await openBuilder(page, id);
  const canvas = page.frameLocator('iframe[title="Canvas"]');
  const shape = () => canvas.locator("body").evaluate((b) =>
    ["h1", "h2", "h3", "p", "img", "form", "a", "button", "section"].map((t) => `${t}:${b.querySelectorAll(t).length}`).join(" "));
  const before = { shape: await shape(), h1: await canvas.locator("h1").first().innerText(), p: await canvas.locator("p").first().innerText() };

  await page.getByRole("button", { name: /^tools/i }).click();
  await page.getByRole("menuitem", { name: /ai content/i }).first().click();
  const dialog = page.locator('[role="dialog"][aria-label="AI Content Fill"]');
  await dialog.locator("textarea").fill(PROMPT);
  await page.screenshot({ path: `${OUT}/b9-01-prompt.png` });
  const res = page.waitForResponse((r) => r.url().includes("/api/ai/content"), { timeout: 300_000 });
  await dialog.getByRole("button", { name: /^(fill|rewrite)/i }).click();
  const r = await res;
  console.log(`/api/ai/content ${r.status()} ${(await r.text()).slice(0, 400)}`);
  if (!r.ok()) await page.screenshot({ path: `${OUT}/b9-02-error.png` });
  expect(r.status(), "AI content fill request").toBe(200);
  await expect(dialog.getByText(/elements filled|texts rewritten/)).toBeVisible({ timeout: 30_000 });
  await page.screenshot({ path: `${OUT}/b9-02-filled.png` });
  await dialog.getByRole("button", { name: "Apply" }).click();
  await expect(dialog).toBeHidden();

  await expect(canvas.locator("h1").first()).not.toHaveText(before.h1, { timeout: 30_000 });
  const after = { shape: await shape(), h1: await canvas.locator("h1").first().innerText(), p: await canvas.locator("p").first().innerText() };
  console.log("before", before, "\nafter ", after);
  expect(after.h1).toMatch(VIETNAMESE);
  expect(after.p).not.toBe(before.p);
  expect(after.p).toMatch(VIETNAMESE);
  expect(after.shape).toBe(before.shape);
  await page.screenshot({ path: `${OUT}/b9-03-applied.png` });
  await canvas.locator("p").nth(3).scrollIntoViewIfNeeded();
  await page.screenshot({ path: `${OUT}/b9-04-applied-lower.png` });
});
