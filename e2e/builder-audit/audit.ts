// Shared setup for the builder audit specs (task 007): throwaway account, the seeded
// AI landing page, screenshot naming and "saved project" helpers.
import { expect, type Page, type FrameLocator, type Locator } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { freshAccount, seedProject, openBuilder, type FreshAccount } from "../helpers/fresh-account";

export const OUT = "qa-screenshots/builder-audit";
mkdirSync(OUT, { recursive: true });

export type Builder = { page: Page; canvas: FrameLocator; id: string; acc: FreshAccount };

export async function openAuditBuilder(page: Page, tag: string): Promise<Builder> {
  const acc = await freshAccount(page, tag);
  const id = await seedProject(page, `Audit ${tag}`);
  await openBuilder(page, id);
  return { page, canvas: page.frameLocator('iframe[title="Canvas"]'), id, acc };
}

export const shot = (page: Page, name: string) => page.screenshot({ path: `${OUT}/${name}.png` });

/** Waits for the autosave chip to settle on "All changes saved". */
export async function waitSaved(page: Page) {
  await page.waitForTimeout(2_500);
  await expect(page.getByText("All changes saved")).toBeVisible({ timeout: 30_000 });
}

/** The project as the server has it (GET /api/projects/:id), serialised for text checks. */
export async function savedText(page: Page, id: string): Promise<string> {
  const r = await page.request.get(`/api/projects/${id}`);
  expect(r.ok()).toBeTruthy();
  return JSON.stringify(await r.json());
}

/** Drags with real pointer events from the centre of `from` to a point. */
export async function dragTo(page: Page, from: Locator, to: { x: number; y: number }, steps = 15) {
  const b = (await from.boundingBox())!;
  const x = b.x + b.width / 2, y = b.y + b.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + 10, y + 10, { steps: 3 });
  await page.mouse.move(to.x, to.y, { steps });
  return async () => { await page.mouse.up(); await page.waitForTimeout(600); };
}

export const selectedTag = (canvas: FrameLocator) =>
  canvas.locator("[data-ws-selected]").first().evaluate((el) => el.tagName).catch(() => null);
