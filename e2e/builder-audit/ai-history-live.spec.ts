// Task 040 — the AI tab's history lives in the database, and an applied answer can be restored.
// Production, throwaway account, seeded landing page. The chat endpoint is answered by the test
// (no provider quota); everything else is real: /api/ai/conversations, the snapshots, the reload.
//   pwsh scripts/audit-run.ps1 e2e/builder-audit/ai-history-live.spec.ts
import { test, expect, type Page, type Route } from "@playwright/test";
import { deleteFreshAccount, openBuilder, type FreshAccount } from "../helpers/fresh-account";
import { openAuditBuilder, shot } from "./audit";

let acc: FreshAccount | undefined;
test.afterAll(async () => deleteFreshAccount(acc));
test.use({ actionTimeout: 30_000 });

type ChatBody = { context: { targetId?: string; nodes: { id: string; text?: string }[] } };
const NEW_TEXT = "A calmer, shorter headline";

async function answerChat(page: Page) {
  await page.route("**/api/ai/chat", async (route: Route) => {
    const body = route.request().postDataJSON() as ChatBody;
    const target = body.context.nodes.find((n) => n.id === body.context.targetId && n.text !== undefined) ?? body.context.nodes.find((n) => n.text);
    await route.fulfill({ contentType: "application/json", body: JSON.stringify({ reply: "Made the heading calmer.", ops: [{ op: "setText", id: target!.id, text: NEW_TEXT }], provider: "groq", ms: 3100 }) });
  });
}

const openTab = async (page: Page) => {
  const tab = page.locator('button[aria-label="AI"][aria-pressed]');
  if ((await tab.getAttribute("aria-pressed")) !== "true") await tab.click();
  await expect(page.getByTestId("ai-panel")).toBeVisible();
};

test("history is read from the database on a second browser, and Restore puts the page back", async ({ page, browser }) => {
  test.setTimeout(300_000);
  const b = await openAuditBuilder(page, "aihist");
  acc = b.acc;
  const h1 = b.canvas.locator("h1").first();
  const original = (await h1.innerText()).trim();
  await answerChat(page);
  await openTab(page);

  await test.step("ask, Apply: the heading changes", async () => {
    await h1.click();
    await page.getByTestId("ai-input").fill("Make this heading calmer");
    await page.getByTestId("ai-send").click();
    const pending = page.locator('[data-testid="ai-proposal"][data-status="pending"]').last();
    await expect(pending).toBeVisible({ timeout: 30_000 });
    await pending.getByTestId("ai-apply").click();
    await expect(h1).toHaveText(NEW_TEXT, { timeout: 20_000 });
    await expect(page.getByTestId("ai-restore")).toBeVisible({ timeout: 20_000 });
    await shot(page, "aihist01-applied-with-restore");
  });

  await test.step("the database holds the chat, with a restore point on the applied answer", async () => {
    await expect.poll(async () => {
      const res = await page.request.get(`/api/ai/conversations?projectId=${b.id}`);
      const json = (await res.json()) as { conversations?: { messages: { role: string; status?: string; snapshotId?: string }[] }[] };
      const msgs = json.conversations?.[0]?.messages ?? [];
      return msgs.length === 2 && msgs[1]?.status === "applied" && Boolean(msgs[1]?.snapshotId);
    }, { timeout: 20_000, message: "chat saved with status applied and a snapshot id" }).toBe(true);
  });

  await test.step("a second browser (same account, empty local storage) shows the history", async () => {
    const other = await browser.newContext({ storageState: await page.context().storageState(), viewport: { width: 1440, height: 900 } });
    const p2 = await other.newPage();
    await openBuilder(p2, b.id);
    await openTab(p2);
    await expect(p2.getByTestId("ai-msg-user")).toHaveCount(1, { timeout: 20_000 });
    await expect(p2.locator('[data-testid="ai-proposal"][data-status="applied"]')).toHaveCount(1);
    await expect(p2.getByTestId("ai-restore")).toBeVisible();
    await shot(p2, "aihist02-second-browser");
    await other.close();
  });

  await test.step("Restore asks first, then the page is back as before and the card stays", async () => {
    page.once("dialog", (d) => d.accept());
    await page.getByTestId("ai-restore").click();
    await page.waitForLoadState("load");
    const canvas = page.frameLocator('iframe[title="Canvas"]');
    await expect(canvas.locator("h1").first()).toHaveText(original, { timeout: 60_000 });
    await openTab(page);
    await expect(page.locator('[data-testid="ai-proposal"][data-status="applied"]')).toHaveCount(1);
    await shot(page, "aihist03-restored");
  });

  await test.step("deleting the chat removes it for the other browser too", async () => {
    const before = (await (await page.request.get(`/api/ai/conversations?projectId=${b.id}`)).json()) as { conversations: { id: string }[] };
    expect(before.conversations).toHaveLength(1);
    const res = await page.request.delete(`/api/ai/conversations/${before.conversations[0]!.id}`);
    expect(res.ok()).toBeTruthy();
    const after = (await (await page.request.get(`/api/ai/conversations?projectId=${b.id}`)).json()) as { conversations: unknown[] };
    expect(after.conversations).toHaveLength(0);
  });
});
