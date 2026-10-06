// Regression: inline text editing (double-click) and small drag nudges on the canvas.
// Runs against a deployed build or dev server:
//   BASE_URL=... npx playwright test e2e/canvas-edit-nudge.spec.ts -c playwright.cloud.config.ts
import { test, expect } from "@playwright/test";

test("double-click edits text in place; a small nudge does not move the element", async ({ page }) => {
  test.setTimeout(240_000);
  await page.addInitScript(() => {
    localStorage.setItem("nova_locale", "en");
    localStorage.setItem("nova-tour-done", "1");
  });
  await page.goto("/login");
  await page.locator('input[type="email"]').fill(process.env.QA_EMAIL ?? "qa.cloud.1791213340319@testqa.dev");
  await page.locator('input[type="password"]').fill(process.env.QA_PASSWORD ?? "QaCloud!2026");
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(/projects/, { timeout: 120_000 });
  // An AI-generated project (the QA account's projects come from the golden-path
  // journey), not the built-in demo.
  const card = page.locator("div", { hasText: new RegExp(process.env.QA_PROJECT ?? "bakery", "i") })
    .filter({ has: page.getByRole("button", { name: /^edit$/i }) })
    .last();
  await card.getByRole("button", { name: /^edit$/i }).click();
  await page.waitForURL(/\/builder\/(?!demo)/);
  const canvas = page.frameLocator('iframe[title="Canvas"]');
  // A paragraph in the page body (centered hero copy is where the bug showed).
  const p = canvas.locator("section p, main p, p").first();
  await p.waitFor({ timeout: 120_000 });
  // Strip a marker left by an interrupted earlier run.
  const original = (await p.innerText()).trim().replace(/( EDITED)+$/, "");

  // The editor opens with the existing text and hides the original underneath.
  await p.dblclick();
  const editor = canvas.locator('[contenteditable="true"]').first();
  await editor.waitFor();
  expect((await editor.innerText()).trim().replace(/( EDITED)+$/, "")).toBe(original);
  await page.keyboard.press("ControlOrMeta+a");
  await page.keyboard.type(original);
  expect(await p.evaluate((el) => getComputedStyle(el).visibility)).toBe("hidden");
  await page.keyboard.press("End");
  await page.keyboard.type(" EDITED");
  await page.keyboard.press("Enter");
  await expect(p).toContainText("EDITED", { timeout: 10_000 });
  expect(await p.evaluate((el) => getComputedStyle(el).visibility)).toBe("visible");

  // Put the project's text back.
  await p.dblclick();
  await editor.waitFor();
  await page.keyboard.press("ControlOrMeta+a");
  await page.keyboard.type(original);
  await page.keyboard.press("Enter");
  await expect(p).toHaveText(original, { timeout: 10_000 });

  // A 15px nudge stays inside the element's own box, so nothing moves.
  const heading = canvas.locator("h1, h2").first();
  const order = () =>
    canvas.locator("[data-ws-id]").evaluateAll((els) => els.map((e) => e.getAttribute("data-ws-id")).join(","));
  const before = await order();
  const box = (await heading.boundingBox())!;
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + 15, y + 10, { steps: 8 });
  await page.mouse.up();
  await page.waitForTimeout(800);
  expect(await order()).toBe(before);
});
