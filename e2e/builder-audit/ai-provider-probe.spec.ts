import { test } from "@playwright/test";
import { freshAccount, seedProject, deleteFreshAccount, type FreshAccount } from "../helpers/fresh-account";
let acc: FreshAccount | undefined;
test.afterAll(async () => deleteFreshAccount(acc));
test("ai probe", async ({ page }) => {
  test.setTimeout(300_000);
  acc = await freshAccount(page, "aiprobe");
  const id = await seedProject(page, "AI probe");
  const t0 = Date.now();
  const r = await page.request.post("/api/ai", { data: { userMessage: "A one-page site for a small bakery in Hanoi", projectId: id }, timeout: 240_000 });
  console.log("status", r.status(), "ms", Date.now() - t0, (await r.text()).slice(0, 600));
});
