# Task 033 — Tiệm bánh VyVy landing seed, avatar photos, Cloudflare deploy fix

- **Status:** Closed
- **Filed:** 2026-10-27
- **Owner:** Claude Code

## Problem
1. The landing deploy of task 031/032 answered 500 on every dynamic route (home, `/api/*`, `/builder/demo`), static routes were fine. Production was rolled back to the previous version.
2. Seed avatars had lost their photos (initials only) and sites carried Wikimedia credit lines nobody wanted.
3. A new brand, Tiệm bánh VyVy (local bakery, Quy Nhơn), needs an account and a landing page seeded from its profile.

## Root cause (deploy)
Next 15.5 reads `.next/server/middleware-manifest.json` with a runtime `require()` (`getMiddlewareManifest`) whenever it is not in minimal mode. workerd cannot require a path computed at runtime, so the call threw `Dynamic require of "/.next/server/middleware-manifest.json" is not supported`, and Next's error path (which also calls `getMiddleware()`) masked the real response. OpenNext patches `loadManifest` but not this method. The middleware itself runs in OpenNext's separate middleware bundle, so the server function does not need the manifest.

## What was done
- `scripts/patch-open-next-output.mjs`, chained after `opennextjs-cloudflare build` in `build:cf`: replaces the method body with `return null`; fails the build if the expected code is not found exactly once (an upgrade changed it) and is idempotent.
- Verified: patched output served locally with `wrangler dev` (all dynamic routes 200), then deployed (`a65225fb…`) and smoke-tested live: `/`, `/pricing`, `/login`, `/builder/demo`, `/api/promo`, `/api/auth/session`, `/api/projects/demo`, `/api/preview/*`, seeded previews all 200; `/projects` 307 when signed out.
- Seed: avatars use ordinary portraits from Commons again (Khoa, Vy, Nam), credit lines removed; test now asserts avatars have `src` + `name` and that no copy mentions a licence.
- New site `vyvy` (`demo.vyvy@nova-demo.test`): hero with the "fresh cream, sauces cooked from real fruit" line, cake menu with dotted price leaders, two cream cards, snack price tags, who orders, how to order and the refund promise, contact. Text uses only facts from the brand profile.

## Assumptions to confirm with the owner
- "250 300 350" is read as three prices in thousand đồng by cake size; the page says "Mỗi loại có vài mức giá theo cỡ bánh" and names no sizes.
- Photos on the VyVy page are stand-ins from Commons (egg tart, pandan chiffon, croissant, burnt cheesecake), not the shop's own products. Replace before the page goes anywhere public.
- Facebook / TikTok are named but not linked: the profile has no URLs.
- The "keep at least 70% of the cake" request in the profile was left out (it was "once requested", not a policy). The October-2026 cake focus is internal and not shown.

## Acceptance
- `pnpm vitest run seed-demo-projects` 32 passed; seed dry run and `--apply` ok for six sites; live preview of VyVy checked at 1440px and 390px (no horizontal overflow, no broken images, Vietnamese diacritics render).
