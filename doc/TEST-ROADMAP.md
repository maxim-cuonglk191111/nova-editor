# Test Roadmap — what we keep, how it is proven, what we cut

Status as of 2026-10-06 (v25.4.1, production `nova-editor.maximi.workers.dev`).

**Rule:** a feature a user can reach must be driven end-to-end by an automated
Playwright spec against the deployed app, with screenshots reviewed and a score
out of 10. A feature that cannot meet that bar is hidden from the UI (code kept,
reversible) until it can. "Opens without console errors" is a smoke signal, not
proof that the feature works.

## Tier A — golden path (must pass on every production deploy)

| # | Area | Spec | Last result |
|---|------|------|-------------|
| G1 | Sign up / log in / log out (email) | `e2e/qa-cloud-journey.spec.ts` 02, 12 | ✅ r21 |
| G1b | Google / GitHub sign-in | manual click-through (needs a real account) + bogus-code callback probe | ✅ manual 2026-10-06 |
| G2 | Projects dashboard: create, open, listed after re-login | journey 03, 04, 12 | ✅ r21 |
| G3 | AI generation (EN and VI prompts, images match subject, 1 h1, no mobile overflow) | journey 05, 06 | ✅ r21 (EN prompt produced VI copy — fixed in 25.4.1, re-verify) |
| G4 | Edit text (Props + double-click inline), style, undo/redo | journey 07, 07b, 07d; `e2e/canvas-edit-nudge.spec.ts` | ✅ |
| G5 | Add / duplicate / delete / navigator drag / canvas nudge / selection indicator | journey 07c–07e; `e2e/canvas-selection.spec.ts` | ✅ |
| G6 | Pages panel, breakpoints (Desktop, Tablet, Mobile L, Mobile P) | journey 07f, 07g | ✅ |
| G7 | Assets upload | journey 07h | ✅ |
| G8 | Save, reload, edits persisted | journey 08, 09 | ✅ |
| G9 | Preview (desktop + mobile), Export HTML | journey 10, 11 | ✅ |
| G10 | Payments — VietQR via SePay (banking apps, MoMo, ZaloPay, ShopeePay) | payment probe: create order → decode QR (NAPAS GUID, BIN, account, amount, description, CRC) → signed SePay webhook → plan/credits granted once → history | ✅ 19/19 checks on production 2026-10-06; a real scan with each wallet is a manual check |
| G10b | Payments — cards, Google Pay, Apple Pay, PayPal via Lemon Squeezy | not testable yet | ⛔ store not configured (needs store id, variant ids, webhook secret) |

Infra checks per deploy: `load-1102` probe (0/150 failures on 2026-10-06), Worker log tail during the run.

## Tier B — kept, functional spec still to write (next, in this order)

Each item gets a spec that performs the action and asserts the result, plus a screenshot review.
If an item fails and the fix is not small, it moves to Tier C.

| # | Feature | Where | Pass criteria |
|---|---------|-------|---------------|
| B1 | Clone / delete / search projects | dashboard card actions | clone appears with same content; delete removes it; search filters |
| B2 | Copy / paste / cut / wrap in box / select parent | canvas context menu, shortcuts | tree changes as expected, undo restores |
| B3 | Export project (.nova) → Import | Export menu | round trip reproduces the page |
| B4 | Language toggle EN ↔ VI | builder topbar, `/settings/language` | UI strings switch, choice persists |
| B5 | Style panel groups: size, spacing, typography, color, border, shadow | right panel | value applied on canvas, preview and export |
| B6 | CSS variables (Tokens) and Custom CSS | left sidebar | variable / rule visible in preview and export |
| B7 | Templates | left sidebar "Tmpl" | inserting a template adds its sections |
| B8 | Version history snapshots | Tools → History | save snapshot, change page, restore |
| B9 | AI Content Fill | Tools | rewrites copy of the page in the requested language |
| B10 | Accessibility check | Tools | lists issues for a page with a known issue (image without alt) |
| B11 | Analytics | dashboard card → Analytics | opening the preview records a view |
| B12 | Form submissions (Leads) | dashboard card → Leads | submitting the preview's contact form shows a row |
| B13 | Forgot / reset password, verify email | auth pages | email actually delivered; if no email provider is configured → Tier C |
| B14 | Mobile navigation of AI pages | AI output | navbar does not wrap into a column on Mobile P |

## Tier C — cut (hidden or not linked; not tested)

| Feature | Reason | State |
|---------|--------|-------|
| Teams, real-time collaboration, comments, activity log, presence | Out of scope (no collaboration) | Builder tabs commented out; `/settings/teams` not linked |
| Custom domains | Needs Cloudflare for SaaS; not workable on Workers Free | `/settings/domains/*` not linked |
| Billing info / invoices page (`/settings/billing`) | Form saved nothing; VietQR receipts come from the bank | Redirects to `/settings/subscription` (25.5.0) |
| White-label branding, API keys, notification preferences | Paid-plan / developer extras; no email sending wired for notifications | Pages not linked |
| Admin console, feature flags | Internal only (403 for normal users — correct) | Not linked |
| Symbols, interactions, data binding, CMS, SEO panel, cookie banner, React export, deploy panel | Already disabled in the UI | Commented out |
| Performance advisor, CSS preview | Low user value; candidates to hide if B-tier time is short | Linked from Tools — decide after B5–B10 |

Follow-up task (not started): delete Tier C code that stays hidden for a full release, to shrink the bundle.

## Cadence

- **Per PR:** typecheck, unit tests, and the e2e specs covering the touched area, run against a local dev server or the preview Worker.
- **Per production deploy:** golden-path journey + `canvas-*.spec.ts` + `feature-smoke.spec.ts` against production; review screenshots; record the score.
- Specs that use the shared QA account must leave its projects unchanged (undo / restore what they edit).
