import { test, expect, type Page } from "@playwright/test";

// Public header + landing page. Complaints that prompted these checks: the header was
// cramped and its "Projects" button could not be clicked (it carried pointer-events: none),
// and the AI icon looked off. Runs without credentials; the signed-in header is driven by
// answering next-auth's session endpoint, which is how the real client learns who you are.

const DESKTOP = { width: 1440, height: 900 };
const MOBILE = { width: 390, height: 844 };

async function signInAs(page: Page) {
  await page.route("**/api/auth/session", (route) =>
    route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        user: { name: "Quan Tran", email: "quan@example.dev" },
        expires: new Date(Date.now() + 3_600_000).toISOString(),
      }),
    })
  );
}

async function open(page: Page, size = DESKTOP) {
  await page.setViewportSize(size);
  await page.addInitScript(() => localStorage.setItem("nova_locale", "en"));
  await page.goto("/");
  await expect(page.locator("h1")).toBeVisible({ timeout: 60_000 });
}

test("header: brand at 36px, sticky, readable links, primary actions >= 44px", async ({ page }) => {
  await open(page);
  const header = page.locator("header.pn");
  const box = await header.boundingBox();
  expect(box!.height).toBeGreaterThanOrEqual(72);

  const logo = await header.locator(".pn__brand svg").boundingBox();
  expect(logo!.width).toBeGreaterThanOrEqual(36);
  await expect(header.getByText("Nova", { exact: true })).toBeVisible();

  const font = await header.locator(".pn__link").first().evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
  expect(font).toBeGreaterThanOrEqual(15);

  for (const target of [header.locator(".pn__btn--primary"), header.locator(".pn__btn--ghost")]) {
    expect((await target.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  }

  await page.evaluate(() => window.scrollTo(0, 2400));
  await page.waitForTimeout(300);
  expect((await header.boundingBox())!.y).toBeLessThanOrEqual(1);
});

test("header: every link resolves and none points at /docs", async ({ page, request }) => {
  await open(page);
  const hrefs = await page.locator("header.pn a[href], footer.pf a[href]").evaluateAll((els) => [...new Set(els.map((e) => e.getAttribute("href") ?? ""))]);
  expect(hrefs.some((h) => h.startsWith("/docs"))).toBe(false);
  for (const href of hrefs.filter((h) => h.startsWith("/"))) {
    const [path, hash] = href.split("#");
    const res = await request.get(path || "/", { timeout: 120_000 });
    expect(res.status(), `${href} should resolve`).toBeLessThan(400);
    if (hash) await expect(page.locator(`[id="${hash}"]`)).toHaveCount(1);
  }
});

test("header: anchor links scroll to their section", async ({ page }) => {
  await open(page);
  for (const [name, id] of [["Features", "features"], ["FAQ", "faq"]] as const) {
    await page.locator("header.pn").getByRole("link", { name, exact: true }).click();
    await page.waitForTimeout(900);
    const top = await page.locator(`#${id}`).evaluate((el) => el.getBoundingClientRect().top);
    expect(top, `#${id} should sit just below the sticky header`).toBeGreaterThanOrEqual(-4);
    expect(top).toBeLessThanOrEqual(140);
  }
});

test("header: signed out shows Log in + Sign up, no Projects link", async ({ page }) => {
  await open(page);
  const header = page.locator("header.pn");
  await expect(header.getByRole("link", { name: "Log in" })).toBeVisible();
  await expect(header.getByRole("link", { name: /Sign up/ })).toBeVisible();
  await expect(header.getByRole("link", { name: "Projects", exact: true })).toHaveCount(0);
});

test("header: the Projects button is clickable when signed in", async ({ page }) => {
  await signInAs(page);
  await open(page);
  const projects = page.locator("header.pn").getByRole("link", { name: "Projects", exact: true });
  await expect(projects).toBeVisible();
  // The old rule was `pointer-events: none` on this link.
  expect(await projects.evaluate((el) => getComputedStyle(el).pointerEvents)).not.toBe("none");
  await projects.click();
  // Without a real cookie the middleware sends us on to /login?callbackUrl=/projects: either
  // way the click navigated away from "/".
  await expect(page).toHaveURL(/\/(projects|login)/, { timeout: 60_000 });
});

test("header: keyboard focus is visible on links and buttons", async ({ page }) => {
  await open(page);
  await page.keyboard.press("Tab");
  for (let i = 0; i < 4; i++) {
    const outline = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement;
      const cs = getComputedStyle(el);
      return { tag: el.tagName, style: cs.outlineStyle, width: parseFloat(cs.outlineWidth) };
    });
    expect(outline.style, `focused ${outline.tag} #${i}`).not.toBe("none");
    expect(outline.width).toBeGreaterThan(0);
    await page.keyboard.press("Tab");
  }
});

test("mobile: menu button opens and closes the panel; no horizontal scroll", async ({ page }) => {
  await open(page, MOBILE);
  const toggle = page.locator("header.pn .pn__toggle");
  await expect(toggle).toBeVisible();
  await expect(page.locator("header.pn .pn__links")).toBeHidden();
  expect((await toggle.boundingBox())!.width).toBeGreaterThanOrEqual(44);

  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  const panel = page.locator("#pn-panel");
  await expect(panel).toBeVisible();
  for (const name of ["Features", "Pricing", "FAQ", "Try Demo"]) {
    const link = panel.getByRole("link", { name, exact: true });
    await expect(link).toBeVisible();
    expect((await link.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  }

  await page.keyboard.press("Escape");
  await expect(panel).toBeHidden();

  await toggle.click();
  await panel.getByRole("link", { name: "Pricing", exact: true }).click();
  await expect(page).toHaveURL(/\/pricing/);
  await expect(page.locator("#pn-panel")).toBeHidden();

  await page.goto("/");
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
});

test("mobile: signed-in user keeps an avatar menu and a Projects entry", async ({ page }) => {
  await signInAs(page);
  await open(page, MOBILE);
  await expect(page.locator("header.pn .pn__avatar button")).toBeVisible();
  await page.locator("header.pn .pn__toggle").click();
  await expect(page.locator("#pn-panel").getByRole("link", { name: "Projects", exact: true })).toBeVisible();
});

test("landing: the AI mark is an SVG icon, not an emoji or text glyph", async ({ page }) => {
  await open(page);
  const badge = page.locator(".lp-badge");
  await expect(badge.locator("svg")).toHaveCount(1);
  expect(await badge.innerText()).not.toMatch(/[✦✨⭐★🤖]/u);
  const body = await page.locator(".lp").innerText();
  expect(body).not.toMatch(/[✦✨🤖⚡🚀🎨📚☕]/u);
});

test("landing: pricing, FAQ and footer are present and the page has no console errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errors.push(m.text()); });
  await open(page);
  await expect(page.locator("#pricing .lp-h2")).toBeVisible();
  await expect(page.locator(".lp-faq__item")).toHaveCount(4);
  await expect(page.locator("footer.pf")).toBeVisible();
  // Lazy images only start loading once scrolled near; walk the page so none is judged unloaded.
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < height; y += 700) { await page.evaluate((top) => window.scrollTo(0, top), y); await page.waitForTimeout(120); }
  await page.waitForTimeout(600);
  const broken = await page.evaluate(() => [...document.images].filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.src));
  expect(broken).toEqual([]);
  expect(errors).toEqual([]);
});
