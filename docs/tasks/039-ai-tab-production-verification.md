# Task 039 — AI tab verified on production with real providers

- **Status:** Closed (2026-11-02)
- **Filed:** 2026-11-02
- **Owner:** Claude Code
- **Verifies:** task 037 (AI chat tab); finds go to task 041

## What was asked
"Make sure it works by testing the flows and taking screenshots", after the first deploy of the tab (version 25.17.0, Cloudflare).

## What was run
1. **Local, answers by the test** (no quota): `e2e/builder-audit/ai-panel.spec.ts` (11 flows: open from the rail and the ✦ button, starters, chips, Apply + Ctrl+Z, Discard, widen scope, Retry, guest, Stop, model picker, reload + history, start over) and `ai-panel-flows.spec.ts` (9 flows: edit + style, remove, replace, insert with one h1, hover outline, a stale proposal, axe, keyboard, 1024px, Vietnamese). Screenshots in `doc/screenshots/.temp/ai-flows/`.
2. **Production, real providers, demo account, nothing applied** (Mai viết's blog): element, section and page requests each returned a proposal (Groq, 9 s / 11 s / 21 s); every proposal was Discarded so the demo site is untouched.
3. **Production, real providers, temporary project** (created and deleted through the API, so the admin numbers did not move): generate a bakery page → Apply; rewrite the heading → Apply → Ctrl+Z; add a testimonials section → Apply (4 → 5 sections, still one h1) → Ctrl+Z; reload (3 user messages and the saved page back). 10 of 10 checks.
4. **Production spec for the repo**: `e2e/builder-audit/ai-panel-live.spec.ts` (`pwsh scripts/audit-run.ps1 e2e/builder-audit/ai-panel-live.spec.ts`): throwaway `@testqa.dev` account and the seeded Da Lat coffee landing page; edit + Ctrl+Z, a section restyle (Discard), a testimonials section + Ctrl+Z, reload, start over with a bakery page + Ctrl+Z. Passed in 3.1 min; screenshots `qa-screenshots/builder-audit/ai01…ai09`, one sheet in `doc/screenshots/28-ai-tab-production.png`.
5. **Server rules**: `src/lib/__tests__/ai-chat-route.test.ts` (13): validation, a denied gate costs nothing, credits only after a valid answer and from the right balance, at most two new sections, failure paths charge nothing (ADR-NB-005).

## Found and fixed
| Finding | Fix |
|---------|-----|
| Apply button: white on green, about 2.5:1 (axe `color-contrast`) | darker green `#047857` (5.5:1) |
| Error message text in the danger red on its tinted background (axe `color-contrast`) | text in the normal colour, the red kept for the "!" mark and the Retry button |
| Chat history menu used `listbox` / `option` around buttons (axe `nested-interactive`) | a plain list; `aria-current` marks the open chat |
| First-run tour still read "Click here to describe a change — AI rewrites your design instantly" and covered the rail, hiding the AI tab on a real project | new copy in English and Vietnamese ("Open the AI tab… nothing happens until you press Apply") |
| Seed module over the 400-line SOLID threshold (from the VyVy / Ovemo seeds) | split into `seed/builders.ts` and `seed/sites/*`, output verified identical |

## Found, not fixed (filed in task 041)
- After Apply then Ctrl+Z the card still says "Applied".
- Whole-page generation: one run took 132 s and ended in `502 temporarily unavailable` while the free quota was busy; a run a minute later succeeded. Retry on the error card works.
- The proposal line for a new section shows the model's brief cut at 80 characters.
- At 1024 px the top bar overflows (the ✦ button is cut off); the AI tab itself stays usable. Part of task 038.

## Not covered
Dark theme of the tab, Safari/Firefox, multi-user history (task 040), the four live specs updated for the tab (task 042, item 2).
