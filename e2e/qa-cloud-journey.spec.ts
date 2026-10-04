/**
 * Logged-in core journey against a deployed build:
 * signup → projects → "Build with AI" → apply → edit → save → reopen (persistence)
 * → preview (desktop + mobile) → export HTML.
 * Soft steps: every step is recorded (screenshots, console errors, failed requests)
 * and the run continues. Run with:
 *   BASE_URL=https://… npx playwright test -c playwright.cloud.config.ts e2e/qa-cloud-journey.spec.ts
 * Output: qa-screenshots/cloud/NN-*.png + report.json
 */
import { test, type Page, type Locator } from "@playwright/test";
import { mkdirSync, writeFileSync } from "fs";

const OUT = process.env.QA_OUT ?? "qa-screenshots/cloud";
mkdirSync(OUT, { recursive: true });

const PROMPT =
  process.env.QA_PROMPT ??
  "A landing page for a specialty coffee shop in Da Lat: hero with call to action, menu with prices, about our beans, customer testimonials, opening hours, contact form, footer";

type StepLog = { step: string; ok: boolean; notes: string[]; consoleErrors: string[]; failedRequests: string[]; screenshots: string[] };
const report: StepLog[] = [];
let current: StepLog | null = null;
let n = 0;

async function shot(page: Page, name: string, fullPage = false) {
  n += 1;
  const file = `${String(n).padStart(2, "0")}-${name}.png`;
  await page.screenshot({ path: `${OUT}/${file}`, fullPage }).catch(() => {});
  current?.screenshots.push(file);
}
function note(msg: string) {
  console.log(`   · ${msg}`);
  current?.notes.push(msg);
}
async function step(name: string, fn: () => Promise<void>) {
  current = { step: name, ok: true, notes: [], consoleErrors: [], failedRequests: [], screenshots: [] };
  report.push(current);
  console.log(`\n── ${name}`);
  try {
    await fn();
  } catch (err) {
    current.ok = false;
    note(`FAILED: ${(err as Error).message.split("\n")[0]}`);
  }
}
const visible = (loc: Locator, timeout = 5_000) => loc.isVisible({ timeout }).catch(() => false);
const rel = (url: string) => url.replace(/^https?:\/\/[^/]+/, "");

test("QA cloud journey", async ({ page, context, baseURL }) => {
  page.setDefaultTimeout(20_000);
  page.setDefaultNavigationTimeout(90_000);
  context.on("console", (m) => { if (m.type() === "error") current?.consoleErrors.push(m.text().slice(0, 300)); });
  context.on("response", (r) => {
    if (r.status() >= 400 && r.url().startsWith(baseURL ?? "")) {
      current?.failedRequests.push(`${r.status()} ${r.request().method()} ${rel(r.url())}`);
    }
  });
  page.on("pageerror", (e) => current?.consoleErrors.push(`pageerror: ${e.message.slice(0, 300)}`));
  // Pin the UI language; otherwise it follows the visitor's country (VN → vi).
  const locale = process.env.QA_LOCALE ?? "en";
  await context.addInitScript((l) => {
    try {
      localStorage.setItem("nova_locale", l);
      localStorage.setItem("nova_auto_detect_ip", "false");
    } catch { /* storage blocked */ }
  }, locale);
  await context.addCookies([{ name: "nova_locale", value: locale, url: baseURL! }]);

  const email = `qa.cloud.${Date.now()}@testqa.dev`;
  const password = "QaCloud!2026";
  let projectId = "";
  const canvas = page.frameLocator('iframe[title="Canvas"]');

  await step("01 Landing", async () => {
    await page.goto("/", { waitUntil: "networkidle" });
    await shot(page, "landing");
  });

  await step("02 Sign up", async () => {
    await page.goto("/signup", { waitUntil: "networkidle" });
    await page.locator('input[type="text"]').first().fill("QA Cloud");
    await page.locator('input[type="email"]').fill(email);
    const pw = page.locator('input[type="password"]');
    await pw.nth(0).fill(password);
    await pw.nth(1).fill(password);
    await shot(page, "signup-filled");
    await page.locator('button[type="submit"]').click();
    await page.waitForURL((u) => !u.pathname.startsWith("/signup"), { timeout: 60_000 });
    note(`after signup: ${rel(page.url())}`);
    await page.waitForLoadState("networkidle").catch(() => {});
    await shot(page, "after-signup");
  });

  await step("03 Projects dashboard", async () => {
    if (!page.url().includes("/projects")) await page.goto("/projects", { waitUntil: "networkidle" });
    note(`url: ${rel(page.url())}`);
    if (!page.url().includes("/projects")) throw new Error("not on /projects after signup (session missing?)");
    await shot(page, "projects-empty");
  });

  await step("04 New Site → Build with AI", async () => {
    await page.getByRole("button", { name: /new site/i }).first().click();
    const ta = page.locator("textarea").first();
    await ta.fill(PROMPT);
    await shot(page, "new-site-prompt");
    await page.getByRole("button", { name: /build with ai/i }).click();
    await page.waitForURL(/\/builder\/[^/]+/, { timeout: 60_000 });
    projectId = page.url().split("/builder/")[1]!.split(/[/?#]/)[0]!;
    note(`project: ${projectId}`);
    await page.locator('iframe[title="Canvas"]').waitFor({ timeout: 90_000 });
    await shot(page, "builder-opened");
  });

  await step("05 AI generates a page", async () => {
    const dialog = page.locator('[role="dialog"][aria-label="Generate with AI"]');
    if (!(await visible(dialog, 10_000))) {
      note("AI panel did not auto-open; opening manually");
      await page.locator('button[title="Generate with AI"]').click();
      await dialog.locator("textarea").fill(PROMPT);
      await dialog.getByRole("button", { name: /generate/i }).last().click();
    }
    await shot(page, "ai-generating");
    const t0 = Date.now();
    const apply = page.getByRole("button", { name: /^apply/i }).first();
    const errorBox = dialog.getByText(/unavailable|failed|unauthorized|credits|error/i).first();
    await Promise.race([
      apply.waitFor({ timeout: 240_000 }),
      errorBox.waitFor({ timeout: 240_000 }).then(async () => { throw new Error(`AI error: ${await errorBox.textContent()}`); }),
    ]);
    note(`AI result in ${Math.round((Date.now() - t0) / 1000)}s`);
    await shot(page, "ai-result");
    await apply.click();
    await page.waitForTimeout(2_500);
    await shot(page, "ai-applied");
  });

  await step("06 Generated template quality checks", async () => {
    const counts = await canvas.locator("body").evaluate((b) => ({
      sections: b.querySelectorAll("section, header, footer, nav").length,
      h1: b.querySelectorAll("h1").length,
      h2: b.querySelectorAll("h2").length,
      images: b.querySelectorAll("img").length,
      brokenImages: Array.from(b.querySelectorAll("img")).filter((i) => (i as HTMLImageElement).complete && (i as HTMLImageElement).naturalWidth === 0).length,
      buttons: b.querySelectorAll("button, a").length,
      inputs: b.querySelectorAll("input, textarea").length,
      textLength: (b as HTMLElement).innerText.length,
      height: b.scrollHeight,
      overflowX: b.scrollWidth > (b.ownerDocument.defaultView?.innerWidth ?? 0) + 2,
    }));
    note(`structure: ${JSON.stringify(counts)}`);
    // Capture the whole generated page by scrolling the canvas iframe.
    const frame = page.frames().find((f) => f.url().includes("/canvas"));
    if (frame) {
      const h = await frame.evaluate(() => document.documentElement.scrollHeight);
      const vh = await frame.evaluate(() => window.innerHeight);
      for (let y = 0, i = 1; y < h && i <= 6; y += vh, i++) {
        await frame.evaluate((yy) => window.scrollTo(0, yy), y);
        await page.waitForTimeout(500);
        await shot(page, `canvas-part${i}`);
      }
      await frame.evaluate(() => window.scrollTo(0, 0));
    }
  });

  await step("07 Edit heading text (Props)", async () => {
    const h1 = canvas.locator("h1").first();
    await h1.click();
    await page.waitForTimeout(600);
    await page.locator('[role="tab"]').filter({ hasText: /^props$/i }).first().click();
    const ta = page.locator("textarea").first();
    note(`h1 before: ${JSON.stringify((await ta.inputValue()).slice(0, 60))}`);
    await ta.fill("Da Lat Slow Coffee — QA edit");
    await ta.press("Enter");
    await page.waitForTimeout(800);
    const after = await h1.textContent();
    note(`h1 after: ${JSON.stringify(after)}`);
    if (!after?.includes("QA edit")) throw new Error("edit not reflected on canvas");
    await shot(page, "heading-edited");
  });

  await step("08 Save project", async () => {
    const chip = page.getByText(/saving|saved|sync/i).first();
    if (await visible(chip, 3_000)) note(`sync chip: ${await chip.textContent()}`);
    const save = page.getByRole("button", { name: /^save$/i }).first();
    if (await save.isEnabled().catch(() => false)) {
      await save.click();
      await shot(page, "save-dialog");
      const update = page.getByRole("button", { name: /^update$/i });
      const resp = page.waitForResponse((r) => r.url().includes(`/api/projects/${projectId}`) && ["PUT", "PATCH", "POST"].includes(r.request().method()), { timeout: 30_000 }).catch(() => null);
      await update.click();
      const r = await resp;
      note(r ? `save → ${r.status()} ${r.request().method()} ${rel(r.url())}` : "no save request observed");
      await page.waitForURL(/\/projects/, { timeout: 30_000 }).catch(() => note("did not return to /projects"));
    } else {
      note("Save disabled — relying on autosave");
      await page.waitForTimeout(4_000);
    }
    await page.waitForLoadState("networkidle").catch(() => {});
    await shot(page, "after-save");
  });

  await step("09 Reopen project — edits persisted", async () => {
    await page.goto(`/builder/${projectId}`);
    await canvas.locator("h1").first().waitFor({ timeout: 90_000 });
    const h1 = await canvas.locator("h1").first().textContent();
    note(`h1 after reload: ${JSON.stringify(h1)}`);
    const sections = await canvas.locator("section, header, footer").count();
    note(`sections after reload: ${sections}`);
    await shot(page, "reopened");
    if (!h1?.includes("QA edit")) throw new Error("edit did not persist after reload");
  });

  await step("10 Preview (desktop + mobile)", async () => {
    const p = await context.newPage();
    await p.goto(`/preview/${projectId}`, { waitUntil: "networkidle" });
    const pf = p.frameLocator('iframe[title="Preview"]');
    await pf.locator("h1").first().waitFor({ timeout: 60_000 });
    await p.waitForTimeout(1_500);
    await p.screenshot({ path: `${OUT}/${String(++n).padStart(2, "0")}-preview-desktop.png` });
    current?.screenshots.push(`${String(n).padStart(2, "0")}-preview-desktop.png`);
    await p.setViewportSize({ width: 390, height: 844 });
    await p.waitForTimeout(1_500);
    const overflow = await p.frames().find((f) => f.url().includes("/canvas"))?.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2);
    note(`mobile horizontal overflow: ${overflow}`);
    await p.screenshot({ path: `${OUT}/${String(++n).padStart(2, "0")}-preview-mobile.png` });
    current?.screenshots.push(`${String(n).padStart(2, "0")}-preview-mobile.png`);
    await p.close();
  });

  await step("11 Export HTML", async () => {
    const r = await page.request.get(`/api/export/${projectId}`);
    const html = await r.text();
    note(`export → ${r.status()}, ${html.length} bytes`);
    if (!r.ok()) throw new Error(`export failed: ${html.slice(0, 160)}`);
    writeFileSync(`${OUT}/exported.html`, html);
    const p = await context.newPage();
    await p.setContent(html, { waitUntil: "load" });
    await p.waitForTimeout(1_000);
    await p.screenshot({ path: `${OUT}/${String(++n).padStart(2, "0")}-exported.png`, fullPage: true });
    current?.screenshots.push(`${String(n).padStart(2, "0")}-exported.png`);
    note(`exported has h1: ${await p.locator("h1").count()}, sections: ${await p.locator("section, header, footer").count()}`);
    await p.close();
  });

  writeFileSync(`${OUT}/report.json`, JSON.stringify({ email, projectId, report }, null, 2));
  console.log("\n══ SUMMARY ══");
  for (const s of report) console.log(`${s.ok ? "✓" : "✗"} ${s.step} (console errors: ${s.consoleErrors.length}, failed req: ${s.failedRequests.length})`);
});
