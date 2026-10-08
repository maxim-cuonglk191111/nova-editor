// Task 007 — area 3: the right panel. Style tab (every group, states, breakpoints,
// units, clearing a value, undo), Props tab (Heading, Link, Image, Button, form
// fields) and Settings tab. Values are checked on the canvas, and for a subset in
// the saved project, the preview and the HTML export.
//   pwsh scripts/audit-run.ps1 e2e/builder-audit/right-panel.spec.ts
import { test, expect, type Locator } from "@playwright/test";
import { deleteFreshAccount, type FreshAccount } from "../helpers/fresh-account";
import { openAuditBuilder, shot, waitSaved, savedText } from "./audit";

let acc: FreshAccount | undefined;
test.afterAll(async () => deleteFreshAccount(acc));
test.use({ actionTimeout: 15_000 });

const ID = {
  hero: "inst_aRfkzbrw",
  sub: "inst_m0dSN7Qo",
  h1: "inst_Lch70UdC",
  menuLink: "inst_htdznrHT",
  heroImg: "inst_QueBP8RU",
  orderBtn: "inst_yVUdAU0N",
  grid: "inst_thv71dbP",
  card1: "inst_Km8Itgbk",
  nameInput: "inst_4zmK5K1c",
  submit: "inst_rH34nPTU",
  form: "inst_dAuaklVk",
};

// A failing step is recorded (soft) and the audit moves on to the next one.
const step = (name: string, fn: () => Promise<void>) =>
  test.step(name, fn).catch((e: Error) => { expect.soft(e.message.split("\n")[0], `step failed: ${name}`).toBe(""); });

const cs = (el: Locator, prop: string) =>
  el.evaluate((e, p) => (getComputedStyle(e) as unknown as Record<string, string>)[p], prop);

test("right panel", async ({ page, context }) => {
  const b = await openAuditBuilder(page, "right");
  acc = b.acc;
  const { canvas, id } = b;
  const el = (instId: string) => canvas.locator(`[data-ws-id="${instId}"]`).first();
  const dialogs: string[] = [];
  page.on("dialog", async (d) => { dialogs.push(d.message()); await d.dismiss(); });

  const tab = (name: RegExp) => page.locator('[role="tab"]').filter({ hasText: name }).first();
  const select = async (instId: string, pos?: { x: number; y: number }) => {
    const t = el(instId);
    await t.scrollIntoViewIfNeeded();
    await t.click(pos ? { position: pos } : undefined);
    await expect.soft(t).toHaveAttribute("data-ws-selected", "");
  };
  // Rows carry data-property since the friendly labels; the td text fallback matches the older build.
  const row = (prop: string) =>
    page.locator(`tr[data-property="${prop}"]`)
      .or(page.locator("tr").filter({ has: page.locator("td:first-child", { hasText: new RegExp(`^${prop}$`) }) }))
      .first();
  const setNumber = async (prop: string, v: string) => {
    const input = row(prop).locator('input[type="number"]');
    await input.fill(v);
    await input.press("Enter");
  };
  const setKeyword = async (prop: string, v: string) => {
    const input = row(prop).locator('input[type="text"]');
    await input.fill(v);
    await input.press("Enter");
  };
  const addProp = async (name: string, value: string) => {
    await page.locator('input[placeholder="property"]').fill(name);
    await page.locator('input[placeholder="value"]').fill(value);
    await page.locator('input[placeholder="value"]').press("Enter");
  };
  const openSection = async (name: string) => {
    const s = page.locator("details").filter({ has: page.locator("summary", { hasText: new RegExp(`^${name}`, "i") }) }).first();
    if ((await s.count()) && !(await s.evaluate((d) => (d as HTMLDetailsElement).open))) await s.locator("summary").click();
  };
  // Blur any input so keyboard shortcuts reach the builder, then undo.
  const undo = async () => {
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
    await page.keyboard.press("ControlOrMeta+z");
    await page.waitForTimeout(300);
  };
  const log = (k: string, v: unknown) => console.log(`[right-panel] ${k}: ${JSON.stringify(v)}`);

  const sub = el(ID.sub);
  const hero = el(ID.hero);

  await step("style tab overview", async () => {
    await select(ID.sub);
    await tab(/^style$/i).click();
    await expect.soft(page.getByText("Sub-heading text", { exact: true }).first()).toBeVisible();
    await shot(page, "r01-style-overview");
    await expect.soft(page.locator("text=/inst_/"), "no internal instance id in the panel header").toHaveCount(0);
    await expect.soft(page.getByText(/^Cascade:/), "no Cascade jargon without tokens").toHaveCount(0);
  });

  await step("layout: flex direction, gap, display", async () => {
    await select(ID.hero, { x: 8, y: 8 });
    await setKeyword("flexDirection", "row");
    await expect.soft.poll(() => cs(hero, "flexDirection")).toBe("row");
    await addProp("gap", "24px");
    await expect.soft.poll(() => cs(hero, "rowGap")).toBe("24px");
    await shot(page, "r02-layout-row-gap");
    await undo();
    await undo();
    await expect.soft.poll(() => cs(hero, "flexDirection"), "undo restores column").toBe("column");
    await setKeyword("display", "grid");
    await expect.soft.poll(() => cs(hero, "display")).toBe("grid");
    await undo();
    await expect.soft.poll(() => cs(hero, "display")).toBe("flex");
    await shot(page, "r03-layout-undone");
  });

  await step("size + units", async () => {
    await select(ID.sub);
    await setNumber("maxWidth", "500");
    await expect.soft.poll(() => cs(sub, "maxWidth")).toBe("500px");
    await row("maxWidth").locator("select").selectOption("%");
    await expect.soft.poll(() => cs(sub, "maxWidth"), "unit switched to %").toBe("500%");
    await row("maxWidth").locator("select").selectOption("px");
    await expect.soft.poll(() => cs(sub, "maxWidth")).toBe("500px");
    await shot(page, "r04-size-units");
  });

  await step("spacing", async () => {
    await setNumber("marginTop", "40");
    await expect.soft.poll(() => cs(sub, "marginTop")).toBe("40px");
    await addProp("paddingLeft", "16px");
    await expect.soft.poll(() => cs(sub, "paddingLeft")).toBe("16px");
  });

  await step("position", async () => {
    await addProp("position", "relative");
    await addProp("top", "10px");
    await expect.soft.poll(() => cs(sub, "position")).toBe("relative");
    await expect.soft.poll(() => cs(sub, "top")).toBe("10px");
    await shot(page, "r05-position");
  });

  await step("typography", async () => {
    await openSection("Typography");
    await setNumber("fontSize", "26");
    await expect.soft.poll(() => cs(sub, "fontSize")).toBe("26px");
    await addProp("fontWeight", "700");
    await expect.soft.poll(() => cs(sub, "fontWeight"), "font weight typed as 700").toBe("700");
    await addProp("textAlign", "left");
    await expect.soft.poll(() => cs(sub, "textAlign")).toBe("left");
    await addProp("Letter spacing", "2px");
    await expect.soft.poll(() => cs(sub, "letterSpacing"), "a property typed by its shown label").toBe("2px");
    await row("color").locator('input[type="color"]').fill("#b91c1c");
    await expect.soft.poll(() => cs(sub, "color")).toBe("rgb(185, 28, 28)");
    await shot(page, "r06-typography");
  });

  await step("background color + image", async () => {
    await select(ID.hero, { x: 8, y: 8 });
    await openSection("Background");
    await row("backgroundColor").locator('input[type="color"]').fill("#123456");
    await expect.soft.poll(() => cs(hero, "backgroundColor")).toBe("rgb(18, 52, 86)");
    await page.locator('button[title="Add gradient"]').click();
    await expect.soft.poll(() => cs(hero, "backgroundImage")).toContain("linear-gradient");
    await page.locator('button[title="Add gradient"]').scrollIntoViewIfNeeded();
    await shot(page, "r07-background-gradient");
    await page.locator('button[title="Remove gradient"]').first().click();
    await expect.soft.poll(() => cs(hero, "backgroundImage")).toBe("none");
    await addProp("backgroundImage", "url(https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400)");
    await expect.soft.poll(() => cs(hero, "backgroundImage")).toContain("url(");
    await shot(page, "r08-background-image");
    await undo();
    await expect.soft.poll(() => cs(hero, "backgroundImage")).toBe("none");
  });

  await step("border", async () => {
    await select(ID.sub);
    await addProp("border", "3px dashed #1d4ed8");
    await addProp("borderRadius", "12px");
    await expect.soft.poll(() => cs(sub, "borderTopStyle")).toBe("dashed");
    await expect.soft.poll(() => cs(sub, "borderTopLeftRadius")).toBe("12px");
    await openSection("Border");
    await shot(page, "r09-border");
  });

  await step("box + text shadow", async () => {
    await page.locator('button[title="Add Box Shadow"]').click();
    await expect.soft.poll(() => cs(sub, "boxShadow")).toBe("rgba(0, 0, 0, 0.25) 0px 4px 8px 0px");
    await page.locator('button[title="Add Text Shadow"]').click();
    await expect.soft.poll(() => cs(sub, "textShadow")).not.toBe("none");
    await page.locator('button[title="Add Text Shadow"]').scrollIntoViewIfNeeded();
    await shot(page, "r10-shadows");
  });

  await step("transform", async () => {
    await page.locator('button[title="Add Rotate"]').click();
    const z = page.locator('button[title="Remove Rotate"]').locator("xpath=../following-sibling::div[1]").locator("input").nth(2);
    await z.fill("5");
    await z.press("Enter");
    await expect.soft.poll(() => cs(sub, "transform"), "rotate 5deg applied").toMatch(/^matrix\(0\.99/);
    log("transform", await cs(sub, "transform"));
    await page.locator('button[title="Add Rotate"], button[title="Remove Rotate"]').first().scrollIntoViewIfNeeded();
    await shot(page, "r11-transform");
  });

  await step("transition", async () => {
    await page.locator('button[title="Add Transition"]').click();
    await expect.soft.poll(() => cs(sub, "transitionDuration")).toBe("0.3s");
    await page.locator('button[title="Add Transition"]').scrollIntoViewIfNeeded();
    await shot(page, "r12-transition");
  });

  await step("animation", async () => {
    await page.locator('button[title="Add Animation"]').click();
    await expect.soft.poll(() => cs(sub, "animationName")).toBe("fadeIn");
    const hasKeyframes = await sub.evaluate(() =>
      [...document.styleSheets].some((s) => { try { return [...s.cssRules].some((r) => r instanceof CSSKeyframesRule && r.name === "fadeIn"); } catch { return false; } }));
    log("canvas has @keyframes fadeIn", hasKeyframes);
    expect.soft(hasKeyframes, "animation preset has keyframes on the canvas").toBe(true);
    await page.locator('button[title="Add Animation"]').scrollIntoViewIfNeeded();
    await shot(page, "r13-animation");
  });

  await step("filter + backdrop filter", async () => {
    await page.locator('button[title="Add Filter function"]').click();
    await expect.soft.poll(() => cs(sub, "filter")).toBe("blur(4px)");
    await page.locator('button[title="Add Backdrop Filter function"]').click();
    await expect.soft.poll(() => cs(sub, "backdropFilter")).toBe("blur(4px)");
    await page.locator('button[title="Add Filter function"]').scrollIntoViewIfNeeded();
    await shot(page, "r14-filters");
    // Remove the blur so the rest of the audit stays readable.
    await page.locator('button[title="Remove"]').last().click();
    await page.locator('button[title="Remove"]').last().click();
    await expect.soft.poll(() => cs(sub, "filter")).toBe("none");
  });

  await step("clearing a value", async () => {
    const before = await cs(sub, "paddingLeft");
    const clear = row("paddingLeft").locator("button");
    log("paddingLeft row has a remove button", await clear.count());
    expect.soft(await clear.count(), "a set value can be removed").toBeGreaterThan(0);
    if (await clear.count()) {
      await clear.first().click();
      await expect.soft.poll(() => cs(sub, "paddingLeft")).toBe("0px");
      await expect.soft(row("paddingLeft")).toHaveCount(0);
      await shot(page, "r15-value-cleared");
      await undo();
      await expect.soft.poll(() => cs(sub, "paddingLeft"), "undo brings it back").toBe(before);
    }
  });

  await step("grid tracks + placement", async () => {
    log("Grid Tracks shown for a flex box (hero)", await (async () => {
      await select(ID.hero, { x: 8, y: 8 });
      return page.getByText("Grid Tracks", { exact: true }).count();
    })());
    const grid = el(ID.grid);
    const card = el(ID.card1);
    await select(ID.card1, { x: 4, y: 4 });
    await page.locator("button", { hasText: /^Testimonials Grid$/ }).last().click();
    await expect.soft(grid).toHaveAttribute("data-ws-selected", "");
    const colsBefore = await cs(grid, "gridTemplateColumns");
    const count = async () => (await cs(grid, "gridTemplateColumns")).split(" ").length;
    // The seeded grid is responsive (repeat(auto-fit, …)): "+" must not break it.
    const addCol = page.locator('button[title="Add columns track"], button[title^="Responsive"]').first();
    log("add-column on an auto-fit grid disabled", await addCol.isDisabled());
    if (!(await addCol.isDisabled())) {
      await addCol.click();
      log("grid columns after + on auto-fit", await cs(grid, "gridTemplateColumns"));
      expect.soft(await count(), "+ on a responsive grid keeps its columns").toBeGreaterThan(1);
      await undo();
    }
    const track = page.locator('button[title="Remove track"]').first().locator("xpath=..").locator('input[type="text"]');
    await track.click();
    await track.press("ControlOrMeta+a");
    await page.keyboard.type("1fr 1fr");
    log("track input keeps focus while typing", await track.evaluate((e) => e === document.activeElement).catch(() => false));
    await page.keyboard.press("Enter");
    await expect.soft.poll(count, "typed tracks apply").toBe(2);
    await page.locator('button[title="Add columns track"]').click();
    await expect.soft.poll(count, "+ adds a column").toBe(3);
    await shot(page, "r16-grid-tracks");
    await undo();
    await undo();
    await expect.soft.poll(() => cs(grid, "gridTemplateColumns"), "undo restores tracks").toBe(colsBefore);

    await select(ID.card1, { x: 4, y: 4 });
    const rowStart = page.locator('input[title="Row start line"]');
    await rowStart.fill("2");
    await expect.soft.poll(() => cs(card, "gridRowStart")).toBe("2");
    const colStart = page.locator('input[title="Column start line"]');
    await colStart.fill("2");
    await page.waitForTimeout(500);
    log("card gridColumnStart after col start 2", await cs(card, "gridColumnStart"));
    expect.soft(await cs(card, "gridColumnStart"), "column start applies").toBe("2");
    await rowStart.scrollIntoViewIfNeeded();
    await shot(page, "r17-grid-placement");
  });

  await step("state :hover only applies on hover", async () => {
    await select(ID.h1);
    await page.getByRole("button", { name: ":hover", exact: true }).click();
    await shot(page, "r18-hover-state-empty");
    await addProp("color", "#22c55e");
    await page.getByRole("button", { name: "Default", exact: true }).click();
    const h1 = el(ID.h1);
    await page.mouse.move(5, 5);
    await expect.soft.poll(() => cs(h1, "color"), "default color unchanged").not.toBe("rgb(34, 197, 94)");
    await h1.hover();
    await expect.soft.poll(() => cs(h1, "color"), "hover color").toBe("rgb(34, 197, 94)");
    await shot(page, "r19-hover-applied");
    await page.mouse.move(5, 5);
  });

  await step("per-breakpoint value", async () => {
    await select(ID.sub);
    await page.getByRole("button", { name: "Mobile P", exact: true }).click();
    await page.waitForTimeout(800);
    await openSection("Typography");
    await setNumber("fontSize", "14");
    await expect.soft.poll(() => cs(sub, "fontSize")).toBe("14px");
    await shot(page, "r20-mobile-font");
    await page.getByRole("button", { name: "Desktop", exact: true }).click();
    await page.waitForTimeout(800);
    await expect.soft.poll(() => cs(sub, "fontSize"), "desktop keeps 26px").toBe("26px");
    await openSection("Typography");
    await expect.soft(row("fontSize").locator('input[type="number"]')).toHaveValue("26");
    await shot(page, "r21-desktop-unchanged");
  });

  await step("saved project, preview and export carry the styles", async () => {
    await waitSaved(page);
    const saved = await savedText(page, id);
    for (const s of ["maxWidth", "boxShadow", "rotate(", "fadeIn", ":hover", "22c55e|\"r\":34"]) {
      expect.soft(new RegExp(s.replace("(", "\\(")).test(saved), `saved has ${s}`).toBe(true);
    }
    const want = { maxWidth: "500px", marginTop: "40px", fontSize: "26px", color: "rgb(185, 28, 28)", borderTopStyle: "dashed", position: "relative", top: "10px" };
    const read = (l: Locator) => l.evaluate((e, keys) => {
      const c = getComputedStyle(e) as unknown as Record<string, string>;
      return Object.fromEntries(keys.map((k) => [k, c[k]]));
    }, Object.keys(want));

    const preview = await context.newPage();
    await preview.goto(`/preview/${id}`);
    const frame = preview.frameLocator('iframe[title="Preview"]');
    const pSub = frame.locator("p", { hasText: "Nestled in the heart of Da Lat" }).first();
    await pSub.waitFor({ timeout: 60_000 });
    await expect.soft.poll(() => read(pSub)).toEqual(want);
    log("preview transform/animation", [await cs(pSub, "transform"), await cs(pSub, "animationName"), await cs(pSub, "opacity")]);
    const pH1 = frame.locator("h1").first();
    await pH1.hover();
    await expect.soft.poll(() => cs(pH1, "color"), "preview hover color").toBe("rgb(34, 197, 94)");
    await pSub.scrollIntoViewIfNeeded();
    await preview.screenshot({ path: "qa-screenshots/builder-audit/r22-preview.png" });
    await preview.close();

    const r = await page.request.get(`/api/export/${id}`);
    expect.soft(r.ok()).toBeTruthy();
    const html = await r.text();
    const exp = await context.newPage();
    await exp.setContent(html, { waitUntil: "load" });
    const eSub = exp.locator("p", { hasText: "Nestled in the heart of Da Lat" }).first();
    expect.soft(await read(eSub)).toEqual(want);
    log("export has @keyframes fadeIn", /@keyframes\s+fadeIn/.test(html));
    log("export has :hover rule", /:hover/.test(html));
    expect.soft(/@keyframes\s+fadeIn/.test(html), "export carries the animation keyframes").toBe(true);
    await exp.setViewportSize({ width: 400, height: 800 });
    await exp.waitForTimeout(800); // the audit added a 300ms "all" transition
    expect.soft(await cs(eSub, "fontSize"), "export mobile font size").toBe("14px");
    await eSub.scrollIntoViewIfNeeded();
    await exp.screenshot({ path: "qa-screenshots/builder-audit/r23-export-mobile.png" });
    await exp.close();
  });

  await step("props: heading tag h1 → h2", async () => {
    await select(ID.h1);
    await tab(/^props$/i).click();
    await shot(page, "r24-props-heading");
    const tagSelect = page.locator("select").filter({ has: page.locator('option[value="h2"]') }).first();
    if (await tagSelect.count()) await tagSelect.selectOption("h2");
    else {
      const tagInput = page.locator('input[type="text"]').filter({ hasNot: page.locator("xx") });
      const i = await tagInput.evaluateAll((els) => els.findIndex((e) => (e as HTMLInputElement).value === "h1"));
      log("heading tag control", i >= 0 ? "text input" : "not found");
      if (i >= 0) { await tagInput.nth(i).fill("h2"); await tagInput.nth(i).press("Enter"); }
    }
    await expect.soft.poll(() => el(ID.h1).evaluate((e) => e.tagName)).toBe("H2");
    await shot(page, "r25-props-heading-h2");
  });

  await step("props: link href + target", async () => {
    await select(ID.menuLink);
    await tab(/^props$/i).click();
    await shot(page, "r26-props-link");
    const href = page.locator("input").filter({ hasNot: page.locator("xx") });
    const i = await href.evaluateAll((els) => els.findIndex((e) => (e as HTMLInputElement).value === "#menu"));
    expect.soft(i, "href field shows #menu").toBeGreaterThanOrEqual(0);
    if (i >= 0) { await href.nth(i).fill("https://example.com/menu"); await href.nth(i).press("Tab"); }
    await expect.soft.poll(() => el(ID.menuLink).getAttribute("href")).toBe("https://example.com/menu");
    const target = page.locator("select").filter({ has: page.locator('option[value="_blank"]') }).first();
    log("link target control in Props", await target.count());
    if (await target.count()) await target.selectOption("_blank");
    else {
      await tab(/^settings$/i).click();
      const t2 = page.locator("select").filter({ has: page.locator('option[value="_blank"]') }).first();
      log("link target control in Settings", await t2.count());
      if (await t2.count()) await t2.selectOption("_blank");
    }
    await expect.soft.poll(() => el(ID.menuLink).getAttribute("target")).toBe("_blank");
    await shot(page, "r27-link-target");
  });

  await step("props: image src, alt, library", async () => {
    await select(ID.heroImg);
    await tab(/^props$/i).click();
    await shot(page, "r28-props-image");
    const inputs = page.locator("input");
    const altIdx = await inputs.evaluateAll((els) => els.findIndex((e) => (e as HTMLInputElement).value.startsWith("Coffee beans and a cup")));
    expect.soft(altIdx, "alt field visible").toBeGreaterThanOrEqual(0);
    if (altIdx >= 0) { await inputs.nth(altIdx).fill("Audit alt text"); await inputs.nth(altIdx).press("Tab"); }
    await expect.soft.poll(() => el(ID.heroImg).getAttribute("alt")).toBe("Audit alt text");
    const newSrc = "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600";
    const srcIdx = await inputs.evaluateAll((els) => els.findIndex((e) => (e as HTMLInputElement).value.startsWith("https://images.unsplash.com/photo-1509042239860")));
    if (srcIdx >= 0) { await inputs.nth(srcIdx).fill(newSrc); await inputs.nth(srcIdx).press("Enter"); }
    await expect.soft.poll(() => el(ID.heroImg).getAttribute("src")).toContain("photo-1495474472287");
    const lib = page.getByRole("button", { name: /choose from library/i });
    if (await lib.count()) {
      await lib.click();
      await page.waitForTimeout(800);
      log("library dialogs", dialogs);
      await shot(page, "r29-image-library");
      expect.soft(dialogs.some((d) => /coming soon/i.test(d)), "library opens a picker, not a 'coming soon' alert").toBe(false);
      const pick = page.getByRole("option", { name: "qa-pixel.png" });
      await expect.soft(pick, "the project's uploaded image is listed").toBeVisible();
      if (await pick.count()) {
        await pick.click();
        await expect.soft.poll(() => el(ID.heroImg).getAttribute("src")).toContain("qa-pixel.png");
        await shot(page, "r29b-image-picked");
        await undo();
        await expect.soft.poll(() => el(ID.heroImg).getAttribute("src"), "undo restores the image").toContain("photo-1495474472287");
      }
    }
  });

  await step("settings: image object fit", async () => {
    await tab(/^settings$/i).click();
    await shot(page, "r30-settings-image");
    await page.getByRole("button", { name: "contain", exact: true }).click();
    await expect.soft.poll(() => cs(el(ID.heroImg), "objectFit")).toBe("contain");
    await undo();
    await expect.soft.poll(() => cs(el(ID.heroImg), "objectFit")).not.toBe("contain");
  });

  await step("props + settings: button", async () => {
    await select(ID.orderBtn);
    await tab(/^props$/i).click();
    await shot(page, "r31-props-button");
    const variant = page.locator("label", { hasText: /^(Style|Variant)$/ }).locator("xpath=../..").locator("select").first();
    log("button variant options", await variant.locator("option").allTextContents().catch(() => []));
    if (await variant.count()) {
      const bg = await cs(el(ID.orderBtn), "backgroundColor");
      const values = await variant.locator("option").evaluateAll((os) => os.map((o) => (o as HTMLOptionElement).value));
      await variant.selectOption(values.find((v) => v && v !== "default") ?? "");
      await page.waitForTimeout(500);
      const changed = (await cs(el(ID.orderBtn), "backgroundColor")) !== bg;
      log("variant changed the look directly", changed);
      if (!changed) {
        // The AI page gives the button its own colours; the panel must say so.
        await expect.soft(page.getByText(/own colou?rs in the Style tab/), "variant explains the colour override").toBeVisible();
        await shot(page, "r32-button-variant-hint");
        await tab(/^style$/i).click();
        await openSection("Background");
        await row("backgroundColor").getByRole("button").click();
        await expect.soft.poll(() => cs(el(ID.orderBtn), "backgroundColor"), "variant colour shows once the override is removed").not.toBe(bg);
        await shot(page, "r32b-button-variant-applied");
        await undo();
        await expect.soft.poll(() => cs(el(ID.orderBtn), "backgroundColor")).toBe(bg);
      }
    }
    await tab(/^settings$/i).click();
    await shot(page, "r33-settings-button");
  });

  await step("props + settings: form fields", async () => {
    await select(ID.nameInput);
    await tab(/^props$/i).click();
    await shot(page, "r34-props-input");
    const inputs = page.locator("input");
    const ph = await inputs.evaluateAll((els) => els.findIndex((e) => (e as HTMLInputElement).value === "Your Name"));
    expect.soft(ph, "placeholder field visible").toBeGreaterThanOrEqual(0);
    if (ph >= 0) { await inputs.nth(ph).fill("Full name"); await inputs.nth(ph).press("Tab"); }
    await expect.soft.poll(() => el(ID.nameInput).getAttribute("placeholder")).toBe("Full name");
    await tab(/^settings$/i).click();
    await shot(page, "r35-settings-input");
    await select(ID.submit);
    await tab(/^props$/i).click();
    await shot(page, "r36-props-submit");
    await select(ID.form, { x: 4, y: 4 });
    await tab(/^settings$/i).click();
    await shot(page, "r37-settings-form");
    const action = page.locator("input").filter({ hasNot: page.locator("xx") });
    const ai = await action.evaluateAll((els) => els.findIndex((e) => (e as HTMLInputElement).value === "#"));
    log("form action field", ai);
    if (ai >= 0) { await action.nth(ai).fill("https://example.com/hook"); }
    await expect.soft.poll(() => el(ID.form).getAttribute("action")).toBe("https://example.com/hook");
  });

  await step("props changes are saved", async () => {
    await waitSaved(page);
    const saved = await savedText(page, id);
    for (const s of ["Audit alt text", "Full name", "https://example.com/menu", "_blank", "https://example.com/hook"]) {
      expect.soft(saved.includes(s), `saved has ${s}`).toBe(true);
    }
  });
});
