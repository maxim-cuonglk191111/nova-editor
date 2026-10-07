# Tasks

One line per task. Numbers are never reused. Working principle for every task:
**a feature we keep must be driven end-to-end on production by an automated spec,
screenshotted, reviewed and scored /10; a feature we cannot make work is hidden
(cut), not left half-working.** See `doc/TEST-ROADMAP.md`.

| # | Task | Status |
|---|------|--------|
| [001](001-finish-i18n-conversion.md) | Finish i18n conversion (branch `qa/i18n`) incl. billing UI | Merged #13 (v25.5.0); prod check pending |
| [002](002-sepay-go-live.md) | SePay VietQR go-live: real account, webhook, wallet scans | Blocked (owner input) |
| [003](003-google-pay-lemon-squeezy.md) | Cards / Google Pay / Apple Pay via Lemon Squeezy | Blocked (owner input) |
| [004](004-ship-pending-commits.md) | Merge and verify pending `qa/ai-template` commits | Done |
| [005](005-tier-b-feature-tests.md) | Tier B feature specs (B1–B14): test, screenshot, score or cut | Done — all 14 at >= 8/10 |
| [006](006-cut-tier-c-code.md) | Remove Tier C code that stays hidden | Open |
| [007](007-builder-feature-audit.md) | Builder feature audit: works + ease of use, every feature >= 8/10 | Open |
