// Prints which AI providers / models the deployed Worker can use, then one real compose call.
//   pwsh scripts/audit-run.ps1 e2e/builder-audit/ai-provider-probe.spec.ts   (PROBE_COMPOSE=0 skips the AI call)
import { test } from "@playwright/test";
import { freshAccount, seedProject, deleteFreshAccount, type FreshAccount } from "../helpers/fresh-account";
let acc: FreshAccount | undefined;
test.afterAll(async () => deleteFreshAccount(acc));
test("ai probe", async ({ page }) => {
  test.setTimeout(300_000);
  acc = await freshAccount(page, "aiprobe");
  console.log("providers", JSON.stringify(await (await page.request.get("/api/ai/providers")).json(), null, 1));
  if (process.env.PROBE_COMPOSE === "0") return;
  const id = await seedProject(page, "AI probe");
  const t0 = Date.now();
  const r = await page.request.post("/api/ai", { data: { userMessage: "A one-page site for a small bakery in Hanoi", projectId: id }, timeout: 240_000 });
  console.log("status", r.status(), "ms", Date.now() - t0, (await r.text()).slice(0, 600));
});
