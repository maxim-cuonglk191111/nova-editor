# Task 004 — Merge and verify pending commits

- **Status:** Open
- **Filed:** 2026-10-07
- **Owner:** Claude Code
- **Severity:** Medium

`qa/ai-template` is ahead of main with `bd43c7b` (one VND price list for every checkout path; payments back in the golden path) and the commit adding these task files.

1. Typecheck + `build:cf` validation (Workers Build runs it), PR → merge.
2. Production: `/api/billing/portal?provider=payos&plan=pro` uses 500,000đ; payment probe still 19/19; golden path journey green.

Also outstanding (housekeeping):
- QA project "bakery" (shared account `qa.cloud.1791213340319@testqa.dev`, also used by the owner): hero paragraph reads "View Menu" — origin unclear (owner edit with the old broken inline editor, or a test). Ask before changing.
- Main working tree `nova-editor` has the owner's uncommitted WIP on `main`; it must be stashed/committed before `git pull` (main is now PRs #1–#10 ahead).
