// Task 037 — the AI tab against production with the real providers. Throwaway account and
// seeded landing page (no demo data is touched; the account is deleted afterwards when the
// Supabase keys are loaded). Spends a few free-tier calls, so it leaves ~35 s between them.
//   pwsh scripts/audit-run.ps1 e2e/builder-audit/ai-panel-live.spec.ts
import { test, expect, type Page } from "@playwright/test";
import { deleteFreshAccount, type FreshAccount } from "../helpers/fresh-account";
import { openAuditBuilder, shot } from "./audit";

let acc: FreshAccount | undefined;
test.afterAll(async () => deleteFreshAccount(acc));
test.use({ actionTimeout: 30_000 });

const QUOTA_GAP = 35_000;
const pending = (page: Page) => page.locator('[data-testid="ai-proposal"][data-status="pending"]').last();

/** Waits for a proposal; one "busy" answer from a free model is retried once, as an owner would. */
async function proposal(page: Page, timeout = 200_000) {
  const either = page.locator('[data-testid="ai-proposal"][data-status="pending"], [data-testid="ai-msg-error"]').last();
  await either.waitFor({ timeout });
  if (await page.getByTestId("ai-msg-error").last().isVisible().catch(() => false) && !(await pending(page).isVisible().catch(() => false))) {
    await page.getByTestId("ai-msg-error").last().getByRole("button", { name: "Retry" }).click();
    await either.waitFor({ timeout });
  }
  await expect(pending(page)).toBeVisible();
}

const send = async (page: Page, text: string) => {
  await page.getByTestId("ai-input").fill(text);
  await page.getByTestId("ai-send").click();
};

test("AI tab with a real provider: edit, add a section, undo, reload, start over", async ({ page }) => {
  test.setTimeout(900_000);
  const b = await openAuditBuilder(page, "aitab");
  acc = b.acc;
  const { canvas } = b;
  const h1 = canvas.locator("h1").first();
  await expect(h1).toBeVisible({ timeout: 120_000 });
  const original = (await h1.innerText()).trim();

  await page.locator('button[aria-label="AI"][aria-pressed]').click();
  await expect(page.getByTestId("ai-panel")).toBeVisible();
  await shot(page, "ai01-tab-open");

  await test.step("edit the selected heading, Apply, Ctrl+Z", async () => {
    await h1.click();
    await expect(page.getByTestId("ai-chip-main")).toContainText("Element:");
    await send(page, "Rewrite this heading so it is shorter and friendlier");
    await proposal(page);
    await shot(page, "ai02-edit-proposal");
    await expect(pending(page)).toContainText(/Rewrite the text/);
    await pending(page).getByTestId("ai-apply").click();
    await expect.soft(h1).not.toHaveText(original, { timeout: 20_000 });
    await shot(page, "ai03-edit-applied");
    await page.keyboard.press("ControlOrMeta+z");
    await expect(h1).toHaveText(original, { timeout: 20_000 });
  });

  await page.waitForTimeout(QUOTA_GAP);

  await test.step("a section-wide request restyles several elements", async () => {
    await canvas.locator("section").first().click({ position: { x: 10, y: 10 } });
    await expect(page.getByTestId("ai-chip-main")).toContainText(/Section:|Element:/);
    await send(page, "Use warmer colours in this section");
    await proposal(page);
    await shot(page, "ai04-section-proposal");
    await expect(pending(page)).toContainText(/Restyle|Rewrite/);
    await pending(page).getByRole("button", { name: "Discard" }).click();
    await expect(page.getByTestId("ai-proposal").last()).toContainText("Discarded");
  });

  await page.waitForTimeout(QUOTA_GAP);

  await test.step("add a section at page level: one h1 stays, Ctrl+Z removes it", async () => {
    const sections = await canvas.locator("section").count();
    await canvas.locator("body").click({ position: { x: 2, y: 2 } });
    await send(page, "Add a testimonials section with three short customer quotes before the footer");
    await proposal(page);
    await shot(page, "ai05-insert-proposal");
    await pending(page).getByTestId("ai-apply").click();
    await expect.poll(() => canvas.locator("section").count(), { timeout: 20_000 }).toBeGreaterThan(sections);
    expect(await canvas.locator("h1").count()).toBe(1);
    await shot(page, "ai06-insert-applied");
    await page.keyboard.press("ControlOrMeta+z");
    await expect.poll(() => canvas.locator("section").count(), { timeout: 20_000 }).toBe(sections);
  });

  await test.step("a reload keeps the conversation", async () => {
    await page.reload();
    await expect(canvas.locator("h1").first()).toBeVisible({ timeout: 120_000 });
    const tab = page.locator('button[aria-label="AI"][aria-pressed]');
    if ((await tab.getAttribute("aria-pressed")) !== "true") await tab.click();
    await expect(page.getByTestId("ai-msg-user")).toHaveCount(3);
    await shot(page, "ai07-after-reload");
  });

  await page.waitForTimeout(QUOTA_GAP);

  await test.step("start over with a new page: proposed, applied, Ctrl+Z brings the old page back", async () => {
    await page.getByTestId("ai-start-over").click();
    await page.getByRole("button", { name: "Yes, start over" }).click();
    await send(page, "A one-page site for a small bakery in Hanoi: hero, three products with prices, opening hours, contact form");
    await proposal(page, 240_000);
    await expect(pending(page)).toContainText("A new page");
    await shot(page, "ai08-generate-proposal");
    await pending(page).getByTestId("ai-apply").click();
    await expect(h1).not.toHaveText(original, { timeout: 30_000 });
    await shot(page, "ai09-generated");
    await page.keyboard.press("ControlOrMeta+z");
    await expect(h1).toHaveText(original, { timeout: 30_000 });
  });
});
