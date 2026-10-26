import { test, expect } from "@playwright/test";

test.describe("Demo & Product UI Parity with Feature Gates (ADR-NB-022)", () => {
  test.beforeEach(async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));
    (page as any)._pageErrors = errors;
  });

  test("DOM Parity: All topbar controls, menus, and left rail tabs exist on /builder/demo", async ({ page }) => {
    await page.goto("/builder/demo");

    // Must not bounce to /login
    await expect(page).not.toHaveURL(/\/login/);

    // Canvas iframe presence
    const iframe = page.locator('iframe[src*="/canvas"]');
    await expect(iframe).toBeVisible({ timeout: 45_000 });

    // Back button
    const backBtn = page.getByRole("button", { name: "←" });
    await expect(backBtn).toBeVisible({ timeout: 15_000 });

    // Breakpoint switcher & manager
    await expect(page.locator("button").filter({ hasText: /Desktop|Máy tính/i }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: "⚙" })).toBeVisible();

    // Zoom controls
    // Zoom fits the artboard to the viewport (task 015), so the label is a percentage, not always 100%.
    await expect(page.getByRole("button", { name: /^\d{2,3}%$/ })).toBeVisible();
    await expect(page.locator('button[title*="Zoom in" i], button[title*="Phóng to" i], button[aria-label*="Zoom in" i]').first()).toBeVisible();
    await expect(page.locator('button[title*="Zoom out" i], button[title*="Thu nhỏ" i], button[aria-label*="Zoom out" i]').first()).toBeVisible();

    // Export ▾ Menu
    const exportBtn = page.locator("button").filter({ hasText: /Export|Xuất/i }).first();
    await expect(exportBtn).toBeVisible();

    // Tools ▾ Menu
    const toolsBtn = page.locator("button").filter({ hasText: /Tools|Công cụ/i }).first();
    await expect(toolsBtn).toBeVisible();

    // Preview button
    await expect(page.locator("button").filter({ hasText: /Preview|Xem trước/i }).first()).toBeVisible();

    // Save button
    const saveBtn = page.getByRole("button", { name: /^(Save|Lưu)$/i });
    await expect(saveBtn).toBeVisible();

    // Generate AI button
    await expect(page.locator("button").filter({ hasText: /Generate|Tạo bằng AI/i }).first()).toBeVisible();

    // Verify uncaught page errors
    const errors = (page as any)._pageErrors as string[];
    expect(errors, `Uncaught page errors:\n${errors.join("\n")}`).toEqual([]);
  });

  test("Gate Interception: Clicking Save in Demo opens Auth FeatureGateModal without 401 error", async ({ page }) => {
    await page.goto("/builder/demo");

    const saveBtn = page.getByRole("button", { name: /^(Save|Lưu)$/i });
    await expect(saveBtn).toBeVisible({ timeout: 45_000 });

    // Click save button (which triggers feature gate)
    await saveBtn.click();

    // FeatureGateModal should open with free signup CTA
    const signupCta = page.locator('a[href*="/signup"]').first();
    await expect(signupCta).toBeVisible({ timeout: 10_000 });

    // Close modal via Cancel button or close icon
    const cancelBtn = page.getByRole("button", { name: "×" }).or(page.locator("button").filter({ hasText: /Maybe later|Để sau|Cancel|Hủy/i })).first();
    await cancelBtn.click();
    await expect(signupCta).not.toBeVisible();
  });

  test("Paywall Gate: Clicking Export HTML in Demo opens Pro FeatureGateModal", async ({ page }) => {
    await page.goto("/builder/demo");

    // Open Export menu
    const exportBtn = page.locator("button").filter({ hasText: /Export|Xuất/i }).first();
    await expect(exportBtn).toBeVisible({ timeout: 45_000 });
    await exportBtn.click();

    // Click Download as HTML in menu
    const exportHtmlItem = page.locator('[role="menuitem"]').filter({ hasText: /HTML/i }).first();
    await expect(exportHtmlItem).toBeVisible({ timeout: 5000 });
    await exportHtmlItem.click();

    // Pro FeatureGateModal opens with Pro badge and upgrade CTA
    const pricingCta = page.locator('a[href*="/pricing"]').first();
    await expect(pricingCta).toBeVisible({ timeout: 10_000 });

    // Close modal via Cancel button or close icon
    const cancelBtn = page.getByRole("button", { name: "×" }).or(page.locator("button").filter({ hasText: /Maybe later|Để sau|Cancel|Hủy/i })).first();
    await cancelBtn.click();
    await expect(pricingCta).not.toBeVisible();
  });

  test("Client Tools: Grid Guides, Accessibility panel, and History panel function on Demo", async ({ page }) => {
    await page.goto("/builder/demo");

    const toolsBtn = page.locator("button").filter({ hasText: /Tools|Công cụ/i }).first();
    await expect(toolsBtn).toBeVisible({ timeout: 45_000 });

    // 1. Accessibility Panel
    await toolsBtn.click();
    const a11yItem = page.locator('[role="menuitem"]').filter({ hasText: /Accessibility|Khả năng tiếp cận/i }).first();
    await expect(a11yItem).toBeVisible({ timeout: 5000 });
    await a11yItem.click();

    // A11y panel title appears
    await expect(page.locator("text=/Accessibility|Tiếp cận/i").first()).toBeVisible();

    // 2. History Panel
    await toolsBtn.click();
    const historyItem = page.locator('[role="menuitem"]').filter({ hasText: /History|Lịch sử/i }).first();
    await expect(historyItem).toBeVisible({ timeout: 5000 });
    await historyItem.click();

    // History panel appears
    await expect(page.locator("text=/History|Lịch sử/i").first()).toBeVisible();

    const errors = (page as any)._pageErrors as string[];
    expect(errors, `Uncaught page errors:\n${errors.join("\n")}`).toEqual([]);
  });
});
