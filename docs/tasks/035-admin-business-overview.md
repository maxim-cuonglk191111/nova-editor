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

## Update 2026-10-27 (second pass): numbers changed
- List prices halved: Pro 499,000 -> 249,000; Team 749,000 -> 379,000 (half is 374,500; 379,000 is the nearest price ending in 9). Max unchanged. The 50% welcome offer still applies on top of the list price (Pro first purchase 124,500), so it should be retired or kept on purpose.
- Buyers are now four: VyVy, Ovemo, Mai viết (DEV1), Hùng Lê (DEV2). Nói nhảm is a free account again (`--sales --apply` removes its order and resets the tier). Orders are written at the list price, 249,000.
- Users now 18: the two unused demo accounts, Tabby and Bếp Bà Tư, were deleted with `--retire --apply` (sites marked `retired`, skipped by the seed). Their preview links no longer work.
- /admin: the user list has a checkbox "hide admins and internal test accounts", on by default, same rule as the overview, so both halves of the page say 18. GitHub sign-ups without an email show their login.
- Admin screen now: 18 users (6 new in 7 days), 4 paid (22.2%), 21 projects, revenue 996,000 VND (includes 4 demo orders), 4 orders, average 249,000. Screenshots in `doc/screenshots/.temp/report/` (1-tong-quan-kinh-doanh.png, 2-tat-ca-nguoi-dung.png, Vietnamese UI). The temporary admin was deleted again.

## Update 2026-10-27 (third pass): the four buyers are the four shops
The report table lists VyVy, Ovemo, Tabby and Bếp Bà Tư as the four Pro customers, each "price after 50% discount" 124,500 VND (list 249,000 minus the welcome offer), total 498,000. So the earlier "everything halved" reading was wrong: the 50% welcome offer stays, and orders are written at `promoPrice(list)`.
- Tabby and Bếp Bà Tư were deleted in the previous pass and have been recreated (new preview ids; the passwords handed out earlier were restored with `SEED_PASSWORDS`, which also resets the password of an existing account).
- Mai viết stays as a free account (its order was removed). Hùng Lê and Nói nhảm are retired (deleted) to keep the user count at 18.
- Admin overview now: 18 users, 4 paid (22.2%), 21 projects, revenue 498,000 VND (includes 4 demo orders), 4 orders, average 124,500. Screenshot: `doc/screenshots/.temp/report/tong-quan-kinh-doanh.png`.
