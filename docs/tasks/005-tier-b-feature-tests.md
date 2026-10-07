# Task 005 — Tier B feature specs: test, screenshot, score — or cut

- **Status:** Done (2026-10-07)
- **Filed:** 2026-10-07
- **Owner:** Claude Code
- **Severity:** High (owner principle)

Principle (owner, 2026-10-06): the app has many features; cut what is not needed; whatever stays must actually work — proven by our own test run, screenshots and a score, not by "opens without errors".

Work through `doc/TEST-ROADMAP.md` Tier B in order, one Playwright spec per item against production (shared QA account: every spec must undo what it changes):

B1 clone/delete/search projects · B2 copy/paste/cut/wrap/select-parent · B3 export → import `.nova` · B4 language toggle · B5 style groups applied in canvas/preview/export · B6 CSS vars + custom CSS · B7 templates insert · B8 version history snapshot/restore · B9 AI content fill · B10 accessibility check · B11 analytics records a preview view · B12 form submission appears in Leads · B13 forgot/reset password + verify email (needs an email provider; none → cut) · B14 AI page navbar on Mobile P (currently wraps into a column).

Also: make the SePay probe (`scripts/payment-probe.mjs`) clean up after itself so G10 can run on every deploy.

For each item: pass → add row to `doc/VERIFIED.md` with score; fail with a small fix → fix + PR; fail otherwise → hide it (move to Tier C) and say so.
Smoke evidence already collected: `e2e/feature-smoke.spec.ts` (all pages/panels open, no console errors except `/admin*` 403 for non-admin — expected).

## Progress (2026-10-07)
Specs in `e2e/tier-b/` (throwaway account + seeded recorded AI page; `e2e/helpers/fresh-account.ts`). Probe cleanup done. Scores in `doc/TEST-ROADMAP.md` / `doc/VERIFIED.md`.
- Pass: B1 8, B5 8, B10 7, B11 7, B12 8.
- Fixed in 25.6.0, re-run needed: B4 (toggle persistence), B9 (provider fallback), B13 (Brevo email + verify-email redirect; real-inbox delivery check).
- Open bugs: B2 (paste/duplicate drop props + styles, ⌘X unbound — fix outlined in the agent report: copy props/style sources with the subtree), B14 (AI header needs mobile-breakpoint styles — `validateCompositionWS` + `applyWSComposition` "mobile" breakpoint).
- Not run yet: B3, B6, B7, B8.

## Result (2026-10-07, production v25.6.1)
All 14 Tier B specs pass on production (`e2e/tier-b/`, throwaway accounts): B1–B13 8/10, B14 9/10. Fixed on the way: paste/duplicate lost props + styles and ⌘X was unbound (B2), import Update 500 (B3), locale toggle not persisted (B4), CSS vars missing from export (B6), templates replaced the page (B7), restore needed a manual reload (B8), single-provider AI routes (B9, B10) and a 2-minute a11y wait (B10), analytics path (B11), no email provider → Brevo (B13), header stacking on phones (B14).
Known small gaps (not blocking 8/10): template insert does not scroll the canvas to the new section; a11y AI suggestion often falls back to default text; dashboard cards have no thumbnails.
