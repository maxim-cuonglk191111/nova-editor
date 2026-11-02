# Task 042 — Housekeeping and open decisions after tasks 029–041

- **Status:** Open
- **Filed:** 2026-11-02
- **Owner:** Claude Code (items marked **owner** need a decision or an action only the owner can take)
- **Severity:** Low to Medium

A list of loose ends so none of them lives only in a chat. Each line says what it is and what closes it.

| # | Item | Who | Closes when |
|---|------|-----|-------------|
| 1 | ~~Unused new-landing code~~ | owner decided | **Done 2026-11-02:** `LandingHero`, `HeroMockup`, `doodles`, `landingStyles`, `landingMotion` and the five photos under `public/images/landing` deleted (recoverable from git history, commit before this one). `icons.tsx` stays (used by the pricing grid and the header). The unused `landing.*` strings of the new copy are still in the dictionaries. |
| 2 | **Live specs updated for the AI tab.** Run on production 2026-11-02: `ai-tools.spec.ts` passed; `top-bar.spec.ts` passed its AI step ("AI tab: start over with a new page; undo brings the old one back") and failed one unrelated step, "autosave chip and Save button agree" (it expects the word "Saving" to be visible right after an edit; looks like timing, not checked against the baseline). `gp-logged-in.spec.ts` and `qa-cloud-journey.spec.ts` not run yet. | Claude | Investigate the autosave step (fix the wait or file a defect), run the two remaining specs, record in `doc/VERIFIED.md`. |
| 3 | **Vercel project `nova-editor-apps`** (deploys every PR, no environment variables, API answers 500) and the orphan alias `nova-editor-chi.vercel.app` (a different database). Production is Cloudflare. | owner | Disconnect or delete the Vercel project, or add the env vars on purpose. Until then PR checks there are noise. **Postponed by the owner (2026-11-02): no action yet.** |
| 4 | **Known red specs.** `feature-smoke.spec.ts` hangs (15 min timeout); `canvas-selection.spec.ts` fails on live QA project data (failed at baseline too). | Claude | Each either fixed or marked skipped with the reason in the file header. |
| 5 | **Task 027 — real VietQR account** for production payments (deferred by the owner). Until then the first-purchase prices and the checkout are tested with the test-mode flow and seeded `demo` orders only. | owner provides the account | Task 027 resumed. |
| 6 | **`mailto:support@nova.build`** in the footers and the legal pages is not verified to exist. | owner | Confirm the mailbox, or replace it. **Postponed by the owner (2026-11-02): no action yet.** |
| 7 | ~~`doc/pricing-policy.md` described the older price table~~ | Claude | **Done 2026-11-02:** VND table and the first-purchase rule added to `doc/pricing-policy.md`. `doc/SPEC.md` pricing lines still to be checked. |
| 8 | **Stray empty folder `C:\ADMINI~1`** at the root of drive C, created by a mistyped path in an agent session (its file was deleted; the safety check would not remove the folder). | owner | `rmdir "C:\ADMINI~1"` in a terminal. |
| 9 | **Seeded demo data** (task 032/035): 5 accounts (Mai viết, Tabby, Bếp Bà Tư, VyVy, Ovemo), 4 orders with provider `demo`, assets in the Supabase `assets` bucket under `seed/`. Their passwords are in the gitignored `.seed-demo-output.json` on one machine. | owner | Decide how long they stay; `node scripts/seed-demo.mjs --remove-sales --apply` and `--cleanup --apply` undo them. |
| 10 | **Real orders.** The database has no paid order of a real customer yet (5 older orders are `pending`). The report's "real results" slide depends on real payments. | owner | VyVy and Ovemo (or others) pay through the checkout; their orders appear without the "demo" badge. |

## Acceptance
Every row is either done, deleted from this table with a one-line reason, or has an owner and a date. Review again when task 038 starts.
