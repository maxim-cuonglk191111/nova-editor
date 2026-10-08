// Task 007 — area 4: the top bar. Duplicate/Delete buttons, breakpoints + manager, zoom,
// Export (HTML, .nova, import), Tools panels, Preview, Save (Ctrl+S dialog: Update,
// Save As), autosave chip, Generate with AI.
//   pwsh scripts/audit-run.ps1 e2e/builder-audit/top-bar.spec.ts
import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { deleteFreshAccount, type FreshAccount } from "../helpers/fresh-account";
import { openAuditBuilder, shot, waitSaved, savedText, OUT } from "./audit";

let acc: FreshAccount | undefined;
test.afterAll(async () => deleteFreshAccount(acc));
test.use({ actionTimeout: 15_000 });

test("top bar", async ({ page, context }) => {
  test.setTimeout(900_000);
  const b = await openAuditBuilder(page, "topbar");
  acc = b.acc;
  const { canvas, id } = b;
  const step = (name: string, fn: () => Promise<void>) =>
    test.step(name, fn).catch((e: Error) => { expect.soft(e.message.split("\n")[0], `step failed: ${name}`).toBe(""); });
  const btn = (name: string | RegExp) => page.getByRole("button", { name });
  const toast = (text: RegExp) => page.getByRole("alert").filter({ hasText: text });
  const h3 = (t: string) => canvas.locator("h3", { hasText: new RegExp(`^${t}$`) });
  const iframeWidth = async () => (await page.locator('iframe[title="Canvas"]').boundingBox())!.width;
  const undo = async () => { await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur()); await page.keyboard.press("ControlOrMeta+z"); };

  await step("toolbar: Duplicate and Delete buttons", async () => {
    await shot(page, "t01-topbar");
    await h3("Espresso").scrollIntoViewIfNeeded();
    await h3("Espresso").click();
    await shot(page, "t02-topbar-selected");
    await btn(/^⧉ Duplicate$/).click();
    await expect.soft(h3("Espresso")).toHaveCount(2);
    await undo();
    await expect.soft(h3("Espresso")).toHaveCount(1);
    await h3("Espresso").click();
    await btn(/^🗑 Delete$/).click();
    await expect.soft(h3("Espresso")).toHaveCount(0);
    await expect.soft(toast(/Element deleted/)).toBeVisible();
    await toast(/Element deleted/).getByRole("button", { name: "Undo" }).click();
    await expect.soft(h3("Espresso")).toHaveCount(1);
  });

  await step("breakpoints", async () => {
    const desktop = await iframeWidth();
    await btn("Tablet").click();
    await expect.soft.poll(iframeWidth).toBeLessThanOrEqual(992);
    await btn("Mobile P").click();
    await expect.soft.poll(iframeWidth).toBeLessThanOrEqual(480);
    await shot(page, "t03-mobile-p");
    await btn("Desktop").click();
    await expect.soft.poll(iframeWidth).toBe(desktop);
  });

  await step("breakpoint manager: add and delete", async () => {
    await page.locator('button[title="Manage breakpoints"]').click();
    await shot(page, "t04-breakpoint-manager");
    const rows = page.locator('button[title^="Delete breakpoint"]');
    const n = await rows.count();
    await btn("+ Add breakpoint").click();
    await expect.soft(rows).toHaveCount(n + 1);
    await shot(page, "t05-breakpoint-added");
    await rows.last().click();
    await expect.soft(rows).toHaveCount(n);
    await page.mouse.click(1300, 500);
    await expect.soft(btn("+ Add breakpoint"), "manager closes on outside click").toHaveCount(0);
    await btn("Desktop").click();
  });

  await step("zoom", async () => {
    await page.locator('button[title="Zoom in"]').click();
    await expect.soft(btn("110%")).toBeVisible();
    await page.locator('button[title="Zoom out"]').click();
    await page.locator('button[title="Zoom out"]').click();
    await expect.soft(btn("90%")).toBeVisible();
    await shot(page, "t06-zoom-90");
    await btn("90%").click();
    await expect.soft(btn("100%")).toBeVisible();
  });

  let novaFile = "";
  await step("export: HTML and .nova", async () => {
    await btn("Export ▾").click();
    await shot(page, "t07-export-menu");
    const html = await (await page.request.get(`/api/export/${id}`)).text();
    expect.soft(html, "HTML export has the hero heading").toContain("Experience the Soul of Da Lat");
    const dl = page.waitForEvent("download");
    await page.getByText("Export project (.nova)").click();
    const file = await dl;
    novaFile = `${OUT}/audit-export.nova`;
    await file.saveAs(novaFile);
    expect.soft(readFileSync(novaFile, "utf8"), ".nova file has the page").toContain("Experience the Soul of Da Lat");
    await expect.soft(toast(/exported/i)).toBeVisible();
  });

  await step("import .nova restores the page and saves it", async () => {
    const h1 = canvas.locator("h1").first();
    await h1.dblclick();
    await canvas.locator('[contenteditable="true"]').first().waitFor();
    await page.keyboard.press("ControlOrMeta+a");
    await page.keyboard.type("Changed before import");
    await page.keyboard.press("Enter");
    await expect.soft(h1).toHaveText("Changed before import");
    await waitSaved(page);
    await btn("Export ▾").click();
    const chooser = page.waitForEvent("filechooser");
    await page.getByText("Import project (.nova)").click();
    const confirm = page.getByRole("button", { name: /^Import$/ });
    if (await confirm.isVisible().catch(() => false)) { await shot(page, "t08-import-confirm"); await confirm.click(); }
    await (await chooser).setFiles(novaFile);
    await expect.soft(canvas.locator("h1").first()).toHaveText(/Experience the Soul of Da Lat/, { timeout: 30_000 });
    await expect.soft(toast(/imported/i)).toBeVisible({ timeout: 15_000 });
    await shot(page, "t09-imported");
    await expect.soft.poll(() => savedText(page, id), { message: "import saved to the server", timeout: 20_000 }).not.toContain("Changed before import");
  });

  await step("tools menu panels", async () => {
    const items = [["AI Content Fill", "t10-ai-fill"], ["Accessibility", "t11-a11y"], ["⏱ History", "t13-history"], ["Grid Guides", "t14-grid"]] as const;
    for (const hidden of ["Performance", "CSS Preview"]) {
      await btn("Tools ▾").click();
      await expect.soft(page.getByText(hidden, { exact: true }), `${hidden} hidden (Tier C)`).toHaveCount(0);
      await btn("Tools ▾").click();
    }
    for (const [item, name] of items) {
      await btn("Tools ▾").click();
      if (item === "AI Content Fill") await shot(page, "t10a-tools-menu");
      if (item === "Accessibility") await expect.soft(page.getByRole("dialog", { name: /AI Content/i }), "previous panel closed").toHaveCount(0);
      await page.getByText(item, { exact: true }).first().click();
      await page.waitForTimeout(800);
      await shot(page, name);
      // Toggle it off again from the same menu.
      await btn("Tools ▾").click();
      await page.getByText(item, { exact: true }).first().click();
      await page.waitForTimeout(300);
    }
  });

  await step("preview opens the page in a new tab", async () => {
    const popup = context.waitForEvent("page");
    await btn("Preview").click();
    const p = await popup;
    await expect.soft(p.frameLocator('iframe[title="Preview"]').locator("h1").first()).toContainText("Experience the Soul", { timeout: 60_000 });
    await p.screenshot({ path: `${OUT}/t16-preview.png` });
    await p.close();
  });

  await step("autosave chip and Save button agree", async () => {
    await h3("Espresso").click();
    await btn(/^⧉ Duplicate$/).click();
    await expect.soft(page.getByText(/Saving/).first()).toBeVisible();
    await shot(page, "t17-saving");
    await waitSaved(page);
    await expect.soft(btn(/^saved$/i)).toBeDisabled();
    await shot(page, "t18-saved");
    await undo();
  });

  await step("Ctrl+S dialog: Update stays in the editor; Save As makes a copy", async () => {
    await page.mouse.click(700, 20);
    await page.keyboard.press("ControlOrMeta+s");
    await expect.soft(page.getByText("Save changes?")).toBeVisible();
    await shot(page, "t19-save-dialog");
    await btn("Update").click();
    await expect.soft(toast(/saved/i)).toBeVisible();
    await page.waitForTimeout(1500);
    expect.soft(page.url(), "still in the builder after Update").toContain(`/builder/${id}`);
    await page.keyboard.press("ControlOrMeta+s");
    await btn("Save As").click();
    await page.locator("form input[type=text]").last().fill("Audit topbar copy");
    await shot(page, "t20-save-as");
    await btn("Save As Copy").click();
    await page.waitForURL(/\/projects/, { timeout: 30_000 });
    await expect.soft(page.getByText("Audit topbar copy").first()).toBeVisible({ timeout: 30_000 });
    await shot(page, "t21-copy-listed");
    await page.goto(`/builder/${id}`);
    await canvas.locator("h1").first().waitFor({ timeout: 120_000 });
  });

  await step("Generate with AI replaces the page; undo brings it back", async () => {
    await btn("✦ Generate").click();
    await shot(page, "t22-ai-panel");
    await page.locator('[role="dialog"] textarea').fill("A one-page site for a small bakery in Hanoi: hero, three products with prices, opening hours, contact form.");
    await page.locator('[role="dialog"]').getByRole("button", { name: /^Generate/ }).click();
    await shot(page, "t23-ai-generating");
    const replace = page.getByRole("button", { name: "Replace this page" });
    await replace.waitFor({ timeout: 240_000 });
    await shot(page, "t24-ai-ready");
    await replace.click();
    await expect.soft(canvas.locator("h1").first()).not.toContainText("Experience the Soul", { timeout: 30_000 });
    await page.waitForTimeout(1500);
    await shot(page, "t25-ai-applied");
    await undo();
    await expect.soft(canvas.locator("h1").first()).toContainText("Experience the Soul", { timeout: 15_000 });
  });
});
