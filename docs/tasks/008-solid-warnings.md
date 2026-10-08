# Task 008 — Resolve the 21 SOLID audit warnings

- **Status:** Open
- **Filed:** 2026-10-08
- **Owner:** Claude Code
- **Severity:** Low (no blocking violations left; CLAUDE.md requires WARN items to be scheduled)

After task 007 split the six files over 700 lines, `pnpm solid:audit` reports 0 blocking and 21 warnings: files between 400 and 700 lines (S1), props types with more than five fields (I1, e.g. `SaveProjectDialog`), and duplicated helpers (D1, e.g. `getSupabaseAdmin` in `db-folders.ts` and `supabase-server.ts`).

Work through them one area per PR, behaviour unchanged, with the area's `e2e/builder-audit/*` spec green before and after.
