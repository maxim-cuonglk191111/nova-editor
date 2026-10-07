// B8 — Version history: snapshot, edit the h1, restore the snapshot → the old h1 is back (also after reload).
//   BASE_URL=... npx playwright test -c playwright.cloud.config.ts e2e/tier-b/b8-history.spec.ts
import { test, expect, type Page } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { freshAccount, seedProject, openBuilder, deleteFreshAccount, type FreshAccount } from "../helpers/fresh-account";

const OUT = "qa-screenshots/tier-b";
mkdirSync(OUT, { recursive: true });
let acc: FreshAccount | undefined;
test.afterAll(async () => deleteFreshAccount(acc));

const savedH1 = async (page: Page, id: string) => JSON.stringify((await (await page.request.get(`/api/projects/${id}`)).json()).data.instances);
const openHistory = async (page: Page) => {
  await page.getByRole("button", { name: /^tools/i }).click();
  await page.getByRole("menuitem", { name: /history/i }).click();
  return page.getByRole("dialog", { name: "Version History" });
};

test("B8 version history snapshot + restore", async ({ page }) => {
  acc = await freshAccount(page, "b8");
  const id = await seedProject(page, "History Coffee");
  await openBuilder(page, id);
  const h1 = page.frameLocator('iframe[title="Canvas"]').locator("h1").first();
  const oldH1 = (await h1.innerText()).trim();

  // Snapshot
  let panel = await openHistory(page);
  await panel.getByPlaceholder("Snapshot label (optional)").fill("before edit");
  await panel.getByRole("button", { name: /^save$/i }).click();
  await expect(panel.getByText("before edit")).toBeVisible({ timeout: 30_000 });
  await page.screenshot({ path: `${OUT}/b8-01-snapshot-saved.png` });
  await page.keyboard.press("Escape");

  // Edit the h1 and save
  const NEW = "Edited by B8";
  await h1.dblclick();
  await page.keyboard.press("ControlOrMeta+a");
  await page.keyboard.type(NEW);
  await page.keyboard.press("Enter"); // Enter commits inline edits; Escape cancels
  await expect(h1).toHaveText(NEW);
  await page.getByRole("button", { name: /^save$/i }).click();
  await page.getByRole("button", { name: /^update$/i }).click();
  await page.waitForURL(/\/projects/, { timeout: 60_000 });
  expect(await savedH1(page, id)).toContain(NEW);
  await openBuilder(page, id);
  await expect(h1).toHaveText(NEW);
  await page.screenshot({ path: `${OUT}/b8-02-edited.png` });

  // Restore
  panel = await openHistory(page);
  page.once("dialog", (d) => d.accept());
  const row = panel.locator("div", { hasText: "before edit" }).filter({ has: page.getByRole("button", { name: "Restore" }) }).last();
  await row.getByRole("button", { name: "Restore" }).click();
  await expect(panel.getByText(/restored/i)).toBeVisible({ timeout: 30_000 });
  await page.screenshot({ path: `${OUT}/b8-03-restored-msg.png` });
  expect(await savedH1(page, id)).not.toContain(NEW);

  // The builder reloads itself and shows the restored page.
  await page.waitForEvent("load", { timeout: 30_000 });
  await expect(h1).toHaveText(oldH1, { timeout: 120_000 });
  await page.screenshot({ path: `${OUT}/b8-04-after-reload.png` });
});
