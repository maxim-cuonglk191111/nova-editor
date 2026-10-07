// B2 — canvas clipboard: copy / paste / cut (shortcuts + context menu), wrap in box,
// select parent; every change is undoable.
//   BASE_URL=... npx playwright test -c playwright.cloud.config.ts e2e/tier-b/b2-clipboard.spec.ts
import { test, expect } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { freshAccount, seedProject, openBuilder, deleteFreshAccount, type FreshAccount } from "../helpers/fresh-account";

const OUT = "qa-screenshots/tier-b";
mkdirSync(OUT, { recursive: true });
let acc: FreshAccount | undefined;
test.afterAll(async () => deleteFreshAccount(acc));
test.use({ permissions: ["clipboard-read", "clipboard-write"] });

test("B2 copy / paste / cut / wrap in box / select parent", async ({ page }) => {
  // The helper skips the tour ("nova-tour-done") but not the builder coach marks, whose overlay eats clicks.
  await page.context().addInitScript(() => localStorage.setItem("nova-coachmarks-seen", "1"));
  acc = await freshAccount(page, "b2");
  const id = await seedProject(page, "B2 Clipboard");
  await openBuilder(page, id);
  const canvas = page.frameLocator('iframe[title="Canvas"]');
  const navLinks = canvas.locator("header nav a");
  const linkTexts = () => navLinks.allInnerTexts().then((t) => t.map((s) => s.trim()));
  const link = (text: string) => navLinks.filter({ hasText: new RegExp(`^${text}$`) }).first();
  const menu = page.locator('div[style*="z-index: 9500"]');
  const menuItem = async (target: ReturnType<typeof link>, item: RegExp) => {
    await target.click({ button: "right" });
    await menu.getByRole("button", { name: item }).click();
    await expect(menu).toHaveCount(0);
  };
  const undo = async () => { await canvas.locator("h1").first().click(); await page.keyboard.press("ControlOrMeta+z"); };
  const original = ["Menu", "Our Beans", "Testimonials", "Contact"];
  await expect.poll(linkTexts).toEqual(original);
  await page.screenshot({ path: `${OUT}/b2-01-builder.png` });

  // Copy (Ctrl+C) "Menu", paste (Ctrl+V) after "Contact"
  await link("Menu").click();
  await page.keyboard.press("ControlOrMeta+c");
  await link("Contact").click();
  await page.keyboard.press("ControlOrMeta+v");
  await expect.poll(linkTexts).toEqual([...original, "Menu"]);
  const [orig, copy] = [navLinks.nth(0), navLinks.nth(4)];
  const look = (l: typeof orig) => l.evaluate((a) => ({ href: a.getAttribute("href"), color: getComputedStyle(a).color, weight: getComputedStyle(a).fontWeight }));
  await page.screenshot({ path: `${OUT}/b2-02-pasted.png` });
  // A copy should look and link like the original (props + styles travel with it).
  expect.soft(await look(copy), "pasted link keeps href and styles").toEqual(await look(orig));
  await undo();
  await expect.poll(linkTexts).toEqual(original);

  // Cut "Testimonials" (context menu), paste it after "Menu" (context menu)
  await menuItem(link("Testimonials"), /^Cut/);
  await expect.poll(linkTexts).toEqual(["Menu", "Our Beans", "Contact"]);
  await page.screenshot({ path: `${OUT}/b2-03-cut.png` });
  await link("Menu").click({ button: "right" });
  await page.screenshot({ path: `${OUT}/b2-04-context-menu.png` });
  await menu.getByRole("button", { name: /^Paste/ }).click();
  await expect.poll(linkTexts).toEqual(["Menu", "Testimonials", "Our Beans", "Contact"]);
  await page.screenshot({ path: `${OUT}/b2-05-cut-pasted.png` });
  await undo();
  await expect.poll(linkTexts).toEqual(["Menu", "Our Beans", "Contact"]);
  await page.keyboard.press("ControlOrMeta+z");
  await expect.poll(linkTexts).toEqual(original);

  // Wrap in Box: the link gets a new <div> parent inside <nav>; undo unwraps
  const parentTag = (text: string) => link(text).evaluate((a) => a.parentElement!.tagName);
  await menuItem(link("Our Beans"), /^Wrap in Box/);
  await expect.poll(() => parentTag("Our Beans")).toBe("DIV");
  expect(await link("Our Beans").evaluate((a) => a.parentElement!.parentElement!.tagName)).toBe("NAV");
  await page.screenshot({ path: `${OUT}/b2-06-wrapped.png` });
  await undo();
  await expect.poll(() => parentTag("Our Beans")).toBe("NAV");

  // Select parent: selection moves from the link to <nav> (canvas + Style panel header)
  await page.locator('[role="tab"]').filter({ hasText: /^style$/i }).first().click();
  await menuItem(link("Contact"), /^Select parent/);
  await expect(canvas.locator("[data-ws-selected]")).toHaveCount(1);
  expect(await canvas.locator("[data-ws-selected]").evaluate((el) => el.tagName)).toBe("NAV");
  await expect(page.getByText("Nav Links", { exact: true }).first()).toBeVisible();
  await page.screenshot({ path: `${OUT}/b2-07-select-parent.png` });

  // Ctrl+X is advertised in the context menu ("Cut ⌘X")
  await link("Contact").click();
  await page.keyboard.press("ControlOrMeta+x");
  await page.waitForTimeout(800);
  expect.soft(await linkTexts(), "Ctrl+X cuts the selected element").toEqual(["Menu", "Our Beans", "Testimonials"]);
  await page.screenshot({ path: `${OUT}/b2-08-ctrl-x.png` });
});

