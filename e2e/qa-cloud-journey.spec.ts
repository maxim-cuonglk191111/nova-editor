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
import { mkdirSync, readFileSync, writeFileSync } from "fs";

const OUT = process.env.QA_OUT ?? "qa-screenshots/cloud";
mkdirSync(OUT, { recursive: true });

const PROMPT =
  process.env.QA_PROMPT ??
  "A landing page for a specialty coffee shop in Da Lat: hero with call to action, menu with prices, about our beans, customer testimonials, opening hours, contact form, footer";

type StepLog = { step: string; ok: boolean; notes: string[]; consoleErrors: string[]; failedRequests: string[]; screenshots: string[] };
const report: StepLog[] = [];
let current: StepLog | null = null;
let failPage: Page | null = null;
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
    const lines = (err as Error).message.split("\n");
    const detail = lines.filter((l) => /waiting for|intercepts pointer|not visible|not stable|outside of the viewport/.test(l)).slice(0, 3).map((l) => l.trim());
    note(`FAILED: ${lines[0]}${detail.length ? ` | ${detail.join(" | ")}` : ""}`);
    if (failPage) await shot(failPage, `FAIL-${name.split(" ")[0]}`);
  }
}
const visible = (loc: Locator, timeout = 5_000) => loc.isVisible({ timeout }).catch(() => false);
const rel = (url: string) => url.replace(/^https?:\/\/[^/]+/, "");

test("QA cloud journey", async ({ page, context, baseURL }) => {
  page.setDefaultTimeout(20_000);
  failPage = page;
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
  // QA_MOCK_AI=<saved /api/ai response JSON> replays a real composition so the
  // post-generation steps can run on a dev server without AI provider keys.
  if (process.env.QA_MOCK_AI) {
    const recorded = readFileSync(process.env.QA_MOCK_AI, "utf8");
    await context.route("**/api/ai", (route) => route.fulfill({ status: 200, contentType: "application/json", body: recorded }));
  }

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
    page.on("response", async (r) => {
      if (r.url().endsWith("/api/ai") && r.request().method() === "POST") {
        const body = await r.text().catch(() => "");
        writeFileSync(`${OUT}/ai-response.json`, body);
        try {
          const j = JSON.parse(body) as { provider?: string; fallbacks?: unknown[] };
          note(`AI provider: ${j.provider} (skipped: ${JSON.stringify(j.fallbacks ?? [])})`);
        } catch { /* non-JSON error page */ }
      }
    });
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
    // First-run tour appears once the AI panel closes — a new user would skip it.
    const skipTour = page.getByRole("button", { name: /^(skip|bỏ qua)$/i });
    if (await visible(skipTour, 3_000)) {
      note("onboarding tour shown after apply — skipping");
      await skipTour.click();
    }
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
    const h1 = canvas.locator("h1, h2").first();
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

  await step("07b Style edit (raw property)", async () => {
    const h1 = canvas.locator("h1, h2").first();
    await h1.click();
    await page.locator('[role="tab"]').filter({ hasText: /^style$/i }).first().click();
    const prop = page.locator('input[placeholder^="prop" i]').last();
    const val = page.locator('input[placeholder^="value" i]').last();
    await prop.fill("color");
    await val.fill("#b91c1c");
    await val.press("Enter");
    await page.waitForTimeout(800);
    const color = await h1.evaluate((el) => getComputedStyle(el).color);
    note(`h1 color: ${color}`);
    await shot(page, "style-edited");
    if (color !== "rgb(185, 28, 28)") throw new Error("style not applied on canvas");
  });

  const countButtons = () => canvas.locator("button").count();

  await step("07c Add component (Button)", async () => {
    await canvas.locator("h1, h2").first().click();
    await page.locator('[aria-label="Components"]').first().click();
    const before = await countButtons();
    const card = page.getByText("Primary action button.").first();
    await card.dblclick();
    await page.waitForTimeout(1_200);
    const after = await countButtons();
    note(`canvas buttons ${before} → ${after}`);
    await shot(page, "component-added");
    if (after <= before) throw new Error("Button not inserted");
  });

  await step("07d Duplicate / delete / undo / redo", async () => {
    await canvas.locator("button").last().click();
    await page.waitForTimeout(500);
    const n0 = await countButtons();
    await page.locator("body").press("Control+d");
    await page.waitForTimeout(800);
    const n1 = await countButtons();
    await page.locator("body").press("Delete");
    await page.waitForTimeout(800);
    const n2 = await countButtons();
    await page.locator("body").press("Control+z");
    await page.waitForTimeout(800);
    const n3 = await countButtons();
    await page.locator("body").press("Control+Shift+z");
    await page.waitForTimeout(800);
    const n4 = await countButtons();
    note(`buttons: start ${n0} → dup ${n1} → delete ${n2} → undo ${n3} → redo ${n4}`);
    await shot(page, "dup-delete-undo");
    const problems = [n1 === n0 + 1 ? "" : "duplicate", n2 === n1 - 1 ? "" : "delete", n3 === n1 ? "" : "undo", n4 === n2 ? "" : "redo"].filter(Boolean);
    if (problems.length) throw new Error(`failed: ${problems.join(", ")}`);
  });

  await step("07e Navigator drag to reorder", async () => {
    if (!(await visible(page.getByText(/^navigator$/i).first(), 1_000))) {
      await page.getByText(/^layers$/i).first().click();
      await page.waitForTimeout(600);
    }
    const rootToggle = page.getByText("Page Root").first();
    if (await visible(rootToggle, 2_000)) await rootToggle.click();
    await page.waitForTimeout(400);
    const tops = await canvas.locator("body section, body header, body footer").evaluateAll((els) =>
      els.filter((e) => !e.parentElement?.closest("section, header, footer")).map((e) => (e.textContent ?? "").trim().slice(0, 18)));
    note(`canvas sections before: ${JSON.stringify(tops.slice(0, 4))}`);
    const rows = page.locator('[role="treeitem"], [data-tree-row], [draggable="true"]');
    note(`navigator draggable rows: ${await rows.count()}`);
    await shot(page, "navigator");
    if ((await rows.count()) < 3) throw new Error("navigator rows not found / not draggable");
    const a = await rows.nth(2).boundingBox();
    const b = await rows.nth(1).boundingBox();
    if (!a || !b) throw new Error("row geometry missing");
    await page.mouse.move(a.x + 40, a.y + a.height / 2);
    await page.mouse.down();
    await page.mouse.move(b.x + 40, b.y + 4, { steps: 12 });
    await page.mouse.up();
    await page.waitForTimeout(1_000);
    const after = await canvas.locator("body section, body header, body footer").evaluateAll((els) =>
      els.filter((e) => !e.parentElement?.closest("section, header, footer")).map((e) => (e.textContent ?? "").trim().slice(0, 18)));
    note(`canvas sections after: ${JSON.stringify(after.slice(0, 4))}`);
    await shot(page, "navigator-dragged");
    if (JSON.stringify(after) === JSON.stringify(tops)) throw new Error("order unchanged after drag");
    await page.locator("body").press("Control+z");
  });

  await step("07f Breakpoint switch (mobile)", async () => {
    const pills = await page.getByRole("button", { name: /^(desktop|tablet|mobile( [lp])?)$/i }).allTextContents();
    note(`breakpoint pills: ${JSON.stringify(pills)}`);
    await page.getByRole("button", { name: /^mobile( p)?$/i }).last().click({ timeout: 5_000 });
    await page.waitForTimeout(1_200);
    const w = (await page.locator('iframe[title="Canvas"]').boundingBox())?.width ?? 0;
    const overflow = await page.frames().find((f) => f.url().includes("/canvas"))
      ?.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2);
    note(`canvas width on mobile: ${Math.round(w)}, horizontal overflow: ${overflow}`);
    if (overflow) {
      // Name the widest offenders so the responsive pass can be fixed precisely.
      const offenders = await page.frames().find((f) => f.url().includes("/canvas"))?.evaluate(() => {
        const vw = window.innerWidth;
        return Array.from(document.querySelectorAll<HTMLElement>("body *"))
          .filter((el) => el.getBoundingClientRect().right > vw + 2 && !el.closest("script, style"))
          .filter((el) => !Array.from(el.children).some((c) => (c as HTMLElement).getBoundingClientRect().right > vw + 2))
          .slice(0, 6)
          .map((el) => {
            const cs = getComputedStyle(el);
            return `${el.tagName.toLowerCase()} w=${Math.round(el.getBoundingClientRect().width)} right=${Math.round(el.getBoundingClientRect().right)} ` +
              `width=${cs.width} minW=${cs.minWidth} maxW=${cs.maxWidth} flex=${cs.flex} pad=${cs.padding} text="${(el.textContent ?? "").trim().slice(0, 24)}"`;
          });
      });
      note(`overflow offenders (vw=${Math.round(w)}): ${JSON.stringify(offenders, null, 1)}`);
    }
    await shot(page, "breakpoint-mobile");
    await page.getByRole("button", { name: /^desktop$/i }).first().click().catch(() => {});
    if (w > 700) throw new Error("canvas did not narrow");
    if (overflow) throw new Error("generated page overflows horizontally on mobile");
  });

  await step("07g Pages panel (add page)", async () => {
    const tab = page.getByText(/^pages$/i).first();
    if (!(await visible(tab, 2_000))) throw new Error("no Pages tab in the left sidebar");
    await tab.click();
    await page.getByRole("button", { name: /\+ page/i }).click();
    await page.locator('input[placeholder="Page name"]').fill("About");
    await page.locator('input[placeholder^="/path"]').fill("/about");
    await page.locator('input[placeholder^="/path"]').press("Enter");
    await page.waitForTimeout(800);
    const listed = await page.getByText("/about").count();
    note(`'/about' entries in pages panel: ${listed}`);
    await shot(page, "pages-panel");
    if (listed === 0) throw new Error("new page not listed");
  });

  await step("07h Assets upload", async () => {
    await page.getByText(/^assets$/i).first().click();
    const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");
    const resp = page.waitForResponse((r) => r.url().includes("/api/assets") && r.request().method() === "POST", { timeout: 30_000 }).catch(() => null);
    await page.locator('input[type="file"][accept*="image"]').first().setInputFiles({ name: "qa-pixel.png", mimeType: "image/png", buffer: png });
    const r = await resp;
    note(r ? `upload → ${r.status()} ${(await r.text().catch(() => "")).slice(0, 160)}` : "no upload request");
    await page.waitForTimeout(1_500);
    await shot(page, "assets-uploaded");
    if (!r || r.status() >= 400) throw new Error("asset upload failed");
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
    await canvas.locator("h1, h2").first().waitFor({ timeout: 90_000 });
    const h1 = await canvas.locator("h1, h2").first().textContent();
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
    await pf.locator("h1, h2").first().waitFor({ timeout: 60_000 });
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

  await step("12 Log out → log in → project listed", async () => {
    await page.goto("/projects", { waitUntil: "networkidle" });
    await page.locator("header, div").getByRole("button").last().click().catch(() => {});
    const signOut = page.getByText(/sign out|log out|đăng xuất/i).first();
    if (await visible(signOut, 3_000)) await signOut.click();
    else await page.goto("/api/auth/signout");
    const confirm = page.getByRole("button", { name: /sign out/i });
    if (await visible(confirm, 2_000)) await confirm.click();
    await page.waitForLoadState("networkidle");
    await page.goto("/projects");
    note(`after logout /projects → ${rel(page.url())}`);
    if (!page.url().includes("/login")) throw new Error("still signed in after logout");
    await page.locator('input[type="email"]').fill(email);
    await page.locator('input[type="password"]').fill(password);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(/\/projects/, { timeout: 60_000 });
    await page.getByText(/loading your sites/i).waitFor({ state: "hidden", timeout: 60_000 }).catch(() => {});
    const cards = await page.getByText(/coffee|da lat|landing/i).count();
    note(`project cards matching after re-login: ${cards}`);
    await shot(page, "relogin-projects");
    if (cards === 0) throw new Error("project not listed after re-login");
  });

  writeFileSync(`${OUT}/report.json`, JSON.stringify({ email, projectId, report }, null, 2));
  console.log("\n══ SUMMARY ══");
  for (const s of report) console.log(`${s.ok ? "✓" : "✗"} ${s.step} (console errors: ${s.consoleErrors.length}, failed req: ${s.failedRequests.length})`);
});
