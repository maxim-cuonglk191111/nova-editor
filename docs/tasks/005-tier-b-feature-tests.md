# Task 005 — Tier B feature specs: test, screenshot, score — or cut

- **Status:** Open
- **Filed:** 2026-10-07
- **Owner:** Claude Code
- **Severity:** High (owner principle)

Principle (owner, 2026-10-06): the app has many features; cut what is not needed; whatever stays must actually work — proven by our own test run, screenshots and a score, not by "opens without errors".

Work through `doc/TEST-ROADMAP.md` Tier B in order, one Playwright spec per item against production (shared QA account: every spec must undo what it changes):

B1 clone/delete/search projects · B2 copy/paste/cut/wrap/select-parent · B3 export → import `.nova` · B4 language toggle · B5 style groups applied in canvas/preview/export · B6 CSS vars + custom CSS · B7 templates insert · B8 version history snapshot/restore · B9 AI content fill · B10 accessibility check · B11 analytics records a preview view · B12 form submission appears in Leads · B13 forgot/reset password + verify email (needs an email provider; none → cut) · B14 AI page navbar on Mobile P (currently wraps into a column).

Also: make the SePay probe (`scripts/payment-probe.mjs`) clean up after itself so G10 can run on every deploy.

For each item: pass → add row to `doc/VERIFIED.md` with score; fail with a small fix → fix + PR; fail otherwise → hide it (move to Tier C) and say so.
Smoke evidence already collected: `e2e/feature-smoke.spec.ts` (all pages/panels open, no console errors except `/admin*` 403 for non-admin — expected).
