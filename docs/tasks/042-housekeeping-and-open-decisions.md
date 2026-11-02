# Task 042 — Housekeeping and open decisions after tasks 029–041

- **Status:** Open
- **Filed:** 2026-11-02
- **Owner:** Claude Code (items marked **owner** need a decision or an action only the owner can take)
- **Severity:** Low to Medium

A list of loose ends so none of them lives only in a chat. Each line says what it is and what closes it.

| # | Item | Who | Closes when |
|---|------|-----|-------------|
| 1 | **Unused new-landing code.** `components/landing/{LandingHero,HeroMockup,doodles,landingStyles,landingMotion,icons}` and their tests are not rendered any more (the old landing is back, task 036). `icons.tsx` is still used by `PricingGrid`. | owner decides | Delete the unused files, or keep them for a later redesign (then say where it is linked). |
| 2 | **Live specs updated for the AI tab but not run**: `builder-audit/ai-tools.spec.ts`, `top-bar.spec.ts`, `gp-logged-in.spec.ts`, `qa-cloud-journey.spec.ts`. | Claude | Run each with `pwsh scripts/audit-run.ps1 <spec>` against production and record the result in `doc/VERIFIED.md` (they spend AI quota: ≥ 1 min apart). |
| 3 | **Vercel project `nova-editor-apps`** (deploys every PR, no environment variables, API answers 500) and the orphan alias `nova-editor-chi.vercel.app` (a different database). Production is Cloudflare. | owner | Disconnect or delete the Vercel project, or add the env vars on purpose. Until then PR checks there are noise. |
| 4 | **Known red specs.** `feature-smoke.spec.ts` hangs (15 min timeout); `canvas-selection.spec.ts` fails on live QA project data (failed at baseline too). | Claude | Each either fixed or marked skipped with the reason in the file header. |
| 5 | **Task 027 — real VietQR account** for production payments (deferred by the owner). Until then the first-purchase prices and the checkout are tested with the test-mode flow and seeded `demo` orders only. | owner provides the account | Task 027 resumed. |
| 6 | **`mailto:support@nova.build`** in the footers and the legal pages is not verified to exist. | owner | Confirm the mailbox, or replace it. |
| 7 | ~~`doc/pricing-policy.md` described the older price table~~ | Claude | **Done 2026-11-02:** VND table and the first-purchase rule added to `doc/pricing-policy.md`. `doc/SPEC.md` pricing lines still to be checked. |
| 8 | **Stray empty folder `C:\ADMINI~1`** at the root of drive C, created by a mistyped path in an agent session (its file was deleted; the safety check would not remove the folder). | owner | `rmdir "C:\ADMINI~1"` in a terminal. |
| 9 | **Seeded demo data** (task 032/035): 5 accounts (Mai viết, Tabby, Bếp Bà Tư, VyVy, Ovemo), 4 orders with provider `demo`, assets in the Supabase `assets` bucket under `seed/`. Their passwords are in the gitignored `.seed-demo-output.json` on one machine. | owner | Decide how long they stay; `node scripts/seed-demo.mjs --remove-sales --apply` and `--cleanup --apply` undo them. |
| 10 | **Real orders.** The database has no paid order of a real customer yet (5 older orders are `pending`). The report's "real results" slide depends on real payments. | owner | VyVy and Ovemo (or others) pay through the checkout; their orders appear without the "demo" badge. |

## Acceptance
Every row is either done, deleted from this table with a one-line reason, or has an owner and a date. Review again when task 038 starts.
