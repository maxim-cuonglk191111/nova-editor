// Task 009 batch 2 — AI tools under the shared free quota: "change one section" through the
// tools that exist, AI Content Fill (whole page and one selected section), and the
// Accessibility check's AI suggestion. ≥ 1 minute between AI calls. Screenshots a*.png.
//   pwsh scripts/audit-run.ps1 e2e/builder-audit/ai-tools.spec.ts
import { test, expect, type Page, type FrameLocator } from "@playwright/test";
import { deleteFreshAccount, type FreshAccount } from "../helpers/fresh-account";
import { openAuditBuilder, shot, savedText } from "./audit";

let acc: FreshAccount | undefined;
test.afterAll(async () => deleteFreshAccount(acc));

const QUOTA_GAP = process.env.QA_MOCK_AI ? 0 : 65_000;
const VIETNAMESE = /[ăâđêôơưàáạảãằắặẳẵầấậẩẫèéẹẻẽềếệểễìíịỉĩòóọỏõồốộổỗờớợởỡùúụủũừứựửữỳýỵỷỹ]/i;
const texts = (canvas: FrameLocator, scope = "body") =>
  canvas.locator(scope).first().evaluate((root) =>
    Array.from(root.querySelectorAll("h1, h2, h3, h4, p, a, button, span, label"))
      .filter((el) => !Array.from(el.children).some((c) => c.textContent?.trim()))
      .map((el) => (el.textContent ?? "").trim()).filter(Boolean));

async function contentFill(page: Page, prompt: string) {
  await page.getByRole("button", { name: /^tools/i }).click();
  await page.getByRole("menuitem", { name: /ai content/i }).first().click();
  const dialog = page.getByRole("dialog", { name: "AI Content Fill" });
  await dialog.locator("textarea").fill(prompt);
  const found = (await dialog.locator("div").filter({ hasText: /text elements|texts/ }).last().innerText()).trim();
  const res = page.waitForResponse((r) => r.url().includes("/api/ai/content"), { timeout: 300_000 });
  await dialog.getByRole("button", { name: /^(fill|rewrite)/i }).click();
  const r = await res;
  return { dialog, found, status: r.status(), body: (await r.text()).slice(0, 300) };
}

test("AI tools: change one section, content fill, accessibility suggestion", async ({ page }) => {
  test.setTimeout(900_000);
  const b = await openAuditBuilder(page, "aitools");
  acc = b.acc;
  const { canvas } = b;
  // QA_MOCK_AI=1: a dev server without AI keys answers Content Fill with a fake rewrite of
  // every requested text, so the UI path (scope, preview, apply, undo) can still be checked.
  if (process.env.QA_MOCK_AI) {
    await page.route("**/api/ai/content", async (route) => {
      const { instances } = route.request().postDataJSON() as { instances: { instanceId: string; currentText: string }[] };
      await route.fulfill({ json: { fills: instances.map((i) => ({ instanceId: i.instanceId, text: `Bản mới: ${i.currentText}` })), creditCost: 1 } });
    });
  }

  await test.step("Content Fill rewrites the whole page in Vietnamese", async () => {
    const before = await texts(canvas);
    const { dialog, found, status, body } = await contentFill(page, "Viết lại toàn bộ nội dung trang bằng tiếng Việt cho quán cà phê Đà Lạt này, giữ nguyên ý nghĩa.");
    console.log(`fill page: ${found} → ${status} ${body}`);
    expect(status).toBe(200);
    await expect(dialog.getByText(/filled|rewritten/i).first()).toBeVisible({ timeout: 30_000 });
    await shot(page, "a01-fill-ready");
    await dialog.getByRole("button", { name: "Apply" }).click();
    await page.waitForTimeout(1_500);
    const after = await texts(canvas);
    // Brand names and addresses are kept on purpose (the prompt says so).
    const kept = (t: string) => /\d/.test(t) || t === "Da Lat Slow Coffee";
    const english = after.filter((t) => t.length > 12 && !VIETNAMESE.test(t) && before.includes(t) && !kept(t));
    console.log(`texts ${before.length}, unchanged English after fill: ${english.length}`, english.slice(0, 12));
    await shot(page, "a02-fill-applied");
    await canvas.locator("footer, section").last().scrollIntoViewIfNeeded();
    await shot(page, "a03-fill-applied-bottom");
    expect.soft(english.length, "every text element rewritten").toBe(0);
    await page.keyboard.press("ControlOrMeta+z");
    await page.waitForTimeout(1_000);
    expect.soft(await texts(canvas), "Ctrl+Z restores the copy").toEqual(before);
  });

  await page.waitForTimeout(QUOTA_GAP);

  await test.step("Change one section: select the menu section, rewrite only its text", async () => {
    // Track the section by its element id: the AI may rewrite the "Menu" heading itself.
    const menuId = await canvas.locator("section, div").filter({ has: canvas.locator("h2", { hasText: /menu/i }) }).last().getAttribute("data-ws-selector");
    const menu = canvas.locator(`[data-ws-selector="${menuId}"]`);
    await canvas.locator("h2", { hasText: /menu/i }).first().click();
    await page.getByText("Menu Section", { exact: true }).last().click(); // breadcrumb / layers row of its section
    const outsideBefore = await texts(canvas, "header");
    const sectionBefore = await menu.evaluate((el) => (el as HTMLElement).innerText);
    const { dialog, found, status, body } = await contentFill(page, "Make every item in this section sound warmer and shorter.");
    console.log(`fill section: ${found} → ${status} ${body}`);
    await shot(page, "a04-section-fill-ready");
    if (status === 200) {
      await dialog.getByRole("button", { name: "Apply" }).click();
      await page.waitForTimeout(1_500);
    }
    const sectionAfter = await menu.evaluate((el) => (el as HTMLElement).innerText);
    const outsideAfter = await texts(canvas, "header");
    console.log(`section changed: ${sectionAfter !== sectionBefore}, header unchanged: ${JSON.stringify(outsideAfter) === JSON.stringify(outsideBefore)}`);
    await shot(page, "a05-section-fill-applied");
    expect.soft(sectionAfter, "the selected section changed").not.toBe(sectionBefore);
    expect.soft(outsideAfter, "the rest of the page is untouched").toEqual(outsideBefore);
    await page.keyboard.press("ControlOrMeta+z");
  });

  await page.waitForTimeout(QUOTA_GAP);

  await test.step("Generate with AI on a section asks for a whole new page (current behaviour)", async () => {
    await canvas.locator("h2", { hasText: /menu/i }).first().click();
    await page.locator("button", { hasText: "✦" }).last().click();
    const dialog = page.getByRole("dialog", { name: /generate with ai/i });
    await shot(page, "a06-generate-on-section");
    console.log("generate panel text:", (await dialog.innerText()).replace(/\s+/g, " ").slice(0, 400));
    await page.keyboard.press("Escape");
  });

  await test.step("Accessibility: AI suggestion for an image without alt text", async () => {
    const img = canvas.locator("img").first();
    await img.scrollIntoViewIfNeeded();
    await img.click();
    await page.locator('[role="tab"]').filter({ hasText: /^props$/i }).first().click();
    const altRow = page.locator("div", { has: page.locator("label", { hasText: /^alt/i }) }).filter({ has: page.locator("input") }).last();
    await altRow.locator("input").first().fill("");
    await page.getByRole("button", { name: /^tools/i }).click();
    await page.getByRole("menuitem", { name: /accessibility/i }).first().click();
    const panel = page.getByRole("dialog", { name: /accessibility/i });
    const t0 = Date.now();
    const res = page.waitForResponse((r) => r.url().includes("/api/ai/a11y"), { timeout: 120_000 });
    await panel.getByRole("button", { name: /run check/i }).click();
    const json = (await (await res).json()) as { issues: { rule: string; fix: string; ai?: boolean }[] };
    console.log(`a11y in ${Math.round((Date.now() - t0) / 1000)} s:`, JSON.stringify(json.issues));
    await page.waitForTimeout(800);
    await shot(page, "a07-a11y-suggestion");
    const alt = json.issues.find((i) => i.rule === "img-alt");
    expect(alt, "missing alt reported").toBeTruthy();
    if (!process.env.QA_MOCK_AI) expect.soft(alt!.ai, "the suggestion was written by the AI").toBe(true);
  });

  expect(await savedText(page, b.id)).toBeTruthy();
});
