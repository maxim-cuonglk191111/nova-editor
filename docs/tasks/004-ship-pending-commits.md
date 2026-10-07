# Task 004 — Merge and verify pending commits

- **Status:** Done (2026-10-07)
- **Filed:** 2026-10-07
- **Owner:** Claude Code
- **Severity:** Medium

## Result — 8.5/10
- Workers Build for `fd86990` (PR #11 + #12) succeeded; production serves it.
- Checkout prices on production (create-link → SePay): Pro 500.000đ, Max 1.275.000đ, Team 750.000đ, credits 100.000đ. `/api/billing/portal?provider=payos` answers 503 (PayOS not configured) — no UI uses it.
- `scripts/payment-probe.mjs`: 19/19 + new cleanup step, run on a throwaway account (deleted afterwards).
- Golden path `e2e/qa-cloud-journey.spec.ts`: 19/19 steps, 0 console errors (`qa-screenshots/cloud-r22`). Deductions: AI took 144 s (Gemini 524, Mistral 429 — Groq served), generated page thin (4 sections, no contact form), navbar stacks on Mobile P (B14).

## Left over
- QA project "bakery" hero paragraph reads "View Menu" — ask the owner before changing.
- Main working tree `nova-editor` still holds the owner's uncommitted WIP on an old `main` (b21a8cc); stash/commit before `git pull`.
