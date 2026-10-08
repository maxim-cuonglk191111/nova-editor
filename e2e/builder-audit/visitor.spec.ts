// Task 009 batch 4 — what the end visitor gets. For six businesses (EN and VI prompts): generate
// the page with AI in the builder, then check the public preview and the HTML export: requested
// sections present, one h1, images load, readable contrast (WCAG AA), no horizontal overflow at
// 375 px, nav links lead somewhere, the contact form submits and the message reaches Leads.
// ≥ 65 s between AI calls (shared free quota). Screenshots w*.png, report visitor-report.json.
//   pwsh scripts/audit-run.ps1 e2e/builder-audit/visitor.spec.ts      (VISITOR_ONLY=0,3 runs a subset)
import { test, type Page, type Browser } from "@playwright/test";
import { writeFileSync } from "node:fs";
import { freshAccount, deleteFreshAccount, type FreshAccount } from "../helpers/fresh-account";
import { OUT } from "./audit";

let acc: FreshAccount | undefined;
test.afterAll(async () => deleteFreshAccount(acc));

type Biz = { key: string; prompt: string; sections: RegExp[] };
const BUSINESSES: Biz[] = [
  { key: "coffee-en", prompt: "A landing page for a specialty coffee shop in Da Lat: hero with call to action, menu with prices, about our beans, customer testimonials, opening hours, contact form, footer", sections: [/menu/i, /bean|about/i, /testimonial|customer|review/i, /hour|open/i, /contact/i] },
  { key: "dental-en", prompt: "Website for a family dental clinic in Ho Chi Minh City: hero, services with prices, our dentists, patient reviews, FAQ, booking contact form, footer with address", sections: [/service/i, /dentist|team|doctor/i, /review|patient|testimonial/i, /faq|question/i, /book|contact|appointment/i] },
  { key: "yoga-en", prompt: "A yoga studio in Hanoi: hero, class schedule, pricing plans, instructors, student stories, contact form, footer", sections: [/schedule|class/i, /pric|plan|membership/i, /instructor|teacher|team/i, /stor|testimonial|review/i, /contact/i] },
  { key: "banhmi-vi", prompt: "Trang web cho tiệm bánh mì ở Hà Nội: phần mở đầu, thực đơn có giá, câu chuyện của tiệm, đánh giá của khách, giờ mở cửa, form liên hệ đặt hàng, chân trang", sections: [/thực đơn|menu/i, /câu chuyện|giới thiệu|về chúng/i, /đánh giá|khách hàng|cảm nhận/i, /giờ|mở cửa/i, /liên hệ|đặt hàng/i] },
  { key: "spa-vi", prompt: "Website cho spa làm đẹp ở Đà Nẵng: phần mở đầu, các dịch vụ và bảng giá, đội ngũ chuyên viên, cảm nhận khách hàng, câu hỏi thường gặp, form đặt lịch, chân trang", sections: [/dịch vụ/i, /giá/i, /đội ngũ|chuyên viên/i, /cảm nhận|đánh giá|khách hàng/i, /đặt lịch|liên hệ/i] },
  { key: "english-vi", prompt: "Trang web cho trung tâm tiếng Anh trẻ em ở Cần Thơ: phần mở đầu, các khóa học, giáo viên, phụ huynh nói gì, học phí, form đăng ký học thử, chân trang", sections: [/khóa học/i, /giáo viên/i, /phụ huynh|cảm nhận|đánh giá/i, /học phí|giá/i, /đăng ký|liên hệ/i] },
];
const only = process.env.VISITOR_ONLY?.split(",").map(Number);
// Only Groq answers from the Worker (Gemini is region-blocked, Mistral rate-limited) and a full page
// uses a large share of its 30k tokens/minute, so wait 2 minutes between pages.
const AI_GAP = 120_000;

type Report = Record<string, unknown>;
const report: Record<string, Report> = {};

/** Checks on the rendered site inside a frame or page. */
const inspect = (root: Page | ReturnType<Page["frames"]>[number]) =>
  root.evaluate(() => {
    const lum = (rgb: number[]) => {
      const c = rgb.map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; });
      return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
    };
    const parse = (s: string) => (s.match(/[\d.]+/g) ?? []).map(Number);
    const bgOf = (el: Element | null): number[] | null => {
      for (let e = el; e; e = e.parentElement) {
        const cs = getComputedStyle(e);
        if (cs.backgroundImage && cs.backgroundImage !== "none") return null; // image / gradient: unknown
        const c = parse(cs.backgroundColor);
        if (c.length >= 3 && (c[3] ?? 1) > 0.5) return c.slice(0, 3);
      }
      return [255, 255, 255];
    };
    const lowContrast: string[] = [];
    let checked = 0;
    for (const el of Array.from(document.body.querySelectorAll<HTMLElement>("h1,h2,h3,h4,p,a,button,li,span,label"))) {
      const own = Array.from(el.childNodes).some((n) => n.nodeType === 3 && n.textContent!.trim());
      if (!own || el.getBoundingClientRect().width === 0) continue;
      const cs = getComputedStyle(el);
      const fg = parse(cs.color).slice(0, 3);
      const bg = bgOf(el);
      if (!bg || fg.length < 3) continue;
      checked++;
      const [a, b] = [lum(fg), lum(bg)].sort((x, y) => y - x);
      const ratio = (a + 0.05) / (b + 0.05);
      const size = parseFloat(cs.fontSize);
      const large = size >= 24 || (size >= 18.66 && Number(cs.fontWeight) >= 700);
      if (ratio < (large ? 3 : 4.5)) lowContrast.push(`${ratio.toFixed(2)} "${(el.textContent ?? "").trim().slice(0, 40)}"`);
    }
    const ids = new Set(Array.from(document.querySelectorAll("[id]")).map((e) => e.id));
    const links = Array.from(document.querySelectorAll<HTMLAnchorElement>("header a, nav a")).map((a) => a.getAttribute("href") ?? "");
    const deadLinks = links.filter((h) => !h || h === "#" || (h.startsWith("#") && !ids.has(h.slice(1))));
    const imgs = Array.from(document.querySelectorAll("img"));
    return {
      h1: document.querySelectorAll("h1").length,
      headings: Array.from(document.querySelectorAll("h1,h2")).map((h) => (h.textContent ?? "").trim().slice(0, 60)),
      text: document.body.innerText.slice(0, 6000),
      images: imgs.map((i) => `${i.complete && i.naturalWidth === 0 ? "BROKEN " : ""}${i.alt || "(no alt)"} ← ${i.src.slice(0, 90)}`),
      brokenImages: imgs.filter((i) => i.complete && i.naturalWidth === 0).length,
      forms: document.querySelectorAll("form").length,
      navLinks: links,
      deadLinks,
      contrastChecked: checked,
      lowContrast: lowContrast.slice(0, 12),
      overflowX: document.documentElement.scrollWidth > window.innerWidth + 2,
      overflowBy: document.documentElement.scrollWidth - window.innerWidth,
    };
  });

async function generate(page: Page, biz: Biz): Promise<string> {
  const r = await page.request.post("/api/projects", { data: { name: biz.key } });
  const { id } = (await r.json()) as { id: string };
  await page.goto(`/builder/${id}`);
  await page.locator('iframe[title="Canvas"]').waitFor({ timeout: 120_000 });
  await page.waitForTimeout(2_000);
  await page.locator("button", { hasText: "✦" }).last().click();
  const dialog = page.getByRole("dialog", { name: /generate with ai/i });
  await dialog.locator("textarea").fill(biz.prompt);
  const t0 = Date.now();
  const res = page.waitForResponse((x) => x.url().endsWith("/api/ai") && x.request().method() === "POST", { timeout: 300_000 });
  await dialog.getByRole("button", { name: /^generate/i }).click();
  let ai = await res;
  if (ai.status() === 502) {
    // One "temporarily unavailable" is the shared free quota; try once more after it refills.
    await page.waitForTimeout(90_000);
    const retry = page.waitForResponse((x) => x.url().endsWith("/api/ai") && x.request().method() === "POST", { timeout: 300_000 });
    await dialog.getByRole("button", { name: /^generate/i }).click();
    ai = await retry;
  }
  const body = (await ai.json().catch(() => ({}))) as { provider?: string; error?: string; composition?: { instances?: unknown[] } };
  report[biz.key] = { id, aiStatus: ai.status(), provider: body.provider, aiError: body.error, instances: body.composition?.instances?.length, seconds: Math.round((Date.now() - t0) / 1000) };
  if (!ai.ok()) throw new Error(`AI ${ai.status()}: ${body.error}`);
  await page.getByRole("button", { name: "Replace this page" }).click();
  await page.waitForTimeout(2_500);
  await page.getByText("All changes saved").waitFor({ timeout: 30_000 });
  return id;
}

async function visit(browser: Browser, owner: Page, biz: Biz, id: string) {
  const ctx = await browser.newContext({ baseURL: process.env.BASE_URL, viewport: { width: 1440, height: 900 } });
  const v = await ctx.newPage();
  await v.goto(`/preview/${id}`);
  const site = v.frameLocator('iframe[title="Preview"]');
  await site.locator("h1, h2").first().waitFor({ timeout: 120_000 });
  await v.waitForTimeout(2_500);
  const frame = () => v.frames().find((f) => f !== v.mainFrame())!;
  const desktop = await inspect(frame());
  const missing = biz.sections.filter((re) => !re.test(desktop.text)).map(String);
  await v.screenshot({ path: `${OUT}/w-${biz.key}-1-desktop.png` });
  // Scroll shots of the whole page.
  const h = await frame().evaluate(() => document.documentElement.scrollHeight);
  for (let y = 900, i = 2; y < h && i <= 5; y += 900, i++) {
    await frame().evaluate((yy) => window.scrollTo(0, yy), y);
    await v.waitForTimeout(400);
    await v.screenshot({ path: `${OUT}/w-${biz.key}-${i}-desktop.png` });
  }
  await v.setViewportSize({ width: 375, height: 812 });
  await v.waitForTimeout(1_500);
  await frame().evaluate(() => window.scrollTo(0, 0));
  const phone = await inspect(frame());
  await v.screenshot({ path: `${OUT}/w-${biz.key}-6-phone.png` });

  // Contact form: fill every field and submit.
  let lead = "no form";
  if (desktop.forms > 0) {
    await v.setViewportSize({ width: 1440, height: 900 });
    const form = site.locator("form").first();
    await form.scrollIntoViewIfNeeded();
    const email = `lead.${biz.key}.${Date.now()}@testqa.dev`;
    for (const input of await form.locator("input:not([type=hidden]):not([type=submit]), textarea").all()) {
      const type = (await input.getAttribute("type")) ?? "text";
      await input.fill(type === "email" ? email : type === "tel" ? "0901234567" : type === "date" ? "2026-12-01" : type === "number" ? "2" : "QA visitor test").catch(() => {});
    }
    const sent = v.waitForResponse((r) => r.url().includes("/api/submissions") && r.request().method() === "POST", { timeout: 20_000 }).catch(() => null);
    await form.locator('button, input[type="submit"]').last().click();
    const r = await sent;
    lead = r ? `submitted ${r.status()}` : "no submission request";
    await v.waitForTimeout(1_000);
    await v.screenshot({ path: `${OUT}/w-${biz.key}-7-form.png` });
    report[biz.key].leadEmail = email;
  }
  await ctx.close();

  // HTML export opened standalone, desktop and phone width.
  const exp = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const e = await exp.newPage();
  const html = await (await owner.request.get(`/api/export/${id}`)).text();
  await e.setContent(html, { waitUntil: "load" });
  await e.waitForTimeout(1_500);
  const exported = await inspect(e);
  await e.screenshot({ path: `${OUT}/w-${biz.key}-8-export.png`, fullPage: true });
  await e.setViewportSize({ width: 375, height: 812 });
  await e.waitForTimeout(800);
  const exportedPhone = await inspect(e);
  await e.screenshot({ path: `${OUT}/w-${biz.key}-9-export-phone.png` });
  await exp.close();

  Object.assign(report[biz.key], {
    missingSections: missing, h1: desktop.h1, headings: desktop.headings, images: desktop.images, brokenImages: desktop.brokenImages,
    contrast: `${desktop.lowContrast.length} low of ${desktop.contrastChecked}`, lowContrast: desktop.lowContrast,
    navLinks: desktop.navLinks, deadLinks: desktop.deadLinks, forms: desktop.forms, lead,
    phoneOverflow: phone.overflowX ? `${phone.overflowBy}px` : false,
    exportH1: exported.h1, exportBrokenImages: exported.brokenImages, exportLowContrast: exported.lowContrast.length,
    exportPhoneOverflow: exportedPhone.overflowX ? `${exportedPhone.overflowBy}px` : false,
  });
}

test("what the visitor gets: six AI pages, preview, phone, form → Leads, HTML export", async ({ page, browser }) => {
  test.setTimeout(3_600_000);
  acc = await freshAccount(page, "visitor");
  const list = BUSINESSES.filter((_, i) => !only || only.includes(i));
  for (const [i, biz] of list.entries()) {
    if (i > 0) await page.waitForTimeout(AI_GAP);
    await test.step(biz.key, async () => {
      try {
        const id = await generate(page, biz);
        await visit(browser, page, biz, id);
        const r = report[biz.key];
        if (r.leadEmail) {
          await page.goto(`/submissions/${id}`);
          r.leadListed = await page.getByText(String(r.leadEmail)).first().isVisible({ timeout: 30_000 }).catch(() => false);
          await page.screenshot({ path: `${OUT}/w-${biz.key}-10-leads.png` });
        }
        // Free plan: 3 projects — remove each page once it has been checked.
        await page.request.delete(`/api/projects/${id}`);
      } catch (err) {
        report[biz.key] = { ...(report[biz.key] ?? {}), failed: (err as Error).message.split("\n")[0] };
        await page.screenshot({ path: `${OUT}/w-${biz.key}-FAIL.png` });
        if (report[biz.key].id) await page.request.delete(`/api/projects/${report[biz.key].id}`);
      }
      console.log(biz.key, JSON.stringify(report[biz.key]).slice(0, 600));
    });
  }
  writeFileSync(`${OUT}/visitor-report.json`, JSON.stringify(report, null, 2));
});
