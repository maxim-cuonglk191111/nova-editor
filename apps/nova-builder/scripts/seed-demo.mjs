#!/usr/bin/env node
// Seed the demo accounts, each owning one finished project, and print the public preview link
// of every project.
//
//   cd apps/nova-builder
//   node scripts/seed-demo.mjs                       dry run: build + validate, write nothing
//   node scripts/seed-demo.mjs --apply               create / refresh the accounts and projects
//   node scripts/seed-demo.mjs --apply --base https://your-site.example
//   node scripts/seed-demo.mjs --cleanup --apply     delete the demo accounts (projects cascade)
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

  // Compatibility check: the exact path /api/preview takes (migrate, then serialize).
  const prepared = seed.DEMO_SITES.map((b) => {
    const schema = seed.buildProjectSchema(b, now);
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

main().catch((err) => { console.error(err); process.exit(1); });
