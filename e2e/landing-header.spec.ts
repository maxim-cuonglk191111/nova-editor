import { test, expect, type Page } from "@playwright/test";

// Two things are checked here.
//   1. The shared public header (pricing, terms, privacy). Complaints that prompted these
//      checks: the header was cramped and its "Projects" button could not be clicked (it carried
//      pointer-events: none).
//   2. The landing page "/", which is the version from before task 028 (sky video hero, dark
//      pill navbar): same nav as then, minus the /docs link that never resolved.
// Runs without credentials; the signed-in state is driven by answering next-auth's session
// endpoint, which is how the real client learns who you are.

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

async function open(page: Page, path: string, size = DESKTOP) {
  await page.setViewportSize(size);
  await page.addInitScript(() => localStorage.setItem("nova_locale", "en"));
  await page.goto(path);
  await expect(page.locator("h1")).toBeVisible({ timeout: 60_000 });
}

// ── 1. shared header, on /pricing ─────────────────────────────────────────────────────────
test("header: brand at 36px, sticky, readable links, primary actions >= 44px", async ({ page }) => {
  await open(page, "/pricing");
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
  await open(page, "/pricing");
  const hrefs = await page.locator("header.pn a[href], footer.pf a[href]").evaluateAll((els) => [...new Set(els.map((e) => e.getAttribute("href") ?? ""))]);
  expect(hrefs.some((h) => h.startsWith("/docs"))).toBe(false);
  for (const href of hrefs.filter((h) => h.startsWith("/"))) {
    const [path] = href.split("#");
    const res = await request.get(path || "/", { timeout: 120_000 });
    expect(res.status(), `${href} should resolve`).toBeLessThan(400);
  }
  // an anchor into the landing page must exist there
  await page.goto("/");
  for (const id of hrefs.filter((h) => h.startsWith("/#")).map((h) => h.slice(2))) await expect(page.locator(`[id="${id}"]`)).toHaveCount(1);
});

test("header: the Features link takes you to that section of the landing page", async ({ page }) => {
  await open(page, "/pricing");
  await page.locator("header.pn").getByRole("link", { name: "Features", exact: true }).click();
  await expect(page).toHaveURL(/\/#features$/, { timeout: 60_000 });
  await expect(page.locator("#features")).toBeVisible({ timeout: 60_000 });
});

test("header: signed out shows Log in + Sign up, no Projects link", async ({ page }) => {
  await open(page, "/pricing");
  const header = page.locator("header.pn");
  await expect(header.getByRole("link", { name: "Log in" })).toBeVisible();
  await expect(header.getByRole("link", { name: /Sign up/ })).toBeVisible();
  await expect(header.getByRole("link", { name: "Projects", exact: true })).toHaveCount(0);
});

test("header: the Projects button is clickable when signed in", async ({ page }) => {
  await signInAs(page);
  await open(page, "/terms"); // /pricing sends a signed-in user on to their subscription page
  const projects = page.locator("header.pn").getByRole("link", { name: "Projects", exact: true });
  await expect(projects).toBeVisible();
  // The old rule was `pointer-events: none` on this link.
  expect(await projects.evaluate((el) => getComputedStyle(el).pointerEvents)).not.toBe("none");
  await projects.click();
  // Without a real cookie the middleware sends us on to /login?callbackUrl=/projects: either
  // way the click navigated away from /terms.
  await expect(page).toHaveURL(/\/(projects|login)/, { timeout: 60_000 });
});

test("header: keyboard focus is visible on links and buttons", async ({ page }) => {
  await open(page, "/pricing");
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

test("mobile header: menu button opens and closes the panel; no horizontal scroll", async ({ page }) => {
  await open(page, "/pricing", MOBILE);
  const toggle = page.locator("header.pn .pn__toggle");
  await expect(toggle).toBeVisible();
  await expect(page.locator("header.pn .pn__links")).toBeHidden();
  expect((await toggle.boundingBox())!.width).toBeGreaterThanOrEqual(44);

  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  const panel = page.locator("#pn-panel");
  await expect(panel).toBeVisible();
  for (const name of ["Features", "Pricing", "Try Demo"]) {
    const link = panel.getByRole("link", { name, exact: true });
    await expect(link).toBeVisible();
    expect((await link.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  }

  await page.keyboard.press("Escape");
  await expect(panel).toBeHidden();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
});

test("mobile header: signed-in user keeps an avatar menu and a Projects entry", async ({ page }) => {
  await signInAs(page);
  await open(page, "/terms", MOBILE);
  await expect(page.locator("header.pn .pn__avatar button")).toBeVisible();
  await page.locator("header.pn .pn__toggle").click();
  await expect(page.locator("#pn-panel").getByRole("link", { name: "Projects", exact: true })).toBeVisible();
});

// ── 2. the landing page ───────────────────────────────────────────────────────────────────
test("landing: sky hero and the pill navbar, without a Docs link", async ({ page }) => {
  await open(page, "/");
  await expect(page.locator("h1")).toContainText("Build any website");
  await expect(page.locator(".origin-hero__video")).toHaveCount(1);
  const nav = page.locator("nav.on-navbar");
  for (const name of ["Try Demo", "Pricing", "Log in"]) await expect(nav.getByRole("link", { name, exact: true })).toBeVisible();
  await expect(nav.getByRole("link", { name: /Sign up free/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /docs/i })).toHaveCount(0);
  await expect(nav.getByRole("link", { name: "Projects", exact: true })).toHaveCount(0);
});

test("landing: signed in, the Projects link is in the navbar and clickable", async ({ page }) => {
  await signInAs(page);
  await open(page, "/");
  const projects = page.locator("nav.on-navbar").getByRole("link", { name: "Projects", exact: true });
  await expect(projects).toBeVisible();
  await expect(page.locator("nav.on-navbar").getByRole("link", { name: "Log in" })).toHaveCount(0);
});

test("landing: no dead links, no console errors, no horizontal scroll on a phone", async ({ page, request }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errors.push(m.text()); });
  await open(page, "/");
  const hrefs = await page.locator("a[href]").evaluateAll((els) => [...new Set(els.map((e) => e.getAttribute("href") ?? ""))]);
  expect(hrefs.some((h) => h.startsWith("/docs"))).toBe(false);
  for (const href of hrefs.filter((h) => h.startsWith("/"))) {
    const [path] = href.split("#");
    const res = await request.get(path || "/", { timeout: 120_000 });
    expect(res.status(), `${href} should resolve`).toBeLessThan(400);
  }
  await page.setViewportSize(MOBILE);
  await page.reload();
  await expect(page.locator("h1")).toBeVisible({ timeout: 60_000 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
  expect(errors).toEqual([]);
});
