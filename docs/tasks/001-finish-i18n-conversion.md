# Task 001 — Finish i18n conversion (no hard-coded UI text)

- **Status:** In progress
- **Filed:** 2026-10-07
- **Owner:** Claude Code
- **Severity:** High (owner request: "make i18n default, code is too hard-coded")

## State
- Branch `qa/i18n` (pushed), commit `1064909` "wip(i18n)…", worktree `C:\Users\Administrator\Code Github\nova-editor-i18n`, based on main `be7e843`.
- 94 files converted by a background agent that stopped on a usage limit. New per-area dictionaries: `lib/i18n/locales/{en,vi}/{admin,chrome,dashboard,inspector,sidebar,site,tools}.ts` + `types-*.ts`, `lib/i18n/format.ts`.
- `scripts/i18n-audit.mjs` added (`pnpm i18n:audit --max=N`). On the branch: **67 hard-coded strings left in 5 files**; typecheck **0 errors**.
- NOT yet done: lint, unit tests, browser check of EN/VI screenshots, Vietnamese wording review.

## Remaining
1. Rebase `qa/i18n` on current main (main moved: billing/SePay, canvas fixes) and resolve conflicts.
2. Convert the 5 remaining files — the billing UI was deliberately skipped: `components/PayOSCheckoutModal.tsx` (all Vietnamese, hard-coded), `app/settings/subscription/page.tsx` (+ `history`), `app/settings/billing/page.tsx`, `app/pricing/page.tsx`, `lib/plans.ts` feature labels. The modal copy must say the QR can be paid from banking apps, MoMo, ZaloPay and ShopeePay.
3. `pnpm --filter @nova/builder typecheck`, `lint`, `cd apps/nova-builder; npx vitest run`.
4. Dev server + Playwright: dashboard, builder (Tools menu + a left panel open), login, subscription + checkout modal — screenshot EN and VI. EN shows no Vietnamese chrome, VI no leftover English chrome. Review every screenshot.
5. Add `pnpm i18n:audit --max=<count>` to CI (`ci.yml`) and ratchet to 0.
6. PR → merge → run `e2e/feature-smoke.spec.ts` + golden path on production in both locales.

## Done when
Audit count 0 (or an agreed allow-list), both locales screenshot-reviewed on production, CI guards it.
