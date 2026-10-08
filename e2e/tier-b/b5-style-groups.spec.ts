// B5 — Style panel groups (size, spacing, typography, color, border, shadow): a value set
// in the right panel reaches the canvas, the saved preview and the HTML export.
//   BASE_URL=... npx playwright test -c playwright.cloud.config.ts e2e/tier-b/b5-style-groups.spec.ts
import { test, expect, type Locator } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { freshAccount, seedProject, openBuilder, deleteFreshAccount, type FreshAccount } from "../helpers/fresh-account";

const OUT = "qa-screenshots/tier-b";
mkdirSync(OUT, { recursive: true });
let acc: FreshAccount | undefined;
test.afterAll(async () => deleteFreshAccount(acc));

const SUB = "Nestled in the heart of Da Lat";
// What every surface must show for the edited paragraph.
const EXPECTED = {
  maxWidth: "500px",          // Size       — edit existing row
  marginTop: "40px",          // Spacing    — edit existing row
  fontSize: "26px",           // Typography — edit existing row
  color: "rgb(185, 28, 28)",  // Color      — color picker
  borderTopWidth: "3px",      // Border     — add property
  borderTopStyle: "dashed",
  boxShadow: "rgba(0, 0, 0, 0.25) 0px 4px 8px 0px", // Shadow — Box Shadow "+"
};
const computed = (el: Locator) =>
  el.evaluate((p, keys) => {
    const cs = getComputedStyle(p) as unknown as Record<string, string>;
    return Object.fromEntries(keys.map((k) => [k, cs[k]]));
  }, Object.keys(EXPECTED));

test("B5 style panel groups reach canvas, preview and export", async ({ page, context }) => {
  // The helper skips the tour ("nova-tour-done") but not the builder coach marks, whose overlay eats clicks.
  await page.context().addInitScript(() => localStorage.setItem("nova-coachmarks-seen", "1"));
  acc = await freshAccount(page, "b5");
  const id = await seedProject(page, "B5 Styles");
  await openBuilder(page, id);
  const canvas = page.frameLocator('iframe[title="Canvas"]');
  const para = canvas.locator("p", { hasText: SUB }).first();
  await para.click();
  await page.locator('[role="tab"]').filter({ hasText: /^style$/i }).first().click();
  await expect(page.getByText("Sub-heading text", { exact: true }).first()).toBeVisible();

  const row = (prop: string) => page.locator(`tr[data-property="${prop}"]`);
  const setNumber = async (prop: string, v: string) => {
    const input = row(prop).locator('input[type="number"]');
    await input.fill(v);
    await input.press("Enter");
  };
  await setNumber("maxWidth", "500");
  await setNumber("marginTop", "40");
  await page.locator("summary", { hasText: /^Typography/ }).click();
  await setNumber("fontSize", "26");
  await row("color").locator('input[type="color"]').fill("#b91c1c");
  await page.locator('input[placeholder="property"]').fill("border");
  await page.locator('input[placeholder="value"]').fill("3px dashed #1d4ed8");
  await page.locator('input[placeholder="value"]').press("Enter");
  await page.locator('button[title="Add Box Shadow"]').click();

  await expect.poll(() => computed(para)).toEqual(EXPECTED);
  await para.scrollIntoViewIfNeeded();
  await page.screenshot({ path: `${OUT}/b5-01-canvas.png` });
  await page.locator("summary", { hasText: /^Border/ }).click();
  await page.screenshot({ path: `${OUT}/b5-02-style-panel.png` });

  // Autosave (the topbar Save button reads "Saved" and is disabled) → preview shows the same values
  await page.waitForTimeout(3_000);
  await expect(page.getByText("All changes saved")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByRole("button", { name: /^saved$/i })).toBeDisabled();
  const preview = await context.newPage();
  await preview.goto(`/preview/${id}`);
  const pPara = preview.frameLocator('iframe[title="Preview"]').locator("p", { hasText: SUB }).first();
  await pPara.waitFor({ timeout: 60_000 });
  await expect.poll(() => computed(pPara)).toEqual(EXPECTED);
  await pPara.scrollIntoViewIfNeeded();
  await preview.screenshot({ path: `${OUT}/b5-03-preview.png` });

  // Export HTML shows the same values
  const r = await page.request.get(`/api/export/${id}`);
  expect(r.ok()).toBeTruthy();
  const exported = await context.newPage();
  await exported.setContent(await r.text(), { waitUntil: "load" });
  const ePara = exported.locator("p", { hasText: SUB }).first();
  expect(await computed(ePara)).toEqual(EXPECTED);
  await ePara.scrollIntoViewIfNeeded();
  await exported.screenshot({ path: `${OUT}/b5-04-export.png` });
});
