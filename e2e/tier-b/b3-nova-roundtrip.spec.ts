// B3 — Export project (.nova) from one project, import it into another (saved automatically): the page is reproduced.
//   BASE_URL=... npx playwright test -c playwright.cloud.config.ts e2e/tier-b/b3-nova-roundtrip.spec.ts
import { test, expect, type Page } from "@playwright/test";
import { mkdirSync, readFileSync } from "node:fs";
import { freshAccount, seedProject, openBuilder, deleteFreshAccount, type FreshAccount } from "../helpers/fresh-account";

const OUT = "qa-screenshots/tier-b";
mkdirSync(OUT, { recursive: true });
let acc: FreshAccount | undefined;
test.afterAll(async () => deleteFreshAccount(acc));

// A one-heading page — the import target, so a successful import visibly replaces it.
const BLANK = {
  pages: { homePageId: "page_b", rootFolderId: "fold_b", pages: [["page_b", { id: "page_b", name: "Home", path: "/", title: "Home", rootInstanceId: "inst_root" }]], folders: [["fold_b", { id: "fold_b", name: "Root", slug: "", children: ["page_b"] }]] },
  assets: [], dataSources: [], resources: [], props: [], styleSourceSelections: [], styleSources: [], styles: [],
  breakpoints: [["bp_base", { id: "bp_base", label: "Base" }]],
  instances: [
    ["inst_root", { id: "inst_root", type: "instance", component: "Body", label: "Page Root", children: [{ type: "id", value: "inst_h1" }] }],
    ["inst_h1", { id: "inst_h1", type: "instance", component: "Heading", children: [{ type: "text", value: "Blank target" }] }],
  ],
};

type Project = { data: { instances: [string, unknown][] } };
const getProject = async (page: Page, id: string) => (await (await page.request.get(`/api/projects/${id}`)).json()) as Project;
const exportMenu = (page: Page, item: RegExp) =>
  page.getByRole("button", { name: /^export/i }).click().then(() => page.getByRole("menuitem", { name: item }).click());

test("B3 .nova export → import round trip", async ({ page }) => {
  acc = await freshAccount(page, "b3");
  const srcId = await seedProject(page, "Roundtrip Source");
  const dstId = await seedProject(page, "Roundtrip Target", BLANK);
  const canvas = page.frameLocator('iframe[title="Canvas"]');

  // Export from the source project
  await openBuilder(page, srcId);
  const h1 = (await canvas.locator("h1").first().innerText()).trim();
  const sections = await canvas.locator("section, header, footer").count();
  const download = page.waitForEvent("download");
  await exportMenu(page, /export project/i);
  const file = await (await download).path();
  const nova = JSON.parse(readFileSync(file!, "utf8"));
  expect(nova.type).toBe("nova-template");
  expect((await download).suggestedFilename()).toBe("roundtrip-source.nova");
  await page.screenshot({ path: `${OUT}/b3-01-source-exported.png` });

  // Import into the blank target
  await openBuilder(page, dstId);
  await expect(canvas.locator("h1").first()).toHaveText("Blank target");
  await page.screenshot({ path: `${OUT}/b3-02-target-before.png` });
  const chooser = page.waitForEvent("filechooser");
  await exportMenu(page, /import project/i);
  await (await chooser).setFiles(file!);
  await expect(canvas.locator("h1").first()).toHaveText(h1, { timeout: 60_000 });
  await expect(canvas.locator("section, header, footer")).toHaveCount(sections);
  await page.screenshot({ path: `${OUT}/b3-03-imported.png` });

  // Import saves itself (25.11.0): the Save button reads "Saved", no dialog needed.
  await expect(page.getByRole("button", { name: /^saved$/i })).toBeVisible({ timeout: 30_000 });
  await page.screenshot({ path: `${OUT}/b3-05-after-import-saved.png` });
  const src = await getProject(page, srcId);
  const dst = await getProject(page, dstId);
  expect(dst.data.instances.length, "target now holds the source's instances").toBe(src.data.instances.length);

  await openBuilder(page, dstId);
  await expect(canvas.locator("h1").first()).toHaveText(h1);
  await page.screenshot({ path: `${OUT}/b3-06-target-reopened.png` });
});
