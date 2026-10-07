# Task 006 — Remove Tier C code that stays hidden

- **Status:** Open (after 005)
- **Filed:** 2026-10-07
- **Owner:** Claude Code
- **Severity:** Low (bundle size, maintenance)

Candidates (from `doc/TEST-ROADMAP.md` Tier C, none linked in the UI today): teams/collaboration/comments/activity/presence, custom domains, white-label branding, API keys, notification preferences, symbols, interactions, data binding, CMS, SEO panel, cookie banner, React export, deploy panel; maybe Performance advisor and CSS preview (decide after 005).
Payments are NOT in this list — the owner keeps them (tasks 002, 003).

Before deleting: confirm with the owner, check API routes and DB tables each feature owns, keep migrations. Measure bundle before/after (`build:cf` output size).
