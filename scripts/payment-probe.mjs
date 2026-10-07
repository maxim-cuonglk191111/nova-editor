// End-to-end check of the SePay VietQR checkout on a deployed build.
// node scripts/payment-probe.mjs <base> <email> <password> <webhookKeyFile>
// Needs: npm i --no-save jsqr  (Playwright's chromium decodes the QR image).
// Grants 500 credits to <email>. With SUPABASE_URL + SUPABASE_SERVICE_KEY set it
// undoes that afterwards (order rows deleted, credits restored), so it can run on every deploy.
import { readFileSync } from "node:fs";
import jsQR from "jsqr";

const [base, email, password, keyFile] = process.argv.slice(2);
const jar = new Map();
const cookie = () => [...jar].map(([k, v]) => `${k}=${v}`).join("; ");
const keep = (r) => { for (const c of r.headers.getSetCookie?.() ?? []) { const [kv] = c.split(";"); const i = kv.indexOf("="); jar.set(kv.slice(0, i), kv.slice(i + 1)); } };
const req = async (path, init = {}) => { const r = await fetch(base + path, { redirect: "manual", ...init, headers: { ...(init.headers ?? {}), cookie: cookie() } }); keep(r); return r; };
const check = (ok, label, extra = "") => { console.log(`${ok ? "PASS" : "FAIL"} ${label}${extra ? " — " + extra : ""}`); if (!ok) process.exitCode = 1; };

// Login
let r = await req("/api/auth/csrf");
const { csrfToken } = await r.json();
await req("/api/auth/callback/credentials", { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ csrfToken, email, password, json: "true" }) });
const account = async () => (await (await req("/api/settings/account")).json());
const before = await account();
check(!!before?.credits || before?.credits === 0, "logged in", `credits=${before.credits}`);

// 1. Create checkout
r = await req("/api/billing/payos/create-link", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ plan: "credits" }) });
const co = await r.json();
check(r.ok && co.provider === "sepay", "create-link returns a SePay order", `status=${r.status} provider=${co.provider} error=${co.error ?? ""}`);
if (!r.ok) process.exit(1);
check(!/mock/i.test(co.accountName ?? "") && co.accountNumber !== "1234567890", "real account (not the mock)", `bank=${co.bin} acc=${String(co.accountNumber).slice(0, 2)}***${String(co.accountNumber).slice(-4)} (len ${String(co.accountNumber).length}) name="${co.accountName}" amount=${co.amount} desc=${co.description}`);

// 2. QR image as the modal renders it, decoded
const qrUrl = `https://img.vietqr.io/image/${co.bin}-${co.accountNumber}-qr_only.png?amount=${co.amount}&addInfo=${encodeURIComponent(co.description)}&accountName=${encodeURIComponent(co.accountName)}`;
const img = await fetch(qrUrl);
check(img.ok && (img.headers.get("content-type") ?? "").includes("png"), "QR image renders", `HTTP ${img.status}`);
// Decode through a real browser canvas (the PNG is not strictly spec-clean for pngjs).
const { createRequire } = await import("node:module");
const { chromium } = createRequire(import.meta.url)("@playwright/test");
const browser = await chromium.launch();
const pg = await browser.newPage();
const dataUrl = "data:image/png;base64," + Buffer.from(await img.arrayBuffer()).toString("base64");
const px = await pg.evaluate(async (u) => {
  const im = new Image(); im.src = u; await im.decode();
  const cv = document.createElement("canvas"); cv.width = im.naturalWidth; cv.height = im.naturalHeight;
  const cx = cv.getContext("2d"); cx.drawImage(im, 0, 0);
  return { w: cv.width, h: cv.height, d: Array.from(cx.getImageData(0, 0, cv.width, cv.height).data) };
}, dataUrl);
await browser.close();
const decoded = jsQR(new Uint8ClampedArray(px.d), px.w, px.h);
check(!!decoded, "QR decodes");
const payload = decoded?.data ?? "";
const tlv = (s) => { const out = {}; let i = 0; while (i + 4 <= s.length) { const t = s.slice(i, i + 2); const l = +s.slice(i + 2, i + 4); out[t] = s.slice(i + 4, i + 4 + l); i += 4 + l; } return out; };
const top = tlv(payload);
const merchant = tlv(top["38"] ?? "");
const bene = tlv(merchant["01"] ?? "");
const extra = tlv(top["62"] ?? "");
const crc = (s) => { let c = 0xffff; for (const ch of s) { c ^= ch.charCodeAt(0) << 8; for (let k = 0; k < 8; k++) c = c & 0x8000 ? ((c << 1) ^ 0x1021) & 0xffff : (c << 1) & 0xffff; } return c.toString(16).toUpperCase().padStart(4, "0"); };
check(merchant["00"] === "A000000727", "NAPAS VietQR merchant GUID (tag 38/00)", merchant["00"]);
check(bene["01"] === String(co.accountNumber), "account number in QR (38/01/01)");
check(/^\d{6}$/.test(bene["00"] ?? ""), "bank BIN in QR (38/01/00)", bene["00"]);
check(top["53"] === "704", "currency VND (53)");
check(Number(top["54"]) === co.amount, "amount in QR (54)", top["54"]);
check((extra["08"] ?? "").replace(/\s/g, "").toUpperCase().includes(co.description), "transfer description in QR (62/08)", extra["08"]);
check(crc(payload.slice(0, -4)) === top["63"], "CRC16 valid (63)");

// 3. Not paid yet
r = await req(`/api/billing/payos/status?orderCode=${co.orderCode}`);
check((await r.json()).paid === false, "status before payment = unpaid");

// 4. Signed SePay webhook (as SePay would send for this transfer)
const key = readFileSync(keyFile, "utf8").trim();
const hook = (k) => fetch(base + "/api/billing/webhook/sepay", { method: "POST", headers: { "content-type": "application/json", authorization: `Apikey ${k}` }, body: JSON.stringify({ id: Date.now(), gateway: "TEST", transferType: "in", transferAmount: co.amount, content: `MBVCB.123 ${co.description} chuyen tien`, code: null }) });
r = await hook("wrong-key");
check(r.status === 401, "webhook rejects a wrong key", `HTTP ${r.status}`);
r = await hook(key);
const w1 = await r.json();
check(r.ok && w1.success && w1.result === "granted", "webhook grants the purchase", JSON.stringify(w1));
r = await hook(key);
const w2 = await r.json();
check(w2.result === "duplicate", "replayed webhook is ignored (granted once)", JSON.stringify(w2));
r = await req(`/api/billing/payos/status?orderCode=${co.orderCode}`);
check((await r.json()).paid === true, "status after payment = paid");
const after = await account();
check(after.credits === before.credits + 500, "credits +500 exactly once", `${before.credits} → ${after.credits}`);
r = await req("/api/billing/payos/history");
const hist = await r.json();
check(r.ok && (hist.history ?? []).some((h) => h.order_code === String(co.orderCode)), "transaction history lists it", `HTTP ${r.status}`);
console.log(`ORDER ${co.orderCode} BEFORE_CREDITS ${before.credits}`);

// 5. Clean up
const { SUPABASE_URL: sbUrl, SUPABASE_SERVICE_KEY: sbKey } = process.env;
if (sbUrl && sbKey) {
  const sb = (path, init = {}) => fetch(`${sbUrl}/rest/v1/${path}`, { ...init, headers: { apikey: sbKey, authorization: `Bearer ${sbKey}`, "content-type": "application/json", prefer: "return=representation", ...(init.headers ?? {}) } });
  const order = encodeURIComponent(String(co.orderCode));
  const delPaid = await sb(`processed_payments?order_code=eq.${order}`, { method: "DELETE" });
  const delOrder = await sb(`payment_orders?order_code=eq.${order}`, { method: "DELETE" });
  const reset = await sb(`users?email=eq.${encodeURIComponent(email)}`, { method: "PATCH", body: JSON.stringify({ credits_remaining: before.credits }) });
  const cleaned = delPaid.ok && delOrder.ok && reset.ok && (await account()).credits === before.credits;
  check(cleaned, "cleanup: order rows deleted, credits restored", `${delPaid.status}/${delOrder.status}/${reset.status}`);
} else {
  console.log("SKIP cleanup — set SUPABASE_URL and SUPABASE_SERVICE_KEY to undo the grant");
}
