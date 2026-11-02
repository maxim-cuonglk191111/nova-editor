import { test, expect, type Page, type Route } from "@playwright/test";

// Task 037 / task 009 item 6 — the AI tab in the left sidebar. The AI endpoints are answered by
// the test, so no provider quota is spent and the answers are deterministic; what is checked is
// the conversation, the context chips, the proposal card (Apply / Discard / undo), Stop, Retry,
// the model picker and that a reload keeps the thread. Runs against the public /builder/demo.
// The server-side rules are covered by unit tests (packages/ai validateOps / editAgent and
// src/lib/__tests__/ai-chat-*.test.ts).

const HEADING = "Build any website with AI.";

type ChatBody = { message: string; provider: string; context: { scope: string; targetId?: string; nodes: { id: string; text?: string }[] } };

async function signedIn(page: Page) {
  await page.route("**/api/auth/session", (route) =>
    route.fulfill({ contentType: "application/json", body: JSON.stringify({ user: { name: "Quan Tran", email: "quan@example.dev" }, expires: new Date(Date.now() + 3_600_000).toISOString() }) })
  );
}

async function providers(page: Page) {
  await page.route("**/api/ai/providers*", (route) =>
    route.fulfill({ contentType: "application/json", body: JSON.stringify({ chain: ["groq"], providers: [{ id: "groq", keyConfigured: true }, { id: "mistral", keyConfigured: true }, { id: "google", keyConfigured: false }, { id: "openrouter", keyConfigured: false }, { id: "openai", keyConfigured: false }, { id: "anthropic", keyConfigured: false }] }) })
  );
}

/** Answers /api/ai/chat with one setText on whatever the request is about. */
async function answerChat(page: Page, text = "Hello from AI", extra: Partial<{ delay: number; status: number; body: object }> = {}) {
  const seen: ChatBody[] = [];
  await page.route("**/api/ai/chat", async (route: Route) => {
    const body = route.request().postDataJSON() as ChatBody;
    seen.push(body);
    if (extra.delay) await new Promise((r) => setTimeout(r, extra.delay));
    if (extra.status) return route.fulfill({ status: extra.status, contentType: "application/json", body: JSON.stringify(extra.body ?? {}) });
    const target = body.context.nodes.find((n) => n.id === body.context.targetId && n.text !== undefined) ?? body.context.nodes.find((n) => n.text);
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ reply: "Shortened the heading.", ops: [{ op: "setText", id: target!.id, text }], provider: "groq", ms: 4200 }),
    });
  });
  return seen;
}

async function open(page: Page) {
  await page.addInitScript(() => { localStorage.setItem("nova_locale", "en"); localStorage.removeItem("nova-sidebar-tab"); });
  await providers(page);
  await page.goto("/builder/demo");
  const canvas = page.frameLocator('iframe[src*="/canvas"]');
  await expect(canvas.getByText(HEADING).first()).toBeVisible({ timeout: 60_000 });
  return canvas;
}

const railButton = (page: Page) => page.locator('button[aria-label="AI"][aria-pressed]');
const panel = (page: Page) => page.getByTestId("ai-panel");

async function openTab(page: Page) {
  await railButton(page).click();
  await expect(panel(page)).toBeVisible();
}

test("the AI tab opens from the rail; the empty state offers starter prompts for the page", async ({ page }) => {
  await open(page);
  await openTab(page);
  await expect(page.getByTestId("ai-chip-main")).toContainText("Page:");
  await expect(page.getByTestId("ai-starters").getByRole("listitem")).toHaveCount(4);
  await expect(page.getByTestId("ai-starters")).toContainText("Translate the page to Vietnamese");
  // a starter fills the input, it does not send
  await page.getByTestId("ai-starters").getByRole("listitem").first().click();
  await expect(page.getByTestId("ai-input")).not.toHaveValue("");
  await expect(page.getByTestId("ai-msg-user")).toHaveCount(0);
  await expect(page.getByTestId("ai-send")).toBeEnabled();
});

test("the top-bar AI button opens the tab (signed in) and closing it collapses the tab", async ({ page }) => {
  await signedIn(page);
  await open(page);
  await page.getByRole("button", { name: /Generate/ }).click();
  await expect(panel(page)).toBeVisible();
  await page.getByRole("button", { name: /Generate/ }).click();
  await expect(panel(page)).toHaveCount(0);
});

test("select a heading: chips name the element and its section; Apply changes the page and Ctrl+Z undoes it", async ({ page }) => {
  const canvas = await open(page);
  const seen = await answerChat(page);
  await canvas.getByText(HEADING).first().click();
  await openTab(page);

  const chip = page.getByTestId("ai-chip-main");
  await expect(chip).toContainText("Element:");
  await expect(page.getByTestId("ai-starters")).toContainText("Rewrite this text");

  await page.getByTestId("ai-input").fill("Make this heading shorter");
  await page.keyboard.press("Enter");

  const card = page.getByTestId("ai-proposal");
  await expect(card).toBeVisible({ timeout: 15_000 });
  await expect(card).toContainText("Rewrite the text of");
  await expect(page.getByTestId("ai-msg-assistant")).toContainText("Nova AI");
  await expect(page.getByTestId("ai-msg-assistant")).toContainText("Groq · 4 s");
  expect(seen).toHaveLength(1);
  expect(seen[0]!.context.scope).toBe("element");
  expect(seen[0]!.provider).toBe("auto");
  // nothing changed yet
  await expect(canvas.getByText(HEADING).first()).toBeVisible();

  await page.getByTestId("ai-apply").click();
  await expect(card).toContainText("Applied. Press Ctrl+Z to undo.");
  await expect(canvas.getByText("Hello from AI").first()).toBeVisible({ timeout: 15_000 });
  await expect(canvas.getByText(HEADING)).toHaveCount(0);

  await page.keyboard.press("Control+z");
  await expect(canvas.getByText(HEADING).first()).toBeVisible({ timeout: 15_000 });
  await expect(canvas.getByText("Hello from AI")).toHaveCount(0);
});

test("Discard changes nothing", async ({ page }) => {
  const canvas = await open(page);
  await answerChat(page);
  await canvas.getByText(HEADING).first().click();
  await openTab(page);
  await page.getByTestId("ai-input").fill("Make this heading shorter");
  await page.getByTestId("ai-send").click();
  const card = page.getByTestId("ai-proposal");
  await expect(card).toBeVisible({ timeout: 15_000 });
  await card.getByRole("button", { name: "Discard" }).click();
  await expect(card).toContainText("Discarded. Nothing changed.");
  await expect(canvas.getByText(HEADING).first()).toBeVisible();
});

test("removing the element chip widens the request to the section, then the page", async ({ page }) => {
  const canvas = await open(page);
  const seen = await answerChat(page);
  await canvas.getByText(HEADING).first().click();
  await openTab(page);
  await page.getByTestId("ai-chip-main").getByRole("button").click();
  await expect(page.getByTestId("ai-chip-main")).toContainText("Section:");
  await page.getByTestId("ai-chip-main").getByRole("button").click();
  await expect(page.getByTestId("ai-chip-main")).toContainText("Page:");
  await page.getByTestId("ai-input").fill("Add a pricing section");
  await page.getByTestId("ai-send").click();
  await expect(page.getByTestId("ai-proposal")).toBeVisible({ timeout: 15_000 });
  expect(seen[0]!.context.scope).toBe("page");
});

test("a busy provider shows a readable message and Retry sends the same request again", async ({ page }) => {
  const canvas = await open(page);
  let calls = 0;
  await page.route("**/api/ai/chat", async (route) => {
    calls++;
    const body = route.request().postDataJSON() as ChatBody;
    if (calls === 1) return route.fulfill({ status: 502, contentType: "application/json", body: JSON.stringify({ error: "x", code: "busy" }) });
    const target = body.context.nodes.find((n) => n.text)!;
    return route.fulfill({ contentType: "application/json", body: JSON.stringify({ reply: "Done.", ops: [{ op: "setText", id: target.id, text: "Second try" }], provider: "mistral", ms: 2000 }) });
  });
  await canvas.getByText(HEADING).first().click();
  await openTab(page);
  await page.getByTestId("ai-input").fill("Make this heading shorter");
  await page.getByTestId("ai-send").click();
  const err = page.getByTestId("ai-msg-error");
  await expect(err).toContainText("AI is busy");
  await err.getByRole("button", { name: "Retry" }).click();
  await expect(page.getByTestId("ai-proposal")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId("ai-msg-error")).toHaveCount(0);
  await expect(page.getByTestId("ai-msg-user")).toHaveCount(1);
  expect(calls).toBe(2);
});

test("a signed-out visitor is told to create an account", async ({ page }) => {
  const canvas = await open(page);
  await answerChat(page, "x", { status: 401, body: { error: "Unauthorized" } });
  await canvas.getByText(HEADING).first().click();
  await openTab(page);
  await page.getByTestId("ai-input").fill("Make this heading shorter");
  await page.getByTestId("ai-send").click();
  const err = page.getByTestId("ai-msg-error");
  await expect(err).toContainText(/account/i);
  await expect(err.getByRole("link", { name: /sign up/i })).toHaveAttribute("href", /signup/);
  await expect(err.getByRole("button", { name: "Retry" })).toHaveCount(0);
});

test("Stop ends a running request without a proposal", async ({ page }) => {
  const canvas = await open(page);
  await answerChat(page, "late", { delay: 6000 });
  await canvas.getByText(HEADING).first().click();
  await openTab(page);
  await page.getByTestId("ai-input").fill("Make this heading shorter");
  await page.getByTestId("ai-send").click();
  await expect(page.getByTestId("ai-progress")).toBeVisible();
  await page.getByTestId("ai-stop").click();
  await expect(page.getByTestId("ai-progress")).toHaveCount(0);
  await expect(page.getByTestId("ai-msg-assistant")).toContainText("Stopped.");
  await expect(page.getByTestId("ai-proposal")).toHaveCount(0);
  await expect(page.getByTestId("ai-send")).toBeVisible();
});

test("the model picker lists the providers with a key, greys out the others, and the choice is sent", async ({ page }) => {
  const canvas = await open(page);
  const seen = await answerChat(page);
  await canvas.getByText(HEADING).first().click();
  await openTab(page);
  const picker = page.getByLabel("Model");
  await expect(picker.locator("option")).toHaveCount(7);
  await expect(picker.locator("option[value=groq]")).not.toHaveAttribute("disabled", /.*/);
  await expect(picker.locator("option[value=google]")).toHaveAttribute("disabled", /.*/);
  await expect(picker.locator("option[value=google]")).toContainText("No key on this server");
  await picker.selectOption("mistral");
  await page.getByTestId("ai-input").fill("Make this heading shorter");
  await page.getByTestId("ai-send").click();
  await expect(page.getByTestId("ai-proposal")).toBeVisible({ timeout: 15_000 });
  expect(seen[0]!.provider).toBe("mistral");
});

test("a reload keeps the thread and a pending proposal, and the history menu reopens it", async ({ page }) => {
  const canvas = await open(page);
  await answerChat(page);
  await canvas.getByText(HEADING).first().click();
  await openTab(page);
  await page.getByTestId("ai-input").fill("Make this heading shorter");
  await page.getByTestId("ai-send").click();
  await expect(page.getByTestId("ai-proposal")).toBeVisible({ timeout: 15_000 });
  await page.getByTestId("ai-input").fill("an unsent draft");

  await page.reload();
  await expect(canvas.getByText(HEADING).first()).toBeVisible({ timeout: 60_000 });
  await openTab(page);
  await expect(page.getByTestId("ai-msg-user")).toContainText("Make this heading shorter");
  await expect(page.getByTestId("ai-proposal")).toHaveAttribute("data-status", "pending");
  await expect(page.getByTestId("ai-apply")).toBeVisible();
  await expect(page.getByTestId("ai-input")).toHaveValue("an unsent draft");

  // history: start a new chat, then reopen the first one
  await page.getByTestId("ai-new-chat").click();
  await expect(page.getByTestId("ai-msg-user")).toHaveCount(0);
  await page.getByTestId("ai-history").click();
  await page.getByTestId("ai-history-list").locator("li").filter({ hasText: "Make this heading shorter" }).getByRole("button").first().click();
  await expect(page.getByTestId("ai-msg-user")).toContainText("Make this heading shorter");
});

test("start over asks first, then a new page is proposed and applied", async ({ page }) => {
  const canvas = await open(page);
  await page.route("**/api/ai", (route) => {
    if (route.request().method() !== "POST") return route.continue();
    return route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        provider: "groq",
        composition: {
          instances: [{ type: "instance", id: "fresh_1", component: "Heading", label: "Fresh heading", children: [{ type: "text", value: "A fresh start" }] }],
          props: [{ id: "fresh_p", instanceId: "fresh_1", name: "tag", type: "string", value: "h1" }],
          styleSources: [], styleSourceSelections: [], styles: [], usedComponents: ["Heading"], droppedComponents: [], rootIds: ["fresh_1"],
        },
      }),
    });
  });
  await openTab(page);
  await page.getByTestId("ai-start-over").click();
  await expect(page.getByRole("alertdialog")).toContainText("Replace this page");
  await page.getByRole("button", { name: "Yes, start over" }).click();
  await expect(page.getByTestId("ai-input")).toHaveAttribute("placeholder", /Describe the page/);
  await page.getByTestId("ai-input").fill("A portfolio for a photographer");
  await page.getByTestId("ai-send").click();
  const card = page.getByTestId("ai-proposal");
  await expect(card).toContainText("A new page", { timeout: 15_000 });
  await page.getByTestId("ai-apply").click();
  await expect(canvas.getByText("A fresh start").first()).toBeVisible({ timeout: 20_000 });
  await expect(card).toContainText("Applied");
});
