// Throwaway account + seeded project for Tier B specs, so they never touch the
// shared QA account. The project is a real AI-generated landing page
// (e2e/fixtures/landing.schema.json), seeded through POST /api/projects — no AI quota used.
// With SUPABASE_URL + SUPABASE_SERVICE_KEY set, deleteFreshAccount() removes the
// account and its projects afterwards.
import type { Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

export type FreshAccount = { email: string; password: string };

const LANDING = JSON.parse(readFileSync(join(__dirname, "../fixtures/landing.schema.json"), "utf8"));

/** Pins the UI language and skips the onboarding tour for every page in the context. */
export async function pinLocale(page: Page, locale: "en" | "vi" = "en") {
  await page.context().addInitScript((l) => {
    try {
      localStorage.setItem("nova_locale", l);
      localStorage.setItem("nova_auto_detect_ip", "false");
      localStorage.setItem("nova-tour-done", "1");
      localStorage.setItem("nova-coachmarks-seen", "1");
    } catch { /* storage blocked */ }
  }, locale);
  const url = process.env.BASE_URL;
  if (url) await page.context().addCookies([{ name: "nova_locale", value: locale, url }]);
}

/** Registers a new account and signs in through the login form. */
export async function freshAccount(page: Page, tag: string, locale: "en" | "vi" = "en"): Promise<FreshAccount> {
  await pinLocale(page, locale);
  const acc = { email: `qa.${tag}.${Date.now()}@testqa.dev`, password: "QaTierB!2026" };
  const r = await page.request.post("/api/auth/register", { data: { ...acc, name: `QA ${tag}` } });
  if (!r.ok()) throw new Error(`register failed: ${r.status()} ${await r.text()}`);
  await page.goto("/login");
  await page.locator('input[type="email"]').fill(acc.email);
  await page.locator('input[type="password"]').fill(acc.password);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(/\/projects/, { timeout: 120_000 });
  return acc;
}

/** Creates a project from the landing-page fixture (or given WebstudioData, as GET /api/projects/:id returns it in `data`); returns its id. */
export async function seedProject(page: Page, name: string, data: unknown = LANDING): Promise<string> {
  const now = new Date().toISOString();
  const schema_json = { schemaVersion: "5.0", meta: { name, createdAt: now, updatedAt: now }, data };
  const r = await page.request.post("/api/projects", { data: { name, schema_json } });
  if (r.status() !== 201) throw new Error(`seed failed: ${r.status()} ${await r.text()}`);
  return ((await r.json()) as { id: string }).id;
}

/** Opens the builder for a project and waits until the canvas shows the page. */
export async function openBuilder(page: Page, projectId: string) {
  await page.goto(`/builder/${projectId}`);
  await page.frameLocator('iframe[title="Canvas"]').locator("h1").first().waitFor({ timeout: 120_000 });
}

/** Deletes the throwaway account and its projects (needs the Supabase service key). */
export async function deleteFreshAccount(acc: FreshAccount | undefined) {
  const { SUPABASE_URL: url, SUPABASE_SERVICE_KEY: key } = process.env;
  if (!acc || !url || !key) return;
  const sb = (path: string, method = "GET") =>
    fetch(`${url}/rest/v1/${path}`, { method, headers: { apikey: key, authorization: `Bearer ${key}` } });
  const rows = (await (await sb(`users?email=eq.${encodeURIComponent(acc.email)}&select=id`)).json()) as { id: string }[];
  const id = rows[0]?.id;
  if (!id) return;
  await sb(`projects?user_id=eq.${id}`, "DELETE");
  await sb(`users?id=eq.${id}`, "DELETE");
}
