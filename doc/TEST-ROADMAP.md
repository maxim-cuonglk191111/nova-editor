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

## Tier B — kept, functional specs (`e2e/tier-b/`, throwaway account + seeded page)

Each item gets a spec that performs the action and asserts the result, plus a screenshot review.
If an item fails and the fix is not small, it moves to Tier C.

| # | Feature | Where | Pass criteria | Last result (spec `e2e/tier-b/`) |
|---|---------|-------|---------------|------|
| B1 | Clone / delete / search projects | dashboard card actions | clone appears with same content; delete removes it; search filters | ✅ 8/10 |
| B2 | Copy / paste / cut / wrap in box / select parent | canvas context menu, shortcuts | tree changes as expected, undo restores | ✅ 8/10 — props + styles kept on paste/duplicate, ⌘X (25.6.0) |
| B3 | Export project (.nova) → Import | Export menu | round trip reproduces the page | ✅ 8/10 — import saves into the open project (25.6.0) |
| B4 | UI language (English default) | Settings → Display Language only (25.7.0) | UI strings switch, choice persists | ✅ 8/10 — toggle persists (25.6.0) |
| B5 | Style panel groups: size, spacing, typography, color, border, shadow | right panel | value applied on canvas, preview and export | ✅ 8/10 |
| B6 | CSS variables (Tokens) and Custom CSS | left sidebar | variable / rule visible in preview and export | ✅ 8/10 — CSS vars in export (25.6.0) |
| B7 | Templates | left sidebar "Tmpl" | inserting a template adds its sections | ✅ 8/10 — templates append (25.6.0); canvas does not scroll to the new section |
| B8 | Version history snapshots | Tools → History | save snapshot, change page, restore | ✅ 8/10 — restore reloads (25.6.0) |
| B9 | AI Content Fill | Tools | rewrites copy of the page in the requested language | ✅ 8/10 — provider fallback; copy rewritten in Vietnamese (25.6.0) |
| B10 | Accessibility check | Tools | lists issues for a page with a known issue (image without alt) | ✅ 8/10 — answers in ~20 s (25.6.1); AI suggestion often falls back to the default text |
| B11 | Analytics | dashboard card → Analytics | opening the preview records a view | ✅ 8/10 — page path recorded (25.6.0) |
| B12 | Form submissions (Leads) | dashboard card → Leads | submitting the preview's contact form shows a row | ✅ 8/10 |
| B13 | Forgot / reset password, verify email | auth pages | email actually delivered; if no email provider is configured → Tier C | ✅ 8/10 — Brevo delivers reset + verify mails to Gmail; verify link works signed in (25.6.0) |
| B14 | Mobile navigation of AI pages | AI output | navbar does not wrap into a column on Mobile P | ✅ 9/10 — two compact rows on phones (25.6.0) |

## Builder audit (task 007, `e2e/builder-audit/`) — Works / Ease of use

Every feature a user meets inside a project, scored twice. Target ≥ 8 on both; below that it is fixed or hidden (Tier C).
Run: `pwsh scripts/audit-run.ps1 e2e/builder-audit/<area>.spec.ts` (production by default; `BASE_URL` overrides).

| Area | Spec | Result |
|------|------|--------|
| 1 Canvas — hover, select, label, breadcrumb, parent, drag reorder / into container / nudge, resize, inline edit, context menu, shortcuts, ⌘K, drag-off delete | `canvas.spec.ts` | ✅ all ≥ 8 on production 25.8.0 (fixed: resize, link/image drag, stale Style-panel inputs, image distortion, delete + Undo toast) |
| 2 Left sidebar — components, pages, layers, assets, templates, resize/collapse | `left-sidebar.spec.ts` | ✅ all ≥ 8 on production 25.9.0 / 25.10.0 (click-to-insert on the open page, set home page, scroll to selection, asset delete confirm, resize over canvas, autosave of CSS vars/custom CSS); CSS Vars, Custom CSS, template community/bundles hidden (Tier C) |
| 3 Right panel — every Style group, states, breakpoints, units, clear value, Props, Settings | `right-panel.spec.ts` | ✅ all ≥ 8 on production 25.10.0 and 25.11.0 (incl. Advanced effects group, plain state names, form settings) |
| 4 Top bar — toolbar, breakpoints + manager, zoom, export/import, tools, preview, save dialog, autosave, Generate with AI | `top-bar.spec.ts` | ✅ production 25.11.0: all ≥ 8 after fixes (breakpoint manager crash, import not saved, save race, Update leaving the editor, stacked tool panels, glyph buttons); Performance + CSS Preview hidden (Tier C). ✅ Generate with AI 8/8 on production 25.12.0 (Groq fallback model; shared free quota is a known limit) |
| 5 Feedback & safety — toasts, empty/loading/error states, undo, offline save, unsaved-changes guard | `feedback-safety.spec.ts` | ✅ production 25.11.0: all ≥ 8 after fixes (unsaved-changes guard added, missing-project page) |

## Tier C — cut (hidden or not linked; not tested)

| Feature | Reason | State |
|---------|--------|-------|
| Teams, real-time collaboration, comments, activity log, presence | Out of scope (no collaboration) | Builder tabs commented out; `/settings/teams` not linked |
| Custom domains | Needs Cloudflare for SaaS; not workable on Workers Free | `/settings/domains/*` not linked |
| Billing info / invoices page (`/settings/billing`) | Form saved nothing; VietQR receipts come from the bank | Redirects to `/settings/subscription` (25.5.0) |
| White-label branding, API keys, notification preferences | Paid-plan / developer extras; no email sending wired for notifications | Pages not linked |
| Admin console, feature flags | Internal only (403 for normal users — correct) | Not linked |
| Symbols, interactions, data binding, CMS, SEO panel, cookie banner, React export, deploy panel | Already disabled in the UI | Commented out |
| Performance advisor, CSS preview | Scores without fixes a site owner can act on; raw CSS | Hidden from Tools 25.11.0 (task 007 batch 4) |
| Form Action URL / Method, breakpoint media condition, autofocus/pattern/id on fields | HTML plumbing that breaks the form or page when edited | Hidden from Settings / breakpoint manager 25.11.0; stored values still apply |
| CSS Variables, Custom CSS panels | Work, but developer tools a non-technical user cannot use unaided (task 007 ease 4/10) | Rail tabs hidden 25.9.0; saved values still render and export |
| Template bundles export/import, Publish to community, Community list | Public sharing without moderation; empty list; "bundle" jargon | Hidden in Templates 25.9.0 (`SHOW_COMMUNITY`) |

Follow-up task (not started): delete Tier C code that stays hidden for a full release, to shrink the bundle.

## Cadence

- **Per PR:** typecheck, unit tests, and the e2e specs covering the touched area, run against a local dev server or the preview Worker.
- **Per production deploy:** golden-path journey + `canvas-*.spec.ts` + `feature-smoke.spec.ts` against production; review screenshots; record the score.
- Specs that use the shared QA account must leave its projects unchanged (undo / restore what they edit).
