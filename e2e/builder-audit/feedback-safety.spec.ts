// Task 007 — area 5: feedback & safety. Toasts, empty / loading / error states, undo
// after every destructive action, saving while offline, unsaved-changes guard.
//   pwsh scripts/audit-run.ps1 e2e/builder-audit/feedback-safety.spec.ts
import { test, expect } from "@playwright/test";
import { deleteFreshAccount, type FreshAccount } from "../helpers/fresh-account";
import { openAuditBuilder, shot, waitSaved, savedText } from "./audit";

let acc: FreshAccount | undefined;
test.afterAll(async () => deleteFreshAccount(acc));
test.use({ actionTimeout: 15_000 });

test("feedback and safety", async ({ page, context }) => {
  test.setTimeout(600_000);
  const b = await openAuditBuilder(page, "safety");
  acc = b.acc;
  const { canvas, id } = b;
  const step = (name: string, fn: () => Promise<void>) =>
    test.step(name, fn).catch((e: Error) => { expect.soft(e.message.split("\n")[0], `step failed: ${name}`).toBe(""); });
  const btn = (name: string | RegExp) => page.getByRole("button", { name });
  const h3 = (t: string) => canvas.locator("h3", { hasText: new RegExp(`^${t}$`) });
  const undo = async () => { await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur()); await page.keyboard.press("ControlOrMeta+z"); };
  const dialogs: string[] = [];
  const openTab = async (title: string) => {
    const t = page.locator(`button[title="${title}"]`);
    if ((await t.getAttribute("aria-pressed")) !== "true") await t.click();
  };

  await step("empty states: nothing selected, empty page", async () => {
    await page.locator('[role="tab"], button').filter({ hasText: /^Style$/ }).first().click();
    await shot(page, "f01-nothing-selected");
    await openTab("Pages");
    await btn("+ Page").click();
    await page.getByPlaceholder("Page name").fill("Blank");
    await page.getByPlaceholder("/path or /blog/[slug]").fill("/blank");
    await btn("Create").click();
    await btn(/^Blank/).click();
    await shot(page, "f02-empty-page");
    await btn(/^Home/).first().click();
  });

  await step("undo after every destructive action", async () => {
    // delete (key), cut, drag off canvas, delete page, wrap in box, AI-free paths only
    const cases: [string, () => Promise<void>][] = [
      ["Delete key", async () => { await h3("Espresso").click(); await page.keyboard.press("Delete"); }],
      ["Ctrl+X", async () => { await h3("Espresso").click(); await page.keyboard.press("ControlOrMeta+x"); }],
      ["toolbar Delete", async () => { await h3("Espresso").click(); await btn(/^🗑 Delete$/).click(); }],
    ];
    for (const [name, act] of cases) {
      await h3("Espresso").scrollIntoViewIfNeeded();
      await act();
      await expect.soft(h3("Espresso"), `${name} removes it`).toHaveCount(0);
      await undo();
      await expect.soft(h3("Espresso"), `${name} is undoable`).toHaveCount(1);
    }
    page.once("dialog", (d) => { dialogs.push(d.message()); void d.accept(); });
    await openTab("Pages");
    await btn(/^Blank/).hover();
    await page.getByRole("button", { name: "Delete page" }).last().click();
    expect.soft(dialogs.at(-1) ?? "", "page delete asks first").toMatch(/Delete page/);
    await expect.soft(btn(/^Blank/)).toHaveCount(0);
    await undo();
    await expect.soft(btn(/^Blank/), "deleted page comes back with Ctrl+Z").toHaveCount(1);
    await shot(page, "f03-page-undeleted");
  });

  await step("saving while offline shows an error and recovers", async () => {
    await h3("Espresso").click();
    await context.setOffline(true);
    await h3("Espresso").dblclick();
    await canvas.locator('[contenteditable="true"]').first().waitFor();
    await page.keyboard.press("ControlOrMeta+a");
    await page.keyboard.type("Offline edit");
    await page.keyboard.press("Enter");
    await expect.soft(page.getByText(/Reconnecting|Save failed/).first(), "chip shows the problem").toBeVisible({ timeout: 20_000 });
    await shot(page, "f04-offline");
    await context.setOffline(false);
    await waitSaved(page);
    await shot(page, "f05-back-online");
    expect.soft(await savedText(page, id), "offline edit saved after reconnect").toContain("Offline edit");
  });

  await step("unsaved-changes guard", async () => {
    // A change that has not been flushed yet: the back button asks first.
    await context.setOffline(true);
    await h3("Cappuccino").click();
    await page.keyboard.press("ControlOrMeta+d");
    const msgs: string[] = [];
    page.once("dialog", (d) => { msgs.push(d.message()); void d.dismiss(); });
    await page.locator('button[title="Back to My Sites"]').click();
    await page.waitForTimeout(500);
    expect.soft(msgs[0] ?? "", "back button warns about unsaved work").toMatch(/not saved/);
    expect.soft(page.url(), "stays when the user cancels").toContain(`/builder/${id}`);
    await shot(page, "f06-guard-stayed");
    await context.setOffline(false);
    await waitSaved(page);
    // Once saved, leaving does not ask.
    let asked = false;
    page.once("dialog", (d) => { asked = true; void d.accept(); });
    await page.locator('button[title="Back to My Sites"]').click();
    await page.waitForURL(/\/projects/, { timeout: 30_000 });
    expect.soft(asked, "no prompt when everything is saved").toBe(false);
    await shot(page, "f07-left-cleanly");
  });

  await step("loading and error states", async () => {
    await page.route(`**/api/projects/${id}`, async (r) => { await new Promise((res) => setTimeout(res, 2500)); await r.continue().catch(() => {}); });
    await page.goto(`/builder/${id}`);
    await page.waitForTimeout(800);
    await shot(page, "f08-loading");
    await page.unroute(`**/api/projects/${id}`);
    await page.goto("/builder/00000000-0000-0000-0000-000000000000");
    await page.waitForTimeout(5000);
    await shot(page, "f09-missing-project");
    await expect.soft(page.getByText(/does not exist/), "missing project explains itself").toBeVisible({ timeout: 30_000 });
    await expect.soft(page.getByRole("link", { name: "Back to My Sites" }), "way back").toBeVisible();
  });
});
