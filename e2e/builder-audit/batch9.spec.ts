// Task 009 batch 9 — loose ends: profile & password page, Welcome card only before the first
// site, AI Content Fill rewrites field hint texts, HTML export without the Tailwind play CDN.
// QA_MOCK_AI=1 answers Content Fill locally (no AI keys on a dev server). Screenshots n*.png.
//   pwsh scripts/audit-run.ps1 e2e/builder-audit/batch9.spec.ts
import { test, expect } from "@playwright/test";
import { freshAccount, seedProject, openBuilder, deleteFreshAccount, type FreshAccount } from "../helpers/fresh-account";
import { OUT } from "./audit";

let acc: FreshAccount | undefined;
test.afterAll(async () => deleteFreshAccount(acc));

test("batch 9: profile, welcome card, placeholders in Content Fill, export without CDN", async ({ page }) => {
  test.setTimeout(600_000);
  acc = await freshAccount(page, "b9x");

  await test.step("Welcome card shows before the first site only", async () => {
    await page.goto("/projects");
    await expect(page.getByText(/welcome to nova/i)).toBeVisible({ timeout: 30_000 });
    await page.screenshot({ path: `${OUT}/n01-welcome-no-sites.png` });
  });

  const id = await seedProject(page, "Batch Nine Cafe");

  await test.step("…and hides once a site exists", async () => {
    await page.reload();
    await expect(page.locator('[title="Batch Nine Cafe"]')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText(/welcome to nova/i)).toHaveCount(0);
    await page.screenshot({ path: `${OUT}/n02-welcome-hidden.png` });
  });

  await test.step("Profile: rename from the account menu", async () => {
    await page.locator('button[aria-haspopup="menu"]').first().click();
    await page.getByRole("link", { name: /profile & password/i }).click();
    await page.waitForURL(/\/settings\/profile/);
    const nameInput = page.getByLabel(/your name/i);
    await expect(nameInput).toHaveValue("QA b9x", { timeout: 30_000 });
    await nameInput.fill("Thu Ha Nguyen");
    await page.getByRole("button", { name: /save name/i }).click();
    await expect(page.getByText("Name saved")).toBeVisible();
    await page.screenshot({ path: `${OUT}/n03-profile-renamed.png` });
    await page.goto("/projects");
    await page.locator('button[aria-haspopup="menu"]').first().click();
    await expect(page.getByText("Thu Ha Nguyen").first()).toBeVisible();
    await page.keyboard.press("Escape");
  });

  await test.step("Profile: change password (wrong current, mismatch, success)", async () => {
    await page.goto("/settings/profile");
    const newPassword = "QaNewPass!2026";
    await page.getByLabel("Current password").fill("not-my-password");
    await page.getByLabel("New password", { exact: true }).fill(newPassword);
    await page.getByLabel("New password again").fill(newPassword);
    await page.getByRole("button", { name: /change password/i }).click();
    await expect(page.getByRole("alert").filter({ hasText: /current password is not right/i })).toBeVisible();
    await page.screenshot({ path: `${OUT}/n04-password-wrong-current.png` });
    await page.getByLabel("Current password").fill(acc!.password);
    await page.getByLabel("New password again").fill("something-else");
    await page.getByRole("button", { name: /change password/i }).click();
    await expect(page.getByRole("alert").filter({ hasText: /not the same/i })).toBeVisible();
    await page.getByLabel("New password again").fill(newPassword);
    await page.getByRole("button", { name: /change password/i }).click();
    await expect(page.getByText("Password changed")).toBeVisible();
    await page.screenshot({ path: `${OUT}/n05-password-changed.png` });
    acc!.password = newPassword;

    const fresh = await page.context().browser()!.newContext({ baseURL: process.env.BASE_URL });
    const p = await fresh.newPage();
    await p.goto("/login");
    await p.locator('input[type="email"]').fill(acc!.email);
    await p.locator('input[type="password"]').fill(newPassword);
    await p.locator('button[type="submit"]').click();
    await p.waitForURL(/\/projects/, { timeout: 60_000 });
    await fresh.close();
  });

  await test.step("Content Fill also rewrites field hint texts", async () => {
    if (process.env.QA_MOCK_AI) {
      await page.route("**/api/ai/content", async (route) => {
        const { instances } = route.request().postDataJSON() as { instances: { instanceId: string; currentText: string }[] };
        await route.fulfill({ json: { fills: instances.map((i) => ({ instanceId: i.instanceId, text: `VI ${i.currentText}` })), creditCost: 1 } });
      });
    }
    await openBuilder(page, id);
    const canvas = page.frameLocator('iframe[title="Canvas"]');
    const before = await canvas.locator("input[placeholder], textarea[placeholder]").evaluateAll((els) => els.map((e) => e.getAttribute("placeholder")));
    await page.getByRole("button", { name: /^tools/i }).click();
    await page.getByRole("menuitem", { name: /ai content/i }).first().click();
    const dialog = page.getByRole("dialog", { name: "AI Content Fill" });
    await dialog.locator("textarea").fill("Viết lại toàn bộ trang bằng tiếng Việt, kể cả chữ gợi ý trong ô nhập.");
    const sent = page.waitForRequest((r) => r.url().includes("/api/ai/content"));
    await dialog.getByRole("button", { name: /^(fill|rewrite)/i }).click();
    const ids = ((await sent).postDataJSON() as { instances: { instanceId: string }[] }).instances.map((i) => i.instanceId);
    expect(ids.filter((i) => i.endsWith("::placeholder")).length, "placeholders sent").toBe(before.length);
    await expect(dialog.getByText(/rewritten/i).first()).toBeVisible({ timeout: 300_000 });
    await dialog.getByRole("button", { name: "Apply" }).click();
    await page.waitForTimeout(1_500);
    const after = await canvas.locator("input[placeholder], textarea[placeholder]").evaluateAll((els) => els.map((e) => e.getAttribute("placeholder")));
    console.log("placeholders", before, "→", after);
    await canvas.locator("form").first().scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${OUT}/n06-placeholders-rewritten.png` });
    expect(after).not.toEqual(before);
  });

  await test.step("HTML export loads no Tailwind CDN", async () => {
    const html = await (await page.request.get(`/api/export/${id}`)).text();
    expect(html).not.toContain("cdn.tailwindcss.com");
    expect(html).toContain('id="nova-preflight"');
  });
});
