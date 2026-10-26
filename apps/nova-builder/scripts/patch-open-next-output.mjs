#!/usr/bin/env node
// Runs right after `opennextjs-cloudflare build` (see the build:cf script).
//
// Next's server reads `.next/server/middleware-manifest.json` with a runtime require() whenever it
// is not in minimal mode, and does so on every request that reaches getMiddleware(). Workers cannot
// require() a path computed at runtime, so on Next 15.5 every dynamic route answered 500 with
// "Dynamic require of /.next/server/middleware-manifest.json is not supported" (static routes were
// fine). The adapter patches loadManifest() but not this one.
//
// The middleware itself is not lost: OpenNext bundles it separately (.open-next/middleware) and
// runs it in the worker before the server function. So the server function has nothing to read,
// and getMiddlewareManifest() can return null, exactly what minimal mode does.
//
//   node scripts/patch-open-next-output.mjs        patches .open-next in place; fails if the
//                                                  expected code is gone (an upgrade changed it)

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const handler = join(root, ".open-next/server-functions/default/apps/nova-builder/handler.mjs");

const BEFORE = "getMiddlewareManifest(){return this.minimalMode?null:require(this.middlewareManifestPath)}";
const AFTER = "getMiddlewareManifest(){return null}";

if (!existsSync(handler)) {
  console.error(`patch-open-next-output: ${handler} not found. Run opennextjs-cloudflare build first.`);
  process.exit(1);
}

const source = readFileSync(handler, "utf8");
if (source.includes(AFTER)) {
  console.log("patch-open-next-output: already patched");
  process.exit(0);
}
if (source.split(BEFORE).length !== 2) {
  console.error(
    "patch-open-next-output: getMiddlewareManifest() was not found exactly once. " +
      "Next or the adapter changed; check whether the require is still there before deploying.",
  );
  process.exit(1);
}
writeFileSync(handler, source.replace(BEFORE, AFTER));
console.log("patch-open-next-output: getMiddlewareManifest() no longer requires the manifest at runtime");
