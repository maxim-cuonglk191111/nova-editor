import { test, expect, type Page, type Route } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// Task 037 — the flows that change the page, each checked on the canvas and with a screenshot in
// doc/screenshots/.temp/ai-flows/: edit text + style, remove a section, replace a section, insert a
// section (never a second h1), the hover outline of a proposal line, narrow screens, and
// accessibility of the panel. The AI endpoint is answered by the test (deterministic, no quota);
// ai-panel.spec.ts covers the conversation itself.

const SHOTS = "doc/screenshots/.temp/ai-flows";
const HEADING = "Build any website with AI.";
const HERO_ID = "inst_hero01";
const FEATURES_ID = "inst_feat01";
const HEADING_ID = "inst_head01";

type Op = Record<string, unknown>;
type Composition = { instances: unknown[]; props: unknown[]; styleSources: unknown[]; styleSourceSelections: unknown[]; styles: unknown[]; usedComponents: string[]; droppedComponents: string[]; rootIds: string[] };

/** A small section in the shape validateCompositionWS returns. */
function section(prefix: string, title: string, body: string, headingTag = "h2"): Composition {
  return {
    instances: [
      { type: "instance", id: `${prefix}_box`, component: "Box", label: `${title} section`, children: [{ type: "id", value: `${prefix}_h` }, { type: "id", value: `${prefix}_p` }] },
      { type: "instance", id: `${prefix}_h`, component: "Heading", label: `${title} title`, children: [{ type: "text", value: title }] },
      { type: "instance", id: `${prefix}_p`, component: "Paragraph", label: `${title} text`, children: [{ type: "text", value: body }] },
    ],
    props: [{ id: `${prefix}_tag`, instanceId: `${prefix}_h`, name: "tag", type: "string", value: headingTag }],
    styleSources: [{ id: `${prefix}_src`, type: "local" }],
    styleSourceSelections: [{ instanceId: `${prefix}_box`, values: [`${prefix}_src`] }],
    styles: [
      { styleSourceId: `${prefix}_src`, breakpointId: "base", property: "padding", value: { type: "keyword", value: "64px 24px" } },
      { styleSourceId: `${prefix}_src`, breakpointId: "base", property: "backgroundColor", value: { type: "keyword", value: "#fef3c7" } },
    ],
    usedComponents: ["Box", "Heading", "Paragraph"],
    droppedComponents: [],
    rootIds: [`${prefix}_box`],
  };
}

async function open(page: Page, size = { width: 1440, height: 900 }) {
  await page.setViewportSize(size);
  await page.addInitScript(() => { localStorage.setItem("nova_locale", "en"); localStorage.removeItem("nova-sidebar-tab"); });
  await page.route("**/api/ai/providers*", (route) => route.fulfill({ contentType: "application/json", body: JSON.stringify({ chain: ["groq"], providers: [{ id: "groq", keyConfigured: true }] }) }));
  await page.goto("/builder/demo");
  const canvas = page.frameLocator('iframe[src*="/canvas"]');
  await expect(canvas.getByText(HEADING).first()).toBeVisible({ timeout: 60_000 });
  await page.locator('button[aria-label="AI"][aria-pressed]').click();
  await expect(page.getByTestId("ai-panel")).toBeVisible();
  return canvas;
}

/** Answers every chat request with the same reply. */
async function answer(page: Page, ops: Op[], reply = "Done.") {
  await page.route("**/api/ai/chat", (route: Route) => route.fulfill({ contentType: "application/json", body: JSON.stringify({ reply, ops, provider: "groq", ms: 5000 }) }));
}

async function ask(page: Page, text: string) {
  await page.getByTestId("ai-input").fill(text);
  await page.getByTestId("ai-send").click();
  await expect(page.locator('[data-testid="ai-proposal"][data-status="pending"]').last()).toBeVisible({ timeout: 15_000 });
}

const apply = (page: Page) => page.locator('[data-testid="ai-proposal"][data-status="pending"]').last().getByTestId("ai-apply").click();

test("edit text and style of a section in one proposal: Apply, then Ctrl+Z", async ({ page }) => {
  const canvas = await open(page);
  await answer(page, [
    { op: "setText", id: HEADING_ID, text: "Your website in minutes." },
    { op: "setText", id: "inst_sub001", text: "Say what you need; Nova builds it." },
    { op: "setStyle", id: HERO_ID, styles: { backgroundColor: "#fff7ed" } },
    { op: "setStyle", id: HEADING_ID, styles: { color: "#9a3412", fontWeight: "800" } },
  ], "Shortened the hero and made it warmer.");
  await canvas.getByText(HEADING).first().click();
  await page.screenshot({ path: `${SHOTS}/1-before.png` });
  await ask(page, "Shorten this and use warmer colours");
  const card = page.getByTestId("ai-proposal");
  await expect(card).toContainText("Rewrite 2 texts");
  await expect(card).toContainText("Restyle 2 elements: background colour, text colour, font weight");
  await page.screenshot({ path: `${SHOTS}/2-proposal.png` });
  await apply(page);
  await expect(canvas.getByText("Your website in minutes.").first()).toBeVisible({ timeout: 15_000 });
  const color = await canvas.getByText("Your website in minutes.").first().evaluate((el) => getComputedStyle(el).color);
  expect(color).toBe("rgb(154, 52, 18)");
  await page.screenshot({ path: `${SHOTS}/3-applied.png` });
  await page.keyboard.press("Control+z");
  await expect(canvas.getByText(HEADING).first()).toBeVisible({ timeout: 15_000 });
  const back = await canvas.getByText(HEADING).first().evaluate((el) => getComputedStyle(el).color);
  expect(back).not.toBe("rgb(154, 52, 18)");
  // the card notices the undo, and the redo
  await expect(page.getByTestId("ai-proposal")).toContainText("Undone. Press Ctrl+Shift+Z to redo.");
  await page.screenshot({ path: `${SHOTS}/4-undone.png` });
  await page.keyboard.press("Control+Shift+z");
  await expect(canvas.getByText("Your website in minutes.").first()).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId("ai-proposal")).toContainText("Applied. Press Ctrl+Z to undo.");
});

test("remove a section: gone from the canvas, back with Ctrl+Z", async ({ page }) => {
  const canvas = await open(page);
  await answer(page, [{ op: "remove", id: FEATURES_ID }], "Removed the features section.");
  await expect(canvas.getByText("Instant generation").first()).toBeVisible({ timeout: 15_000 });
  await ask(page, "Remove the features section");
  await expect(page.getByTestId("ai-proposal")).toContainText("Remove “Features”");
  await apply(page);
  await expect(canvas.getByText("Instant generation")).toHaveCount(0, { timeout: 15_000 });
  await canvas.locator("body").evaluate(() => window.scrollTo(0, document.body.scrollHeight)); // where the section used to be
  await page.screenshot({ path: `${SHOTS}/5-section-removed.png` });
  await page.keyboard.press("Control+z");
  await expect(canvas.getByText("Instant generation").first()).toBeVisible({ timeout: 15_000 });
});

test("replace a section in place, then insert a new one: one h1 stays", async ({ page }) => {
  const canvas = await open(page);
  await answer(page, [{ op: "replaceSection", id: FEATURES_ID, brief: "Two big stats", composition: section("rep", "Two numbers that matter", "10,000 sites built.", "h1") }], "Redid the features section.");
  await ask(page, "Redo the features section as big numbers");
  await expect(page.getByTestId("ai-proposal")).toContainText("Redo “Features” as: Two big stats");
  await apply(page);
  await expect(canvas.getByText("Two numbers that matter").first()).toBeVisible({ timeout: 15_000 });
  await expect(canvas.getByText("Instant generation")).toHaveCount(0);
  await canvas.getByText("Two numbers that matter").first().scrollIntoViewIfNeeded();
  await page.screenshot({ path: `${SHOTS}/6-section-replaced.png` });

  await page.unroute("**/api/ai/chat");
  await answer(page, [{ op: "insertSection", after: HERO_ID, brief: "Simple pricing", composition: section("ins", "Simple pricing", "Free and Pro.", "h1") }], "Added a pricing section.");
  await ask(page, "Add a pricing section after the hero");
  await expect(page.locator('[data-testid="ai-proposal"][data-status="pending"]').last()).toContainText("Add a section: Simple pricing");
  await expect(page.locator('[data-testid="ai-proposal"][data-status="pending"]').last().locator("li")).toHaveAttribute("title", "Simple pricing"); // the full brief on hover
  await apply(page);
  await expect(canvas.getByText("Simple pricing").first()).toBeVisible({ timeout: 15_000 });
  // it sits between the hero and the replaced section, and the page still has one h1
  const order = await canvas.locator("body").evaluate((body) => {
    const texts = ["Build any website with AI.", "Simple pricing", "Two numbers that matter"];
    return texts.map((t) => { const el = [...body.querySelectorAll("h1,h2")].find((e) => e.textContent?.includes(t)); return el ? el.getBoundingClientRect().top + window.scrollY : -1; });
  });
  expect(order.every((y) => y >= 0)).toBe(true);
  expect(order[0]).toBeLessThan(order[1]!);
  expect(order[1]).toBeLessThan(order[2]!);
  expect(await canvas.locator("h1").count()).toBe(1);
  await canvas.getByText("Simple pricing").first().scrollIntoViewIfNeeded();
  await page.screenshot({ path: `${SHOTS}/7-section-inserted.png` });
});

test("hovering a proposal line outlines its elements on the canvas", async ({ page }) => {
  const canvas = await open(page);
  await answer(page, [{ op: "setText", id: HEADING_ID, text: "Hello" }, { op: "setStyle", id: FEATURES_ID, styles: { backgroundColor: "#eef" } }]);
  await canvas.getByText(HEADING).first().click();
  await ask(page, "Change things");
  await page.getByTestId("ai-proposal").locator("li").nth(1).hover();
  await expect(canvas.locator("[data-ws-hovered]")).toHaveCount(1);
  await expect(canvas.locator("[data-ws-hovered]")).toContainText("Instant generation");
  await page.screenshot({ path: `${SHOTS}/8-hover-outline.png` });
  await page.getByTestId("ai-proposal").getByRole("button", { name: "Discard" }).hover();
  await expect(canvas.locator("[data-ws-hovered]")).toHaveCount(0);
});

test("a proposal that no longer fits the page says so instead of failing silently", async ({ page }) => {
  const canvas = await open(page);
  await answer(page, [{ op: "setText", id: HEADING_ID, text: "Never applied" }]);
  await canvas.getByText(HEADING).first().click();
  await ask(page, "Rewrite this");
  // the element disappears before Apply
  await page.keyboard.press("Delete");
  await expect(canvas.getByText(HEADING)).toHaveCount(0, { timeout: 15_000 });
  await apply(page);
  await expect(page.getByTestId("ai-proposal")).toContainText("Nothing could be applied");
});

test("the panel has no serious or critical accessibility violations (conversation, proposal, error)", async ({ page }) => {
  await open(page);
  await answer(page, [{ op: "setText", id: HEADING_ID, text: "Hello" }]);
  await ask(page, "Rewrite the heading");
  const scan = async (label: string) => {
    const results = await new AxeBuilder({ page }).include('[data-testid="ai-panel"]').withTags(["wcag2a", "wcag2aa"]).analyze();
    const blocking = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    expect(blocking.map((v) => `${label}: ${v.id} ${v.nodes.map((n) => n.target.join(" ")).join(" | ")}`)).toEqual([]);
  };
  await scan("proposal");
  await page.getByTestId("ai-history").click();
  await scan("history menu");
  await page.keyboard.press("Escape");
  await page.unroute("**/api/ai/chat");
  await page.route("**/api/ai/chat", (route) => route.fulfill({ status: 502, contentType: "application/json", body: JSON.stringify({ code: "busy" }) }));
  await page.getByTestId("ai-input").fill("again");
  await page.getByTestId("ai-send").click();
  await expect(page.getByTestId("ai-msg-error")).toBeVisible();
  await scan("error");
});

test("keyboard: Tab reaches the input, Send and the proposal buttons; Shift+Enter adds a line", async ({ page }) => {
  await open(page);
  await answer(page, [{ op: "setText", id: HEADING_ID, text: "Hello" }]);
  const input = page.getByTestId("ai-input");
  await input.click();
  await input.type("line one");
  await page.keyboard.press("Shift+Enter");
  await input.type("line two");
  await expect(input).toHaveValue("line one\nline two");
  await page.keyboard.press("Enter");
  await expect(page.locator('[data-testid="ai-proposal"][data-status="pending"]')).toBeVisible({ timeout: 15_000 });
  await page.getByTestId("ai-apply").focus();
  await expect(page.getByTestId("ai-apply")).toBeFocused();
  const outline = await page.getByTestId("ai-apply").evaluate((el) => getComputedStyle(el).outlineStyle);
  expect(outline).not.toBe("none");
});

test("narrow builder (1024px): the tab keeps its composer and Send in view, no horizontal scroll", async ({ page }) => {
  const canvas = await open(page, { width: 1024, height: 720 });
  await answer(page, [{ op: "setText", id: HEADING_ID, text: "Hello" }]);
  await canvas.getByText(HEADING).first().click();
  await ask(page, "Rewrite this heading");
  const send = page.getByTestId("ai-send");
  await expect(send).toBeInViewport();
  await expect(page.getByTestId("ai-input")).toBeInViewport();
  await expect(page.getByTestId("ai-apply")).toBeInViewport();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
  await page.screenshot({ path: `${SHOTS}/9-width-1024.png` });
});

test("Vietnamese: the whole conversation reads in Vietnamese", async ({ page }) => {
  await page.addInitScript(() => { localStorage.setItem("nova_locale", "vi"); localStorage.removeItem("nova-sidebar-tab"); });
  await page.route("**/api/ai/providers*", (route) => route.fulfill({ contentType: "application/json", body: JSON.stringify({ chain: ["groq"], providers: [{ id: "groq", keyConfigured: true }] }) }));
  await page.goto("/builder/demo");
  const canvas = page.frameLocator('iframe[src*="/canvas"]');
  await expect(canvas.getByText(HEADING).first()).toBeVisible({ timeout: 60_000 });
  await page.locator('button[aria-label="AI"][aria-pressed]').click();
  await answer(page, [{ op: "setText", id: HEADING_ID, text: "Website của bạn trong vài phút." }, { op: "setStyle", id: HEADING_ID, styles: { fontSize: "56px", fontWeight: "800" } }], "Đã rút gọn tiêu đề và làm nó đậm hơn.");
  await canvas.getByText(HEADING).first().click();
  await page.getByTestId("ai-input").fill("Rút gọn tiêu đề và làm nó đậm hơn");
  await page.getByTestId("ai-send").click();
  const card = page.locator('[data-testid="ai-proposal"][data-status="pending"]');
  await expect(card).toBeVisible({ timeout: 15_000 });
  await expect(card).toContainText("Thay đổi được đề xuất");
  await expect(card).toContainText("Viết lại nội dung của");
  await expect(card).toContainText("cỡ chữ, độ đậm chữ");
  await page.screenshot({ path: `${SHOTS}/10-vietnamese.png` });
  await card.getByTestId("ai-apply").click();
  await expect(canvas.getByText("Website của bạn trong vài phút.").first()).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId("ai-proposal")).toContainText("Đã áp dụng. Nhấn Ctrl+Z để hoàn tác.");
});
