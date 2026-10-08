# Task 007 — Builder feature audit: works + easy for a non-technical user

- **Status:** In progress (batches 1–2 of 5 done; batch 3 running in parallel)
- **Filed:** 2026-10-07
- **Owner:** Claude Code
- **Severity:** High (owner principle: if a feature exists, it must work well)

The prompt below is meant to be pasted as the opening message of a session.

---

Audit every feature a user meets inside a project in nova-editor (production https://nova-editor.maximi.workers.dev), for two things: **does it work** and **can a non-technical user figure it out without help**. Work in the `nova-editor-qa` worktree on a branch from `origin/main`; merge fixes via PR; reply in Vietnamese.

**Rules**
- One Playwright spec per area under `e2e/builder-audit/`, against production, using `e2e/helpers/fresh-account.ts` (throwaway account + seeded AI page; never touch `qa.cloud.1791213340319@testqa.dev`). UI in English (the default).
- For each feature: perform the real user action, assert the result (canvas DOM, saved project via `GET /api/projects/<id>`, preview, export), screenshot before/after, **look at every screenshot**, then give two scores /10: **Works** and **Ease of use**. Ease of use means: can a first-time user find the control, understand its label/icon, see feedback that something happened, and undo it.
- Skip a feature only if it already scores ≥ 8 in `doc/TEST-ROADMAP.md` / `doc/VERIFIED.md` **and** its code has not changed since (state the commit you checked). Re-test everything else.
- Target: every visible feature ≥ 8 on both scores. Below 8: fix it if the fix is small (≤ ~1 h), re-run, re-score. Otherwise hide it (move to Tier C in `doc/TEST-ROADMAP.md`) and say so. A feature that exists must work well.
- Do it yourself, sequentially. If you use background agents, supervise them: check their screenshots every ~10 min and stop any agent that is stuck.
- Per batch: typecheck, lint, unit tests, `pnpm --filter @nova/builder build:cf` before pushing; after merge, wait for the Workers Build, then re-run the touched specs on production.

**Feature list (cover all of it)**
1. **Canvas** — hover outline, click select, selection label, breadcrumb in the footer, select parent; drag-and-drop on canvas (reorder within a section, move into another container, small nudge = no move); resize handles if shown; double-click inline text edit (Enter commits, Escape cancels); right-click context menu (copy, cut, paste, duplicate, wrap in box, select parent, delete); keyboard shortcuts (⌘C/⌘X/⌘V/⌘D, Delete, ⌘Z/⌘⇧Z, ⌘K command palette).
2. **Left sidebar** — Add/Components (find a component, drag it onto the canvas, click-to-insert), Pages (add, rename, set home, delete, switch page), Layers/Navigator (expand, select, rename, drag to reorder/nest, context menu), Assets (upload, pick into an Image, delete), Tokens/CSS Vars, Custom CSS, Templates (insert, community/bundles). Panel resize and collapse.
3. **Right panel** — Style tab: every group (layout/flex/grid, size, spacing, position, typography, background, border, shadow, transform, transition, animation, filter, gradient, grid tracks/placement), states (:hover etc.), breakpoint-specific values, units, clearing a value; Props tab for each common component (Heading tag, Link href/target, Image src/alt/library, Button, Form fields); Settings tab.
4. **Top bar** — breakpoints (Desktop/Tablet/Mobile L/Mobile P) and the breakpoint manager (⚙), zoom −/+, Export menu (HTML, .nova export, import), Tools menu (AI Content Fill, Accessibility, Performance, History, Grid guides, CSS preview), Preview, Save (dialog, Update, Save As), autosave chip, Generate with AI (new page and "change this section").
5. **Feedback & safety** — toasts, empty states, loading states, error messages (e.g. offline save), undo after every destructive action, unsaved-changes guard on leaving.

**Report** (end of each batch): a table Feature | Works /10 | Ease /10 | Evidence (screenshot names) | Fix or decision; update `doc/TEST-ROADMAP.md`, `doc/VERIFIED.md`, this task file and `doc/CHANGELOG.md`; bump the version per `CLAUDE.md`.

## Progress

Specs: `e2e/builder-audit/` (shared helpers in `audit.ts`), runner `scripts/audit-run.ps1` (loads the Supabase cleanup keys, production by default).
Skip check: Tier B code (B2, B3, B5–B10) unchanged since `40b1666` (v25.7.0 only removed `LangToggle`), but Tier B scored Works only — Ease is scored again here.

- **Batch 1 — Canvas (v25.8.0):** every item ≥ 8 after fixes. Found on production: resize had no effect (Image inline width/height), links/images could not be dragged (native drag), Style panel showed the previous element's values, images squashed on phones, delete gave no feedback. Fixed; verified locally; production re-run after deploy. SOLID audit: 6 blocking, all pre-existing large files (none introduced).
- **Batch 1 production check:** `canvas.spec.ts` passes on production 25.8.0 (PR #20).
- **Batch 2 — Left sidebar (v25.9.0):** all ≥ 8 after fixes. Found: components always inserted into the home page and needed a double-click; no way to set the home page and rename only by double-click; selecting in Layers / inserting a template never scrolled the canvas (`data-ws-selector` lookup); unused assets deleted permanently without a prompt; panel resize stopped over the canvas; **CSS vars / custom CSS were never autosaved** while the chip said "All changes saved", and the Save button never returned to "Saved". Hidden (Tier C): CSS Variables + Custom CSS tabs, template bundles / publish / community.
- **Batch 3 — Right panel:** run in parallel by a background agent in worktree `nova-editor-right` (branch `qa/builder-audit-right`), merged after review.
