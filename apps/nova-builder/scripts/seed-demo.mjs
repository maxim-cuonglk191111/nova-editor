#!/usr/bin/env node
// Seed the demo accounts, each owning one finished project, and print the public preview link
// of every project.
//
//   cd apps/nova-builder
//   node scripts/seed-demo.mjs                       dry run: build + validate, write nothing
//   node scripts/seed-demo.mjs --apply               create / refresh the accounts and projects
//   node scripts/seed-demo.mjs --apply --base https://your-site.example
//   node scripts/seed-demo.mjs --cleanup --apply     delete the demo accounts (projects cascade)
//   node scripts/seed-demo.mjs --sales --apply      mark the sites that "bought" Pro as paid (provider "demo")
//   node scripts/seed-demo.mjs --remove-sales --apply   undo that: orders removed, tier back to free
//   node scripts/seed-demo.mjs --retire --apply     delete the accounts of sites marked `retired` (projects cascade)
//   node scripts/seed-demo.mjs --admin --apply       create a temporary admin account to open /admin
//   node scripts/seed-demo.mjs --remove-admin --apply   delete it again (an admin account is not left standing)
//   node scripts/seed-demo.mjs --out some/dir        also write what /api/preview/<id> would return,
//                                                    one <slug>.json each, to test the preview offline
//
// Writes to whichever Supabase project SUPABASE_URL points at (apps/nova-builder/.env.local, or
// pass another env file as the first non-flag argument). The dry run prints that host first, so
// check it before adding --apply. Idempotent: re-running updates the same projects, never
// duplicates. Passwords are random, shown once in the output file, never in the terminal:
//   .seed-demo-output.json   (gitignored)

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { build } from "esbuild";

const appDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const option = (name) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : undefined; };
const apply = flag("apply");
const cleanup = flag("cleanup");
const envArg = args.find((a, i) => !a.startsWith("--") && args[i - 1] !== "--base" && args[i - 1] !== "--out");
const baseUrl = (option("base") ?? process.env.SEED_BASE_URL ?? "http://localhost:3001").replace(/\/$/, "");
const OUTPUT = join(appDir, ".seed-demo-output.json");
const ASSET_DIR = join(appDir, "scripts/seed-assets");
const BUCKET = "assets"; // the bucket the editor's own uploads go to (src/lib/supabaseStorage.ts)
const MIME = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp" };

function parseDotenv(text) {
  const out = {};
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    let val = line.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) val = val.slice(1, -1);
    out[line.slice(0, eq).trim().replace(/^export /, "")] = val;
  }
  return out;
}

// Bundle the app's own TypeScript (project builder, hashing, migration) into one temp module.
async function loadSeedModule() {
  const outfile = join(tmpdir(), `nova-seed-${process.pid}.mjs`);
  await build({
    entryPoints: [join(appDir, "src/lib/seed/entry.ts")],
    bundle: true,
    platform: "node",
    format: "esm",
    outfile,
    logLevel: "error",
    alias: {
      "@": join(appDir, "src"),
      // Only the composition converter is needed, not every AI provider SDK behind the barrel.
      "@studio/ai": resolve(appDir, "../../packages/ai/src/utils/validateCompositionWS.ts"),
    },
  });
  return import(pathToFileURL(outfile).href);
}

async function main() {
  const envFile = envArg ? resolve(process.cwd(), envArg) : join(appDir, ".env.local");
  if (!existsSync(envFile)) { console.error(`No env file at ${envFile}`); process.exit(1); }
  const env = parseDotenv(readFileSync(envFile, "utf8"));
  let url = env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
  url = url?.replace(/\/rest\/v1\/?$/, "");
  const key = env.SUPABASE_SERVICE_KEY || env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) { console.error("SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in", envFile); process.exit(1); }

  const host = new URL(url).host;
  console.log(`Target database : ${host}`);
  console.log(`Mode            : ${cleanup ? "CLEANUP" : "seed"} ${apply ? "(APPLY: writes to that database)" : "(dry run: nothing is written)"}`);
  console.log(`Preview base    : ${baseUrl}\n`);

  const seed = await loadSeedModule();
  const active = seed.DEMO_SITES.filter((b) => !b.retired);
  const now = new Date().toISOString();
  const db = createClient(url, key, { auth: { persistSession: false } });

  if (cleanup) {
    for (const b of seed.DEMO_SITES) {
      if (!apply) { console.log(`would delete account ${b.email}`); continue; }
      const { error } = await db.from("users").delete().eq("email", b.email).eq("provider", "email");
      console.log(error ? `FAIL ${b.email}: ${error.message}` : `deleted ${b.email}`);
    }
    return;
  }

  if (flag("retire")) { await retire(db, seed); return; }
  if (flag("sales") || flag("remove-sales")) { await sales(db, seed, now); return; }
  if (flag("admin") || flag("remove-admin")) { await admin(db, seed); return; }

  // Sites that ship their own photos point at the public URL Supabase will give the upload.
  const ctx = { assetBase: `${url}/storage/v1/object/public/${BUCKET}/seed` };
  const missing = active.flatMap((b) => (b.assets ?? []).filter((f) => !existsSync(join(ASSET_DIR, b.slug, f))).map((f) => `${b.slug}/${f}`));
  if (missing.length) { console.error(`Missing asset files in ${ASSET_DIR}: ${missing.join(", ")}`); process.exit(1); }

  // Compatibility check: the exact path /api/preview takes (migrate, then serialize).
  const prepared = active.map((b) => {
    const schema = seed.buildProjectSchema(b, now, ctx);
    const project = seed.migrateToLatest(JSON.parse(JSON.stringify(schema)));
    const serialized = seed.serializeWebstudioData(project.data);
    if (option("out")) {
      writeFileSync(join(resolve(option("out")), `${b.slug}.json`), JSON.stringify({
        id: `seed-${b.slug}`, name: b.name, schemaVersion: "5.0", data: serialized,
        cssVars: {}, interactions: {}, customCss: "", cookieConsent: null, updatedAt: now,
      }));
    }
    return { business: b, schema, instances: schema.data.instances.length };
  });
  for (const p of prepared) console.log(`ok   ${p.business.slug.padEnd(16)} ${p.instances} instances, readable by the preview path`);
  console.log("");
  if (!apply) { console.log("Dry run complete. Add --apply to write."); return; }

  // Upload the sites' own photos first, so no preview ever points at a file that is not there yet.
  const withAssets = active.filter((b) => b.assets?.length);
  if (withAssets.length) {
    const { data: bucket } = await db.storage.getBucket(BUCKET);
    if (!bucket) {
      const { error } = await db.storage.createBucket(BUCKET, { public: true });
      if (error && !/already exists/i.test(error.message)) { console.error(`createBucket: ${error.message}`); process.exit(1); }
    }
    for (const b of withAssets) {
      for (const file of b.assets) {
        const ext = file.slice(file.lastIndexOf(".")).toLowerCase();
        const { error } = await db.storage.from(BUCKET).upload(`seed/${b.slug}/${file}`, readFileSync(join(ASSET_DIR, b.slug, file)), { contentType: MIME[ext] ?? "application/octet-stream", upsert: true });
        console.log(error ? `FAIL asset ${b.slug}/${file}: ${error.message}` : `uploaded ${BUCKET}/seed/${b.slug}/${file}`);
        if (error) process.exit(1);
      }
    }
    console.log("");
  }

  const previous = existsSync(OUTPUT) ? JSON.parse(readFileSync(OUTPUT, "utf8")) : {};
  const output = { ...previous };
  const rows = [];

  for (const { business: b, schema } of prepared) {
    let { data: user } = await db.from("users").select("id").eq("email", b.email).eq("provider", "email").maybeSingle();
    let password;
    if (!user) {
      password = randomBytes(9).toString("base64url");
      const { data, error } = await db.from("users")
        .insert({ email: b.email, provider: "email", display_name: b.displayName, password_hash: await seed.hashPassword(password), tier: "free", email_verified: true })
        .select("id").single();
      if (error) { console.log(`FAIL account ${b.email}: ${error.message}`); continue; }
      user = data;
      await db.from("credit_transactions").insert({ user_id: user.id, delta: 200, reason: "initial_grant" });
      output[b.email] = { password, userId: user.id };
    }

    const { data: existing } = await db.from("projects").select("id").eq("user_id", user.id).eq("project_name", b.name).maybeSingle();
    let projectId = existing?.id;
    if (projectId) {
      const { error } = await db.from("projects").update({ schema_json: schema }).eq("id", projectId);
      if (error) { console.log(`FAIL project ${b.slug}: ${error.message}`); continue; }
    } else {
      const { data, error } = await db.from("projects").insert({ user_id: user.id, project_name: b.name, schema_json: schema }).select("id").single();
      if (error) { console.log(`FAIL project ${b.slug}: ${error.message}`); continue; }
      projectId = data.id;
    }
    output[b.email] = { ...(output[b.email] ?? {}), userId: user.id, projectId, preview: `${baseUrl}/preview/${projectId}` };
    rows.push({ account: b.email, created: password ? "new" : "existing (password unchanged)", preview: `${baseUrl}/preview/${projectId}` });
  }

  writeFileSync(OUTPUT, JSON.stringify(output, null, 2));
  console.log(rows.map((r) => `${r.account}  [${r.created}]\n   ${r.preview}`).join("\n"));
  console.log(`\nPasswords for new accounts are in ${OUTPUT} (gitignored).`);
}

// Purchases for the sites that have `purchase`: a paid order and its payment record, the account
// moved to that tier. The amount is the plan's list price and the provider is "demo" so the
// admin screen can say so. Paid time is a few minutes after the account was created, never in
// the future. Re-running reconciles: a site without `purchase` loses an order it had before.
async function sales(db, seed, now) {
  const orderCode = (b) => `DEMO-${b.slug.toUpperCase()}`;
  const active = seed.DEMO_SITES.filter((b) => !b.retired);
  const buyers = active.filter((b) => b.purchase);
  if (!flag("remove-sales")) {
    for (const b of active.filter((s) => !s.purchase)) {
      const { data: old } = await db.from("payment_orders").select("order_code").eq("order_code", orderCode(b)).maybeSingle();
      if (!old) continue;
      console.log(`${apply ? "remove" : "would remove"} ${orderCode(b)} (${b.slug} is no longer a buyer)`);
      if (!apply) continue;
      await db.from("payment_orders").delete().eq("order_code", orderCode(b));
      await db.from("processed_payments").delete().eq("order_code", orderCode(b));
      await db.from("users").update({ tier: "free" }).eq("email", b.email).eq("provider", "email");
    }
  }
  for (const [i, b] of buyers.entries()) {
    const { data: user } = await db.from("users").select("id, created_at").eq("email", b.email).eq("provider", "email").maybeSingle();
    if (!user) { console.log(`skip ${b.email}: no account (run the seed first)`); continue; }
    if (flag("remove-sales")) {
      if (!apply) { console.log(`would remove order ${orderCode(b)} and set ${b.email} back to free`); continue; }
      await db.from("payment_orders").delete().eq("order_code", orderCode(b));
      await db.from("processed_payments").delete().eq("order_code", orderCode(b));
      await db.from("users").update({ tier: "free" }).eq("id", user.id);
      console.log(`removed ${orderCode(b)}`);
      continue;
    }
    const amount = seed.PAYOS_PRICES_VND[b.purchase.plan];
    const paidAt = new Date(Math.min(Date.parse(user.created_at) + (7 + i * 9) * 60_000, Date.parse(now) - 60_000)).toISOString();
    const createdAt = new Date(Date.parse(paidAt) - 2 * 60_000).toISOString();
    console.log(`${apply ? "write" : "would write"} ${orderCode(b)}  ${b.email}  ${b.purchase.plan}  ${amount} VND  paid ${paidAt}`);
    if (!apply) continue;
    const results = await Promise.all([
      db.from("payment_orders").upsert({ order_code: orderCode(b), provider: "demo", user_id: user.id, plan: b.purchase.plan, amount, status: "paid", created_at: createdAt, paid_at: paidAt }),
      db.from("processed_payments").upsert({ order_code: orderCode(b), provider: "demo", kind: "plan", user_id: user.id, amount, plan: b.purchase.plan, status: "success", created_at: paidAt }),
      db.from("users").update({ tier: b.purchase.plan }).eq("id", user.id),
    ]);
    for (const r of results) if (r.error) console.log(`FAIL ${b.slug}: ${r.error.message}`);
  }
  if (!apply) console.log("\nDry run complete. Add --apply to write.");
}

// Deletes the accounts of retired sites. Projects and orders go with them (foreign keys cascade);
// the payment record has no foreign key, so it is removed by order code.
async function retire(db, seed) {
  for (const b of seed.DEMO_SITES.filter((s) => s.retired)) {
    if (!apply) { console.log(`would delete account ${b.email}`); continue; }
    await db.from("processed_payments").delete().eq("order_code", `DEMO-${b.slug.toUpperCase()}`);
    const { error } = await db.from("users").delete().eq("email", b.email).eq("provider", "email");
    console.log(error ? `FAIL ${b.email}: ${error.message}` : `deleted ${b.email}`);
  }
  if (!apply) console.log("\nDry run complete. Add --apply to write.");
}

// A temporary admin so /admin can be opened and photographed; delete it afterwards.
async function admin(db, seed) {
  const email = "demo.admin@nova-demo.test";
  if (flag("remove-admin")) {
    if (!apply) { console.log(`would delete ${email}`); return; }
    const { error } = await db.from("users").delete().eq("email", email).eq("provider", "email");
    console.log(error ? `FAIL: ${error.message}` : `deleted ${email}`);
    return;
  }
  if (!apply) { console.log(`would create admin ${email}`); return; }
  const password = randomBytes(9).toString("base64url");
  const { data: existing } = await db.from("users").select("id").eq("email", email).eq("provider", "email").maybeSingle();
  const row = { email, provider: "email", display_name: "Admin", password_hash: await seed.hashPassword(password), tier: "free", role: "admin", email_verified: true };
  const { error } = existing ? await db.from("users").update(row).eq("id", existing.id) : await db.from("users").insert(row);
  if (error) { console.log(`FAIL: ${error.message}`); return; }
  const previous = existsSync(OUTPUT) ? JSON.parse(readFileSync(OUTPUT, "utf8")) : {};
  writeFileSync(OUTPUT, JSON.stringify({ ...previous, [email]: { password } }, null, 2));
  console.log(`admin ${email} ready; password is in ${OUTPUT}`);
}

main().catch((err) => { console.error(err); process.exit(1); });
