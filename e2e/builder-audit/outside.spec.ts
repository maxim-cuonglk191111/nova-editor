// Task 009 batch 3 — everything outside the builder, scored for ease: sign up, log in / out,
// forgot password, onboarding, dashboard (empty state, create, open, rename, clone, delete,
// search), Leads, Analytics, Settings (language, subscription, history), pricing and the
// VietQR checkout up to the QR (no payment). Soft steps: each is recorded and the run goes on.
// Screenshots o*.png, notes in outside-report.json.
//   pwsh scripts/audit-run.ps1 e2e/builder-audit/outside.spec.ts
import { test, expect, type Page } from "@playwright/test";
import { writeFileSync } from "node:fs";
import { pinLocale, seedProject, deleteFreshAccount, type FreshAccount } from "../helpers/fresh-account";
import { OUT } from "./audit";

let acc: FreshAccount | undefined;
const { SUPABASE_URL: SB_URL, SUPABASE_SERVICE_KEY: SB_KEY } = process.env;
test.afterAll(async () => {
  if (acc && SB_URL && SB_KEY) {
    const h = { apikey: SB_KEY, authorization: `Bearer ${SB_KEY}` };
    const users = (await (await fetch(`${SB_URL}/rest/v1/users?email=eq.${encodeURIComponent(acc.email)}&select=id`, { headers: h })).json()) as { id: string }[];
    if (users[0]) await fetch(`${SB_URL}/rest/v1/payment_orders?user_id=eq.${users[0].id}`, { method: "DELETE", headers: h });
  }
  await deleteFreshAccount(acc);
});

const notes: Record<string, string[]> = {};
let n = 0;
async function step(page: Page, name: string, fn: () => Promise<void>) {
  notes[name] = [];
  await test.step(name, async () => {
    try {
      await fn();
    } catch (err) {
      notes[name].push(`FAILED: ${(err as Error).message.split("\n")[0]}`);
      await shot(page, `FAIL-${name.slice(0, 20)}`);
    }
  });
}
const note = (name: string, msg: string) => { notes[name].push(msg); console.log(`   · ${name}: ${msg}`); };
const shot = (page: Page, name: string) => page.screenshot({ path: `${OUT}/o${String(++n).padStart(2, "0")}-${name}.png` });

test("outside the builder: auth, dashboard, leads, analytics, settings, pricing, checkout", async ({ page }) => {
  test.setTimeout(900_000);
  page.setDefaultTimeout(15_000);
  await pinLocale(page, "en");
  const email = `qa.outside.${Date.now()}@testqa.dev`;
  const password = "QaOutside!2026";

  await step(page, "pricing (signed out)", async () => {
    await page.goto("/pricing");
    await shot(page, "pricing");
    const buy = page.locator("main button").filter({ hasText: /pro|upgrade|choose|get|start|buy/i }).first();
    note("pricing (signed out)", `plan button: ${await buy.innerText()}`);
    await buy.click();
    await shot(page, "pricing-checkout-signed-out");
    note("pricing (signed out)", `modal: ${(await page.locator("h3, h4").allInnerTexts()).join(" | ")}`);
  });

  await step(page, "sign up", async () => {
    await page.goto("/signup");
    await shot(page, "signup");
    const submit = page.locator('button[type="submit"]');
    note("sign up", `empty form: submit enabled = ${await submit.isEnabled()}`);
    await page.locator('input[type="text"]').first().fill("QA Outside");
    await page.locator('input[type="email"]').fill(email);
    const pw = page.locator('input[type="password"]');
    await pw.nth(0).fill("short");
    if ((await pw.count()) > 1) await pw.nth(1).fill("different");
    await pw.nth(1).blur();
    await page.waitForTimeout(800);
    await shot(page, "signup-bad-password");
    note("sign up", `short + mismatched password: submit enabled = ${await submit.isEnabled()}; form text: ${(await page.locator("form").first().innerText()).replace(/\s+/g, " ").slice(0, 300)}`);
    if (await submit.isEnabled()) {
      await submit.click();
      await page.waitForTimeout(1_000);
      await shot(page, "signup-bad-password-submitted");
      note("sign up", `after submit: ${(await page.locator("form").first().innerText()).replace(/\s+/g, " ").slice(0, 300)}`);
    }
    await pw.nth(0).fill(password);
    if ((await pw.count()) > 1) await pw.nth(1).fill(password);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL((u) => !u.pathname.startsWith("/signup"), { timeout: 60_000 });
    acc = { email, password };
    note("sign up", `landed on ${new URL(page.url()).pathname}`);
  });

  await step(page, "onboarding + empty dashboard", async () => {
    if (!page.url().includes("/projects")) await page.goto("/projects");
    await page.waitForTimeout(2_000);
    await shot(page, "dashboard-empty");
    note("onboarding + empty dashboard", `visible text: ${(await page.locator("main, body").first().innerText()).replace(/\s+/g, " ").slice(0, 400)}`);
  });

  await step(page, "new site dialog", async () => {
    await page.getByRole("button", { name: /new site/i }).first().click();
    await page.waitForTimeout(500);
    await shot(page, "new-site-dialog");
    note("new site dialog", (await page.locator('[role="dialog"], form').first().innerText().catch(() => "")).replace(/\s+/g, " ").slice(0, 300));
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: /^cancel$/i }).click().catch(() => {});
  });

  await step(page, "log out", async () => {
    await page.goto("/projects");
    await page.locator('button[aria-haspopup="menu"]').first().click();
    await page.waitForTimeout(400);
    await shot(page, "user-menu");
    note("log out", `menu: ${(await page.getByRole("link").allInnerTexts()).filter((t) => t.trim()).slice(-8).join(" | ")}`);
    await page.getByText(/sign out|log out/i).first().click();
    await page.waitForURL((u) => !u.pathname.startsWith("/projects"), { timeout: 30_000 });
    await shot(page, "after-logout");
  });

  await step(page, "log in", async () => {
    await page.goto("/login");
    await page.locator('input[type="email"]').fill(email);
    await page.locator('input[type="password"]').fill("WrongPass!1");
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(3_000);
    await shot(page, "login-wrong-password");
    note("log in", `error: ${(await page.locator("form").first().innerText()).replace(/\s+/g, " ").slice(0, 200)}`);
    await page.locator('input[type="password"]').fill(password);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(/\/projects/, { timeout: 60_000 });
  });

  await step(page, "forgot password", async () => {
    const p = await page.context().newPage();
    await p.goto("/forgot-password");
    await shot(p, "forgot-password");
    await p.locator('input[type="email"]').fill(email);
    await p.locator('button[type="submit"]').click();
    await p.waitForTimeout(2_000);
    await shot(p, "forgot-password-sent");
    await p.close();
  });

  let id = "";
  await step(page, "dashboard with sites", async () => {
    id = await seedProject(page, "Da Lat Slow Coffee");
    await seedProject(page, "Hanoi Bakery");
    await page.goto("/projects");
    await expect(page.locator('[title="Hanoi Bakery"]')).toBeVisible({ timeout: 30_000 });
    await shot(page, "dashboard-sites");
    const card = page.locator("div", { has: page.locator('[title="Da Lat Slow Coffee"]') }).filter({ has: page.locator("button") }).last();
    await card.hover();
    note("dashboard with sites", `card buttons: ${(await card.locator("button").evaluateAll((bs) => bs.map((b) => `${(b.textContent ?? "").trim()}${b.getAttribute("title") ? ` [${b.getAttribute("title")}]` : ""}`))).join(" | ")}`);
    const rename = card.getByRole("button", { name: /rename/i });
    note("dashboard with sites", `rename control: ${(await rename.count()) > 0}`);
    if (await rename.count()) {
      await rename.first().click();
      await page.keyboard.press("ControlOrMeta+a");
      await page.keyboard.type("Da Lat Coffee House");
      const saving = page.waitForResponse((r) => r.url().endsWith(`/api/projects/${id}`) && r.request().method() === "PATCH");
      await page.keyboard.press("Enter");
      note("dashboard with sites", `rename request: ${(await saving).status()}`);
      await expect(page.locator('[title="Da Lat Coffee House"]')).toBeVisible();
      await shot(page, "dashboard-renamed");
      const saved = (await (await page.request.get(`/api/projects/${id}`)).json()) as { name?: string; project_name?: string };
      note("dashboard with sites", `saved name: ${saved.name ?? saved.project_name}`);
    }
    await page.locator('input[placeholder*="earch"]').first().fill("bakery");
    await page.waitForTimeout(500);
    await shot(page, "dashboard-search");
    await page.locator('input[placeholder*="earch"]').first().fill("");
  });

  await step(page, "leads", async () => {
    await page.goto(`/submissions/${id}`);
    await page.waitForTimeout(2_500);
    await shot(page, "leads-empty");
    note("leads", (await page.locator("body").innerText()).replace(/\s+/g, " ").slice(0, 300));
  });

  await step(page, "analytics", async () => {
    await page.goto(`/analytics/${id}`);
    await page.waitForTimeout(2_500);
    await shot(page, "analytics-empty");
    note("analytics", (await page.locator("body").innerText()).replace(/\s+/g, " ").slice(0, 300));
  });

  await step(page, "settings: language", async () => {
    await page.goto("/settings/language");
    await page.waitForTimeout(1_500);
    await shot(page, "settings-language");
    note("settings: language", (await page.locator("body").innerText()).replace(/\s+/g, " ").slice(0, 300));
  });

  await step(page, "settings: subscription + VietQR", async () => {
    await page.goto("/settings/subscription");
    await page.waitForTimeout(2_000);
    await shot(page, "subscription");
    note("settings: subscription + VietQR", (await page.locator("body").innerText()).replace(/\s+/g, " ").slice(0, 400));
    await page.locator("main button, button").filter({ hasText: /upgrade|pro|choose|buy/i }).first().click();
    await page.waitForTimeout(800);
    await shot(page, "checkout-details");
    const agree = page.locator('input[type="checkbox"]').last();
    if (await agree.count()) await agree.check();
    await page.getByRole("button", { name: /pay|continue|qr|create|proceed/i }).last().click();
    await page.locator('img[src^="data:image"], img[alt*="QR" i], canvas').first().waitFor({ timeout: 30_000 });
    await page.waitForTimeout(800);
    await shot(page, "checkout-qr");
    note("settings: subscription + VietQR", `qr step: ${(await page.locator("h3").allInnerTexts()).join(" | ")}`);
    await page.keyboard.press("Escape");
    await page.locator('button[aria-label]').filter({ hasText: "×" }).first().click().catch(() => {});
  });

  await step(page, "settings: payment history", async () => {
    await page.goto("/settings/subscription/history");
    await page.waitForTimeout(2_000);
    await shot(page, "payment-history");
  });

  await step(page, "phone width", async () => {
    await page.setViewportSize({ width: 390, height: 844 });
    for (const [path, name] of [["/projects", "phone-dashboard"], ["/settings/subscription", "phone-subscription"], [`/submissions/${id}`, "phone-leads"]] as const) {
      await page.goto(path);
      await page.waitForTimeout(2_000);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2);
      note("phone width", `${path}: horizontal overflow ${overflow}`);
      await shot(page, name);
    }
    await page.context().clearCookies();
    await page.goto("/login");
    await shot(page, "phone-login");
  });

  writeFileSync(`${OUT}/outside-report.json`, JSON.stringify(notes, null, 2));
  const failed = Object.entries(notes).filter(([, v]) => v.some((m) => m.startsWith("FAILED")));
  console.log("\nFAILED steps:", failed.map(([k, v]) => `${k}: ${v.find((m) => m.startsWith("FAILED"))}`));
});
