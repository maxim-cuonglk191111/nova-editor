// Task 007 — area 1: the canvas. Hover, select, label, breadcrumb, drag-and-drop,
// resize, inline text edit, context menu, keyboard shortcuts, ⌘K palette.
//   pwsh scripts/audit-run.ps1 e2e/builder-audit/canvas.spec.ts
import { test, expect } from "@playwright/test";
import { deleteFreshAccount, type FreshAccount } from "../helpers/fresh-account";
import { openAuditBuilder, shot, waitSaved, savedText, dragTo, selectedTag } from "./audit";

let acc: FreshAccount | undefined;
test.afterAll(async () => deleteFreshAccount(acc));
test.use({ actionTimeout: 15_000, permissions: ["clipboard-read", "clipboard-write"] });

test("canvas", async ({ page }) => {
  const b = await openAuditBuilder(page, "canvas");
  acc = b.acc;
  const { canvas, id } = b;
  const h1 = canvas.locator("h1").first();
  const hero = canvas.locator("section").first();
  const heroOrder = () => hero.evaluate((s) => [...s.children].map((c) => c.tagName));
  const menu = page.locator('div[style*="z-index: 9500"]');
  const h3 = (t: string) => canvas.locator("h3", { hasText: new RegExp(`^${t}$`) });
  const undo = () => page.keyboard.press("ControlOrMeta+z");

  await test.step("hover outline", async () => {
    await canvas.locator("header h2").hover();
    await expect.soft(canvas.locator("header h2")).toHaveAttribute("data-ws-hovered", "");
    expect.soft(await canvas.locator("header h2").evaluate((e) => getComputedStyle(e).outlineStyle)).not.toBe("none");
    await shot(page, "c01-hover");
  });

  await test.step("click select, label, panel header, breadcrumb", async () => {
    await h1.click();
    await expect.soft(h1).toHaveAttribute("data-ws-selected", "");
    await expect.soft(canvas.locator("[data-nova-overlay]")).toContainText(/Heading\s+\d+ × \d+/);
    await expect.soft(page.getByText("Main Heading", { exact: true }).first()).toBeVisible();
    const crumbs = page.locator("button", { hasText: /^(Page Root|Hero Section|Main Heading)$/ });
    await expect.soft(crumbs).toHaveCount(3);
    await shot(page, "c02-selected");
    await page.locator("button", { hasText: /^Hero Section$/ }).last().click();
    await expect.soft.poll(() => selectedTag(canvas)).toBe("SECTION");
    await shot(page, "c03-breadcrumb-parent");
  });

  await test.step("drag: reorder within a section", async () => {
    const btn = hero.locator("button").first();
    await btn.click();
    const before = await heroOrder();
    const t = (await h1.boundingBox())!;
    const drop = await dragTo(page, btn, { x: t.x + t.width / 2, y: t.y + 8 });
    await shot(page, "c04-drag-indicator");
    await drop();
    expect.soft(await heroOrder(), "button moved above the heading").toEqual(["BUTTON", "H1", "P", "IMG"]);
    await shot(page, "c05-drag-reordered");
    await undo();
    await expect.soft.poll(heroOrder).toEqual(before);
  });

  await test.step("drag: move into another container", async () => {
    const contact = canvas.locator("header nav a", { hasText: /^Contact$/ });
    await contact.click();
    const order = (await canvas.locator("header button").boundingBox())!;
    const drop = await dragTo(page, contact, { x: order.x + order.width / 2, y: order.y + 4 });
    await shot(page, "c06-drag-to-header");
    await drop();
    const parent = await canvas.locator("header a", { hasText: /^Contact$/ }).evaluate((a) => a.parentElement!.tagName);
    expect.soft(parent, "Contact moved out of <nav> into <header>").toBe("HEADER");
    await shot(page, "c07-moved");
    await undo();
    await expect.soft.poll(() => canvas.locator("header nav a", { hasText: /^Contact$/ }).count()).toBe(1);
  });

  await test.step("drag: small nudge does not move", async () => {
    const p = hero.locator("p").first();
    await p.click();
    const before = await heroOrder();
    const drop = await dragTo(page, p, await p.boundingBox().then((r) => ({ x: r!.x + r!.width / 2 + 14, y: r!.y + r!.height / 2 + 6 })), 5);
    await drop();
    expect.soft(await heroOrder()).toEqual(before);
  });

  await test.step("resize handle", async () => {
    const img = hero.locator("img").first();
    await img.scrollIntoViewIfNeeded();
    await img.click();
    const r = (await img.boundingBox())!;
    await page.mouse.move(r.x + r.width, r.y + r.height / 2);
    await page.mouse.down();
    await page.mouse.move(r.x + r.width - 150, r.y + r.height / 2, { steps: 10 });
    await shot(page, "c08-resizing");
    await page.mouse.up();
    await page.waitForTimeout(600);
    const after = (await img.boundingBox())!;
    expect.soft(Math.abs(after.width - (r.width - 150)), `width after resize: ${after.width} (was ${r.width})`).toBeLessThan(20);
    expect.soft(Math.abs(after.width / after.height - r.width / r.height), "keeps its aspect ratio").toBeLessThan(0.05);
    await shot(page, "c09-resized");
    await undo();
    await expect.soft.poll(async () => Math.round((await img.boundingBox())!.width)).toBe(Math.round(r.width));
  });

  await test.step("inline text edit: Enter commits, Escape cancels", async () => {
    await h1.scrollIntoViewIfNeeded();
    await h1.dblclick();
    const editor = canvas.locator('[contenteditable="true"]').first();
    await editor.waitFor();
    await shot(page, "c10-editing");
    await page.keyboard.press("ControlOrMeta+a");
    await page.keyboard.type("Audit Heading");
    await page.keyboard.press("Enter");
    await expect.soft(h1).toHaveText("Audit Heading");
    await h1.dblclick();
    await editor.waitFor();
    await page.keyboard.press("ControlOrMeta+a");
    await page.keyboard.type("Should not stay");
    await page.keyboard.press("Escape");
    await expect.soft(h1).toHaveText("Audit Heading");
    await shot(page, "c11-escape-cancelled");
    await waitSaved(page);
    expect.soft(await savedText(page, id), "edited heading saved").toContain("Audit Heading");
  });

  await test.step("context menu: duplicate, delete, copy/paste, wrap, select parent", async () => {
    await h3("Espresso").scrollIntoViewIfNeeded();
    await h3("Espresso").click({ button: "right" });
    await expect.soft(menu).toBeVisible();
    await shot(page, "c12-context-menu");
    await menu.getByRole("button", { name: /^Duplicate/ }).click();
    await expect.soft(h3("Espresso")).toHaveCount(2);
    await undo();
    await expect.soft(h3("Espresso")).toHaveCount(1);
    await h3("Espresso").click({ button: "right" });
    await menu.getByRole("button", { name: /^Delete/ }).click();
    await expect.soft(h3("Espresso")).toHaveCount(0);
    const toast = page.getByRole("alert").filter({ hasText: "Element deleted" });
    await expect.soft(toast).toBeVisible();
    await shot(page, "c13-deleted");
    await toast.getByRole("button", { name: "Undo" }).click();
    await expect.soft(h3("Espresso")).toHaveCount(1);
    await h3("Espresso").click({ button: "right" });
    await menu.getByRole("button", { name: /^Copy/ }).click();
    await h3("Cappuccino").click({ button: "right" });
    await menu.getByRole("button", { name: /^Paste/ }).click();
    await expect.soft(h3("Espresso")).toHaveCount(2);
    await undo();
    await h3("Espresso").click({ button: "right" });
    await menu.getByRole("button", { name: /^Wrap in Box/ }).click();
    await expect.soft.poll(() => h3("Espresso").evaluate((e) => e.parentElement!.getAttribute("data-ws-component"))).toBe("Box");
    await undo();
    await h3("Espresso").click({ button: "right" });
    await menu.getByRole("button", { name: /^Select parent/ }).click();
    await expect.soft.poll(() => canvas.locator("[data-ws-selected]").first().getAttribute("data-ws-component")).toBe("shadcn:Card");
  });

  await test.step("shortcuts: ⌘D, Delete, ⌘Z/⌘⇧Z, ⌘C/⌘V, ⌘X", async () => {
    const cap = h3("Cappuccino");
    await cap.click();
    await page.keyboard.press("ControlOrMeta+d");
    await expect.soft(cap).toHaveCount(2);
    await undo();
    await expect.soft(cap).toHaveCount(1);
    await page.keyboard.press("ControlOrMeta+Shift+z");
    await expect.soft(cap).toHaveCount(2);
    await undo();
    await cap.click();
    await page.keyboard.press("Delete");
    await expect.soft(cap).toHaveCount(0);
    await undo();
    await expect.soft(cap).toHaveCount(1);
    await cap.click();
    await page.keyboard.press("ControlOrMeta+c");
    await h3("Espresso").click();
    await page.keyboard.press("ControlOrMeta+v");
    await expect.soft(cap).toHaveCount(2);
    await undo();
    await cap.click();
    await page.keyboard.press("ControlOrMeta+x");
    await expect.soft(cap).toHaveCount(0);
    await undo();
    await expect.soft(cap).toHaveCount(1);
  });

  await test.step("⌘K command palette", async () => {
    await h3("Cappuccino").click();
    await page.keyboard.press("ControlOrMeta+k");
    const input = page.locator("input[placeholder]").filter({ hasNot: page.locator("xx") }).last();
    await expect.soft(input).toBeFocused();
    await page.keyboard.type("dupl");
    await shot(page, "c14-palette");
    await page.keyboard.press("Enter");
    await expect.soft(h3("Cappuccino")).toHaveCount(2);
    await undo();
  });

  await test.step("drag off the canvas", async () => {
    const badge = canvas.locator("span", { hasText: "Local Favorite" });
    await badge.scrollIntoViewIfNeeded();
    await badge.click();
    const drop = await dragTo(page, badge, { x: 150, y: 500 });
    await shot(page, "c15-drag-off-canvas");
    await drop();
    await shot(page, "c16-after-drag-off");
    const left = await badge.count();
    console.log(`badge after drag off canvas: ${left ? "kept" : "deleted"}`);
    if (!left) { await undo(); await expect.soft(badge).toHaveCount(1); }
  });
});
