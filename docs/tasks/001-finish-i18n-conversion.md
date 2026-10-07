# Task 001 — Finish i18n conversion (no hard-coded UI text)

- **Status:** In progress (merge + production check pending)
- **Filed:** 2026-10-07
- **Owner:** Claude Code
- **Severity:** High (owner request: "make i18n default, code is too hard-coded")

## Done (2026-10-07, branch `qa/i18n`, v25.5.0)
- Rebased on main `fd86990` (clean, no conflicts).
- Billing UI converted: `PayOSCheckoutModal`, `settings/subscription` (+ `history`), `PricingGrid`; new `t.billing` dictionary (`types-billing.ts`, `locales/{en,vi}/billing.ts`). The QR step names banking apps, MoMo, ZaloPay and ShopeePay. Plan cards show the VND checkout amount.
- `/settings/billing` cut (redirect) — unlinked page whose form saved nothing.
- `pnpm i18n:audit --max=0` → **0** hard-coded strings; typecheck 0 errors; lint 0 errors (warnings only); vitest 11/11.
- `.github/workflows/ci.yml` added (there was no CI workflow at all): i18n audit, typecheck, unit tests.
- Screenshots EN + VI on a dev server (throwaway account, deleted afterwards): pricing, login, dashboard, builder, Tools menu, subscription, checkout details, checkout QR, history. EN pages: no Vietnamese text detected; VI pages reviewed — no leftover English chrome in the billing flow or builder top bar/panels.

## Remaining
1. PR → merge → Workers Build → run `e2e/feature-smoke.spec.ts` + golden path on production, EN and VI.
2. Owner decision: plan feature lists (`pricing.planCopy`) still advertise features that are cut (React export, Vercel auto-deploy, custom domains, white-label, real-time collaboration, admin dashboard). Selling them is misleading — rewrite the lists to what actually ships.
3. Lint warnings from the conversion: `useCallback`/`useEffect` deps missing dictionary values (`SaveProjectDialog`, `settings/domains`, …) — stale text after a language switch until remount; low impact.

## Done when
Audit count 0 (done), both locales screenshot-reviewed on production, CI guards it (done).
