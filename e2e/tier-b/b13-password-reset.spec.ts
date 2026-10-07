// B13 — forgot / reset password and verify email, driven through the real pages.
// Only token hashes are stored, so the spec proves the server issued a token (DB row
// appears), then swaps in a token whose raw value it knows (same SHA-256 scheme as
// lib/passwordReset.ts) to finish the flow. Mail to @testqa.dev goes to Brevo's sandbox
// (validated, not sent); real delivery is checked separately against a real inbox.
// Needs SUPABASE_URL + SUPABASE_SERVICE_KEY.
import { test, expect } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { randomBytes, createHash } from "node:crypto";
import { pinLocale, deleteFreshAccount, type FreshAccount } from "../helpers/fresh-account";

const OUT = "qa-screenshots/tier-b";
mkdirSync(OUT, { recursive: true });
let acc: FreshAccount | undefined;
test.afterAll(async () => deleteFreshAccount(acc));

const { SUPABASE_URL: SB_URL, SUPABASE_SERVICE_KEY: SB_KEY } = process.env;
const sb = async (path: string, method = "GET", body?: unknown) => {
  const r = await fetch(`${SB_URL}/rest/v1/${path}`, {
    method,
    headers: { apikey: SB_KEY!, authorization: `Bearer ${SB_KEY}`, "content-type": "application/json", prefer: "return=representation" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await r.text();
  return text ? JSON.parse(text) : null;
};
/** Replaces the user's tokens in `table` with one whose raw value we know. */
async function plantToken(table: string, userId: string): Promise<string> {
  const raw = randomBytes(32).toString("hex");
  await sb(`${table}?user_id=eq.${userId}`, "DELETE");
  await sb(table, "POST", {
    token_hash: createHash("sha256").update(raw).digest("hex"),
    user_id: userId,
    expires_at: new Date(Date.now() + 30 * 60_000).toISOString(),
  });
  return raw;
}

test("B13 forgot / reset password + verify email", async ({ page }) => {
  expect(SB_URL && SB_KEY, "Supabase service env").toBeTruthy();
  await pinLocale(page, "en");
  acc = { email: `qa.b13.${Date.now()}@testqa.dev`, password: "QaTierB!2026" };
  expect((await page.request.post("/api/auth/register", { data: { ...acc, name: "QA b13" } })).ok()).toBe(true);
  const [user] = (await sb(`users?email=eq.${encodeURIComponent(acc.email)}&select=id,email_verified`)) as { id: string; email_verified: boolean }[];
  expect(user.email_verified).toBe(false);
  // Signup issued a verification token
  expect(await sb(`email_verification_tokens?user_id=eq.${user.id}&select=user_id`)).toHaveLength(1);

  // Login -> "Forgot password?" -> request link
  await page.goto("/login");
  await page.getByRole("link", { name: "Forgot password?" }).click();
  await page.waitForURL(/\/forgot-password/);
  await page.locator("#forgot-email").fill(acc.email);
  await page.screenshot({ path: `${OUT}/b13-01-forgot-form.png` });
  await page.locator('button[type="submit"]').click();
  await expect(page.getByRole("heading", { name: "Check your email" })).toBeVisible();
  await page.screenshot({ path: `${OUT}/b13-02-forgot-sent.png` });
  const issued = (await sb(`password_reset_tokens?user_id=eq.${user.id}&select=expires_at`)) as { expires_at: string }[];
  expect(issued, "reset token row issued by server").toHaveLength(1);
  expect(new Date(issued[0].expires_at).getTime()).toBeGreaterThan(Date.now());

  // Reset page with a known token
  const raw = await plantToken("password_reset_tokens", user.id);
  const newPassword = "QaReset!2026x";
  await page.goto(`/reset-password?token=${raw}`);
  await expect(page.getByRole("heading", { name: "Set a new password" })).toBeVisible();
  await page.locator("#reset-password").fill(newPassword);
  await page.locator('button[type="submit"]').click();
  await expect(page.getByRole("heading", { name: "Password updated" })).toBeVisible();
  await page.screenshot({ path: `${OUT}/b13-03-reset-done.png` });

  // Token is single-use
  await page.goto(`/reset-password?token=${raw}`);
  await page.locator("#reset-password").fill("Another!2026");
  await page.locator('button[type="submit"]').click();
  await expect(page.getByText(/reset link is invalid/i)).toBeVisible();
  await page.screenshot({ path: `${OUT}/b13-04-token-reused.png` });

  // Old password rejected, new password works
  await page.goto("/login");
  await page.locator('input[type="email"]').fill(acc.email);
  await page.locator('input[type="password"]').fill(acc.password);
  await page.locator('button[type="submit"]').click();
  await page.waitForTimeout(4000);
  await expect(page).toHaveURL(/\/login/);
  await page.screenshot({ path: `${OUT}/b13-05-old-password-rejected.png` });
  await page.locator('input[type="password"]').fill(newPassword);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(/\/projects/, { timeout: 120_000 });
  acc.password = newPassword;
  await page.screenshot({ path: `${OUT}/b13-06-login-new-password.png` });

  // Verify email page
  const vraw = await plantToken("email_verification_tokens", user.id);
  // Real-world path: the user is still signed in when they click the emailed link.
  await page.goto(`/verify-email?token=${vraw}`);
  await page.waitForLoadState("load");
  await page.waitForTimeout(3000);
  expect.soft(new URL(page.url()).pathname, "verify link works while signed in").toBe("/verify-email");
  await page.screenshot({ path: `${OUT}/b13-07a-verify-signed-in.png` });
  // Signed out, the page itself must consume the token.
  await page.context().clearCookies();
  await page.goto(`/verify-email?token=${vraw}`);
  await expect(page.getByRole("heading", { name: "Email verified" })).toBeVisible({ timeout: 30_000 });
  await page.screenshot({ path: `${OUT}/b13-07-email-verified.png` });
  const [after] = (await sb(`users?id=eq.${user.id}&select=email_verified`)) as { email_verified: boolean }[];
  expect(after.email_verified).toBe(true);
});
