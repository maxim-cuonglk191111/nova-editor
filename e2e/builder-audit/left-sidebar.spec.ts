// Task 007 — area 2: the left sidebar. Components (search, click, drag), Pages (add, switch,
// rename, set home, delete), Layers (expand, select, rename, drag, context menu), Assets
// (upload, use in an Image, delete), CSS variables, Custom CSS, Templates, panel resize/collapse.
//   pwsh scripts/audit-run.ps1 e2e/builder-audit/left-sidebar.spec.ts
import { test, expect } from "@playwright/test";
import { deflateSync } from "node:zlib";
import { deleteFreshAccount, type FreshAccount } from "../helpers/fresh-account";
import { openAuditBuilder, shot, waitSaved } from "./audit";

let acc: FreshAccount | undefined;
test.afterAll(async () => deleteFreshAccount(acc));
test.use({ actionTimeout: 15_000 });

// A 16×16 solid PNG built in memory (no fixture file needed).
function png(r: number, g: number, b: number): Buffer {
  const crc = (buf: Buffer) => { let c = ~0; for (const x of buf) { c ^= x; for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1)); } return ~c >>> 0; };
  const chunk = (type: string, data: Buffer) => { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type), data]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([len, td, c]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(16, 0); ihdr.writeUInt32BE(16, 4); ihdr[8] = 8; ihdr[9] = 2;
  const row = Buffer.concat([Buffer.from([0]), Buffer.from(Array(16).fill([r, g, b]).flat())]);
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk("IHDR", ihdr), chunk("IDAT", deflateSync(Buffer.concat(Array(16).fill(row)))), chunk("IEND", Buffer.alloc(0))]);
}

test("left sidebar", async ({ page }) => {
  const b = await openAuditBuilder(page, "sidebar");
  acc = b.acc;
  const { canvas, id } = b;
  const tab = (title: string) => page.locator(`button[title="${title}"]`);
  const project = async () => (await (await page.request.get(`/api/projects/${id}`)).json()) as {
    data: { pages: { homePageId: string; pages: [string, { name: string; path: string }][] } };
    cssVars?: unknown; customCss?: string;
  };
  const undo = () => page.keyboard.press("ControlOrMeta+z");
  page.on("dialog", (d) => d.accept());
  const headings = canvas.locator("h1, h2, h3, h4, h5, h6");

  await test.step("Components: search, click to insert, drag onto the page", async () => {
    await canvas.locator("h1").first().click();
    await tab("Components").click();
    await shot(page, "s01-components");
    await page.getByPlaceholder("Search components...").fill("heading");
    const card = page.getByRole("button", { name: /^Heading$/ }).first();
    await expect.soft(card).toBeVisible();
    await shot(page, "s02-components-search");
    const before = await headings.count();
    await card.click();
    await expect.soft(headings).toHaveCount(before + 1);
    const next = await canvas.locator("h1").first().evaluate((h) => h.nextElementSibling?.getAttribute("data-ws-component"));
    expect.soft(next, "inserted right below the selected heading").toMatch(/Heading$/);
    await shot(page, "s03-clicked-insert");
    await undo();
    await expect.soft(headings).toHaveCount(before);

    await page.getByPlaceholder("Search components...").fill("button");
    const btnCard = page.getByRole("button", { name: /^Button$/ }).first();
    const buttons = canvas.locator('[data-ws-component="shadcn:Button"], [data-ws-component="Button"]');
    const nBtn = await buttons.count();
    const c = (await btnCard.boundingBox())!;
    const target = (await canvas.locator("section p").first().boundingBox())!;
    await page.mouse.move(c.x + c.width / 2, c.y + c.height / 2);
    await page.mouse.down();
    await page.mouse.move(target.x + target.width / 2, target.y + target.height - 3, { steps: 20 });
    await shot(page, "s04-drag-component");
    await page.mouse.up();
    await expect.soft(buttons).toHaveCount(nBtn + 1);
    await shot(page, "s05-dropped");
    await undo();
    await expect.soft(buttons).toHaveCount(nBtn);
  });

  await test.step("Pages: add, switch, insert on that page, rename, set home, delete", async () => {
    await tab("Pages").click();
    await page.getByRole("button", { name: "+ Page" }).click();
    await page.getByPlaceholder("Page name").fill("Services");
    await page.getByPlaceholder("/path or /blog/[slug]").fill("/services");
    await shot(page, "s06-new-page-form");
    await page.getByRole("button", { name: "Create", exact: true }).click();
    const row = page.getByRole("button", { name: /^Services/ });
    await expect.soft(row).toBeVisible();
    await row.click();
    await expect.soft(canvas.locator("h1")).toHaveCount(0);
    await shot(page, "s07-switched-to-new-page");
    await tab("Components").click();
    await page.getByPlaceholder("Search components...").fill("heading");
    await page.getByRole("button", { name: /^Heading$/ }).first().click();
    await expect.soft(headings, "heading added to the open page").toHaveCount(1);
    await tab("Pages").click();
    await page.getByRole("button", { name: "Rename page (or double-click)" }).first().click();
    await page.getByPlaceholder("Page name").fill("Our Services");
    await page.keyboard.press("Enter");
    await expect.soft(page.getByRole("button", { name: /^Our Services/ })).toBeVisible();
    await page.getByRole("button", { name: "Make this the home page" }).first().click();
    await expect.soft(page.getByRole("button", { name: /^Our Services\s*Home/ })).toBeVisible();
    await shot(page, "s08-renamed-set-home");
    await waitSaved(page);
    const savedHome = async () => {
      const p = await project();
      const home = new Map(p.data.pages.pages).get(p.data.pages.homePageId);
      return `${home?.name} ${home?.path}`;
    };
    await expect.soft.poll(savedHome, { message: "home page saved", timeout: 15_000 }).toBe("Our Services /");
    // Put Home back as home, then delete the new page.
    await page.getByRole("button", { name: /^Home/ }).first().click();
    await page.getByRole("button", { name: "Make this the home page" }).first().click();
    await page.getByRole("button", { name: /^Our Services/ }).hover();
    await page.getByRole("button", { name: "Delete page" }).last().click();
    await expect.soft(page.getByRole("button", { name: /^Our Services/ })).toHaveCount(0);
    await shot(page, "s09-page-deleted");
    await page.getByRole("button", { name: /^Home/ }).first().click();
    await expect.soft(canvas.locator("h1")).toHaveCount(1);
  });

  await test.step("Layers: expand, select, rename, drag to reorder, context menu", async () => {
    await tab("Navigator").click();
    const rowOf = (text: string) => page.locator('div[draggable="true"]', { hasText: new RegExp(`^\\S*\\s*${text}`) }).first();
    await rowOf("Menu Section").locator("button").first().click();
    await rowOf("Menu Heading").click();
    await expect.soft(canvas.locator("[data-ws-selected]")).toHaveText("Our Specialty Coffee Menu");
    await shot(page, "s10-layers-select");
    await rowOf("Menu Heading").click({ button: "right" });
    await shot(page, "s11-layers-menu");
    await page.getByRole("button", { name: "Rename" }).click();
    await page.keyboard.press("ControlOrMeta+a");
    await page.keyboard.type("Coffee Menu Title");
    await page.keyboard.press("Enter");
    await expect.soft(rowOf("Coffee Menu Title")).toBeVisible();
    const sections = () => canvas.locator('[data-ws-component="Body"]').first().evaluate((b) => [...b.children].map((c) => c.tagName));
    const before = await sections();
    await rowOf("Footer").dragTo(rowOf("Navbar"), { targetPosition: { x: 40, y: 3 } });
    await page.waitForTimeout(600);
    expect.soft((await sections())[0], "footer dragged above the navbar").toBe("FOOTER");
    await shot(page, "s12-layers-dragged");
    await undo();
    await expect.soft.poll(sections).toEqual(before);
    await rowOf("Coffee Menu Title").click({ button: "right" });
    await page.getByRole("button", { name: "Delete", exact: true }).click();
    await expect.soft(page.getByRole("alert").filter({ hasText: "Element deleted" })).toBeVisible();
    await page.getByRole("alert").getByRole("button", { name: "Undo" }).click();
    await expect.soft(canvas.locator("h2", { hasText: "Our Specialty Coffee Menu" })).toHaveCount(1);
  });

  await test.step("Assets: upload, use in an Image, delete", async () => {
    await tab("Assets").click();
    await page.locator('input[type="file"][accept^="image/*,font"]').setInputFiles({ name: "audit-red.png", mimeType: "image/png", buffer: png(220, 30, 30) });
    const card = page.locator('div[draggable="true"][title^="audit-red"]');
    await expect.soft(card).toBeVisible({ timeout: 30_000 });
    await shot(page, "s13-asset-uploaded");
    if (!(await card.isVisible())) return;
    const img = canvas.locator("section").first().locator("img").first();
    await img.click();
    await card.hover();
    await card.getByRole("button", { name: "Insert" }).click();
    await expect.soft.poll(() => img.getAttribute("src")).toMatch(/audit-red/);
    await img.scrollIntoViewIfNeeded();
    await shot(page, "s14-asset-in-image");
    await undo();
    await card.hover();
    await card.getByRole("button", { name: "Delete" }).click();
    await shot(page, "s15-asset-delete-confirm");
    await page.locator("div", { hasText: /^Delete asset\?/ }).last().locator("..").getByRole("button", { name: "Delete", exact: true }).click();
    await expect.soft(card).toHaveCount(0);
  });

  await test.step("CSS variables and Custom CSS are hidden (Tier C); Save button agrees with autosave", async () => {
    await expect.soft(tab("CSS Vars")).toHaveCount(0);
    await expect.soft(tab("Custom CSS")).toHaveCount(0);
    await waitSaved(page);
    await expect.soft(page.getByRole("button", { name: /^saved$/i }), "Save button settles on Saved").toBeVisible();
    await shot(page, "s16-rail-and-saved");
  });

  await test.step("Templates: insert a section", async () => {
    await tab("Templates").click();
    await shot(page, "s18-templates-panel");
    const body = canvas.locator('[data-ws-component="Body"]').first();
    const count = () => body.evaluate((b) => b.children.length);
    const before = await count();
    await page.getByRole("button", { name: "Use Template" }).first().click();
    await expect.soft.poll(count).toBe(before + 1);
    const added = canvas.locator('[data-ws-component="Body"] > *').last();
    await expect.soft(added, "canvas scrolls to the new section").toBeInViewport({ ratio: 0.2 });
    await shot(page, "s19-template-inserted");
    await undo();
    await expect.soft.poll(count).toBe(before);
  });

  await test.step("Panel resize and collapse", async () => {
    await tab("Navigator").click();
    const handle = page.locator('[title="Drag to resize"]').first();
    const h = (await handle.boundingBox())!;
    await page.mouse.move(h.x + h.width / 2, h.y + 200);
    await page.mouse.down();
    await page.mouse.move(h.x + 100, h.y + 200, { steps: 10 });
    await page.mouse.up();
    expect.soft((await handle.boundingBox())!.x - h.x, "panel 100px wider").toBeGreaterThan(80);
    await shot(page, "s20-resized");
    await tab("Navigator").click();
    await expect.soft(handle, "panel collapsed").toHaveCount(0);
    await shot(page, "s21-collapsed");
  });
});
