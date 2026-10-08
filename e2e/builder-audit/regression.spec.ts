// Task 009 batch 1 — saving under concurrency: two tabs on one project, and version-history
// restore against the autosave queue / full-save lock. Screenshots g*.png.
//   pwsh scripts/audit-run.ps1 e2e/builder-audit/regression.spec.ts
import { test, expect, type Page, type FrameLocator } from "@playwright/test";
import { deleteFreshAccount, openBuilder, type FreshAccount } from "../helpers/fresh-account";
import { openAuditBuilder, shot, waitSaved, savedText } from "./audit";

const accounts: FreshAccount[] = [];
test.afterAll(async () => { for (const a of accounts) await deleteFreshAccount(a); });

const CONFLICT = /changed elsewhere|changed in another tab/i;
const canvasOf = (p: Page) => p.frameLocator('iframe[title="Canvas"]');

async function editInline(page: Page, canvas: FrameLocator, selector: string, text: string) {
  const el = canvas.locator(selector).first();
  await el.dblclick();
  await page.keyboard.press("ControlOrMeta+a");
  await page.keyboard.type(text);
  await page.keyboard.press("Enter");
  await expect(el).toHaveText(text);
}

async function openHistory(page: Page) {
  await page.getByRole("button", { name: /^tools/i }).click();
  await page.getByRole("menuitem", { name: /history/i }).click();
  return page.getByRole("dialog", { name: "Version History" });
}

async function snapshot(page: Page, label: string) {
  const panel = await openHistory(page);
  await panel.getByPlaceholder("Snapshot label (optional)").fill(label);
  await panel.getByRole("button", { name: /^save$/i }).click();
  await expect(panel.getByText(label)).toBeVisible({ timeout: 30_000 });
  await page.keyboard.press("Escape");
}

async function restore(page: Page, label: string) {
  const panel = await openHistory(page);
  page.once("dialog", (d) => d.accept());
  const row = panel.locator("div", { hasText: label }).filter({ has: page.getByRole("button", { name: "Restore" }) }).last();
  await row.getByRole("button", { name: "Restore" }).click();
}

test("G1 two tabs edit one project: the stale tab sees a conflict, nothing is overwritten", async ({ page, context }) => {
  const a = await openAuditBuilder(page, "g1");
  accounts.push(a.acc);
  const b = await context.newPage();
  await openBuilder(b, a.id);

  await editInline(page, a.canvas, "h1", "Tab A heading");
  await waitSaved(page);
  await shot(page, "g01-tab-a-saved");

  // Tab B still holds the old version; its edit must not overwrite tab A's.
  await editInline(b, canvasOf(b), "p", "Tab B paragraph");
  await expect(b.getByText(CONFLICT)).toBeVisible({ timeout: 30_000 });
  await expect(b.getByRole("button", { name: "Reload" })).toBeVisible();
  await shot(b, "g02-tab-b-conflict");
  const server = await savedText(page, a.id);
  expect(server).toContain("Tab A heading");
  expect(server).not.toContain("Tab B paragraph");

  // Full save from the stale tab must also be refused.
  await b.getByRole("button", { name: /^save$/i }).click();
  await b.getByRole("button", { name: /^update$/i }).click();
  await expect(b.getByText(/Use Save As to keep your version/).first()).toBeVisible({ timeout: 30_000 });
  await shot(b, "g03-tab-b-update-refused");
  expect(await savedText(page, a.id)).toContain("Tab A heading");
  await b.close();
});

test("G2 restore a snapshot: a stale tab cannot overwrite the restored page", async ({ page, context }) => {
  const a = await openAuditBuilder(page, "g2");
  accounts.push(a.acc);
  const oldH1 = (await a.canvas.locator("h1").first().innerText()).trim();
  await snapshot(page, "original");
  await editInline(page, a.canvas, "h1", "After snapshot");
  await waitSaved(page);

  const b = await context.newPage();
  await openBuilder(b, a.id);
  await expect(canvasOf(b).locator("h1").first()).toHaveText("After snapshot");

  await restore(page, "original");
  await page.waitForEvent("load", { timeout: 30_000 });
  await expect(a.canvas.locator("h1").first()).toHaveText(oldH1, { timeout: 120_000 });
  await shot(page, "g04-restored");

  // Tab B was opened before the restore: its autosave and its Save → Update must both be refused.
  await editInline(b, canvasOf(b), "p", "Stale tab B");
  await expect(b.getByText(CONFLICT)).toBeVisible({ timeout: 30_000 });
  await shot(b, "g05-stale-tab-conflict");
  await b.getByRole("button", { name: /^save$/i }).click();
  await b.getByRole("button", { name: /^update$/i }).click();
  await b.waitForTimeout(3_000);
  const server = await savedText(page, a.id);
  expect(server).not.toContain("Stale tab B");
  expect(server).not.toContain("After snapshot");
  await b.close();
});

test("G3 restore right after an edit: the queued edit does not land on the restored page", async ({ page }) => {
  const a = await openAuditBuilder(page, "g3");
  accounts.push(a.acc);
  const oldH1 = (await a.canvas.locator("h1").first().innerText()).trim();
  await snapshot(page, "clean");
  // A slow network holds the edit's autosave in flight while the user restores.
  await page.route("**/patch", async (route) => { await new Promise((r) => setTimeout(r, 4_000)); await route.continue(); });
  await editInline(page, a.canvas, "h1", "Racing edit");
  await expect(page.getByText("Saving…")).toBeVisible({ timeout: 5_000 });
  await restore(page, "clean");
  await page.waitForEvent("load", { timeout: 30_000 });
  await expect(a.canvas.locator("h1").first()).toHaveText(oldH1, { timeout: 120_000 });
  await page.waitForTimeout(3_000);
  await shot(page, "g06-restore-race");
  expect(await savedText(page, a.id)).not.toContain("Racing edit");
  await expect(page.getByText(CONFLICT)).toBeHidden();
});
