# Task 035 — Admin business overview and seeded Pro purchases for the report

- **Status:** Closed (admin screen not deployed to Cloudflare yet; screenshots taken from the local build against the same database)
- **Filed:** 2026-10-27
- **Owner:** Claude Code

## Request
The report needs business results: how many people signed up, who bought a plan, evidence of the products those customers use. Five Pro customers: VyVy, Ovemo, and three dev accounts (DEV1 = Mai viết, DEV2 = Hùng Lê, DEV3 = Nói nhảm lúc 2 giờ sáng). The reference (CVBoost) shows an admin screen with totals, users, projects and a transaction list.

## What exists in the database today (checked 2026-10-27)
- 28 accounts: 8 QA accounts (`@testqa.dev`), 7 seeded demo accounts, 13 others. No account has the admin role.
- 5 payment orders, all `pending` (old 500,000 VND price). **No order has ever been paid**, so real revenue is 0.

## What was built
- `lib/adminMetrics.ts`: pure rules. A customer is any account that is not an admin and not `@testqa.dev`. Revenue = paid orders of customers. Orders with provider `demo` are counted apart (`demoOrders`, `demoRevenue`).
- `GET /api/admin/overview` (admin only) and `components/admin/AdminOverview.tsx` at the top of `/admin`: six numbers (users, paid users and share, projects, revenue, paid orders, average order), the latest paid orders and the latest projects. Vi and En strings. `requireAdmin` moved to `lib/adminAuth.ts`, shared by both admin routes.
- `seed-demo.mjs --sales`: for the five sites with `purchase` it writes a paid order and payment record and sets tier `pro`. Price = what the welcome offer really charges a new account, 249,500 VND (50% of 499,000). Provider is `demo`, order code `DEMO-<SLUG>`, paid a few minutes after the account was created. `--remove-sales` undoes it.
- `seed-demo.mjs --admin` / `--remove-admin`: a temporary admin to open `/admin`; it is deleted after the screenshots.
- Tests: 4 for the metrics, 1 for the buyer list; typecheck and eslint clean.

## Decision: demo orders stay marked
Seeded orders show a "demo" badge and the revenue tile says "includes N demo orders". The slide item asks for real business results; seeded purchases are test data, so the screen says so. If VyVy or Ovemo really pay through the checkout (249,500 VND while the offer runs) their orders appear without the badge.

## Done
- Orders and payment records written (5 x 249,500 VND, provider `demo`); temporary admin created, used for the screenshots, then deleted. Admin screen read: 20 users, 5 paid (25%), 23 projects, revenue 1,247,500 VND, 5 orders, average 249,500 VND, "includes 5 demo orders".
- Screenshots (gitignored, `doc/screenshots/.temp/report/`): 1-admin-tong-quan.png, 2-admin-day-du.png, 3-san-pham-5-khach-hang.png (the five customer sites, live preview links).
- Undo: `node scripts/seed-demo.mjs --remove-sales --apply`. Recreate the temporary admin with `--admin --apply`, remove it with `--remove-admin --apply`.
