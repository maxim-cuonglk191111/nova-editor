# Nova Builder — Working Conventions & Architecture Rules

This file defines the engineering standards, architecture invariants, and quality gates for `nova-editor`. It inherits the high-taste, task-driven standards from `C:\Users\Administrator\Code Github\CLAUDE.md` while codifying the critical runtime invariants of Nova Builder.

---

## 1. Task Workflow & Execution

We follow the **Task-Driven Protocol** (`docs/tasks/NNN-*.md`):
- **Sequential Numbering:** Tasks live in `docs/tasks/` (e.g., `010-demo-product-parity-locks.md`) and are indexed in `docs/tasks/README.md`. Numbers are never reused.
- **Scope Scaling:**
  - **Quick Fix / 1–3 Tasks:** Lean format (Problem → Root Cause → Solution Checklist).
  - **Full Milestone / Refactor:** Comprehensive spec with acceptance criteria, E2E plan, and non-regression checks.
- **Single Source of Truth:** Finish one task before starting the next. Never leave half-finished code scattered across modules.
- **No AI Attribution:** No `Co-Authored-By:`, no `Claude-Session:`, no "Generated with AI", no robot emojis in commit messages or PRs.

---

## 2. Architectural Invariants (Non-Negotiable)

- **ADR-NB-001 (WebstudioData Schema):** Normalized Maps (`$instances`, `$styles`, `$props`, etc.), `schemaVersion: "5.0+"`. Never mutate to an array-based `Element[]` tree.
- **ADR-NB-003 (`/canvas` Route Public):** The `/canvas` route is rendered inside the builder iframe and **must always remain public** (no session cookie, no auth redirect in `middleware.ts`). Communication with builder chrome is strictly via `__webstudioSharedSyncEmitter__`.
- **ADR-NB-005 (AI Credit Deductions):** AI credits are deducted **only after** `validateCompositionWS` passes. Never charge credits on validation failure or API error.
- **ADR-NB-022 (Unified Builder Surface — Zero JSX Branching on `isDemo`):**
  - **Demo is 100% UI identical to Product.** Never write `isDemo ? <StrippedUI> : <FullUI>` in builder chrome (`Topbar`, `LeftSidebar`, `RightPanel`, `Canvas`).
  - Gating must happen at the **Action Interceptor layer** (`withCapabilityGate` / `FeatureGateModal`), not by hiding buttons or ripping out menus.
- **Persisted Shapes Go First:** DB schemas, serialized formats, and API contracts must land their migration/schema version before or in the same commit as consuming code.

---

## 3. Mandatory CI Quality Gates

Before any commit or merge to `main`, all checks must pass locally with **zero errors**:

```bash
# 1. Type safety
pnpm --filter @nova/builder typecheck

# 2. Linting & formatting
pnpm --filter @nova/builder lint

# 3. Unit & Integration tests
pnpm test

# 4. SOLID audit (0 blocking violations)
pnpm solid:audit

# 5. Next.js production build
pnpm --filter @nova/builder build

# 6. Cloudflare OpenNext Workers build — CRITICAL DEPLOY GATE
pnpm --filter @nova/builder build:cf
```

> [!CAUTION]
> **Why `build:cf` is mandatory:** `next build` and the Cloudflare Workers bundler (`opennextjs-cloudflare`) have different runtimes. A bundle can pass `next build` locally but fail silently on Cloudflare Dashboard if it imports Node-only APIs at module root or declares `export const runtime = "edge"`. Always verify `build:cf` passes before pushing!

---

## 4. Verification & Testing Protocol (>9/10 Quality Gate)

We enforce a **Dual-Tier Verification Architecture**: Playwright and Chrome DevTools MCP serve distinct, complementary roles. **Neither is discarded.**

### A. Tier 1 — Interactive Agent Turn: Chrome DevTools MCP (`chrome-devtools`)
- **When to use:** Every UI task involving visual state transitions, canvas modifications, modals, popovers, or styling.
- **Workflow:**
  1. Boot dev server on port 3001 (`pnpm --filter @nova/builder dev`).
  2. Launch / connect via `new_page({ url: "http://localhost:3001/builder/demo" })`.
  3. Inspect a11y tree via `take_snapshot` to discover actionable element `uid`s.
  4. Capture **pre-interaction baseline** screenshot via `take_screenshot`.
  5. Trigger user interaction (`click`, `hover`, `type_text`, `wait_for`).
  6. Capture **post-interaction state** screenshot and analyze layout, typography, glassmorphism, and contrast using vision.
  7. Audit console via `list_console_messages` to ensure **zero unhandled exceptions or 401 errors**.
  8. Close page via `close_page` and terminate dev server cleanly.

### B. Tier 2 — Automated CI & Regression: Playwright (`@playwright/test`)
- **When to use:** Automated test runs in local terminal (`pnpm test:e2e`), pre-push git hooks, and headless CI pipelines.
- **Why it stays:** CI pipelines cannot run an interactive LLM driving agentic tool loops. Playwright provides deterministic, headless pass/fail gates in seconds without human or token overhead.
- **Rules:** Every core user journey (smoke, demo parity, auth gates) must have an accompanying Playwright spec in `e2e/*.spec.ts`.

### C. Screenshot Storage Management & Auto-Pruning
To prevent git bloat and excessive disk usage from visual evidence:
- **Location:** `doc/screenshots/` stores active visual proof linked in `doc/VERIFIED.md`.
- **Budget Caps:** Maximum **30 MB** total storage / **25 active files**.
- **Auto-Prune Utility:** Run `pnpm prune:screenshots` (`node scripts/prune-screenshots.mjs`).
  - Scans `doc/VERIFIED.md` and active task files in `docs/tasks/*.md`.
  - Automatically unlinks unreferenced screenshots first, followed by oldest closed task snapshots when exceeding budget.
- **Temporary Debug Captures:** Place transient debug images in `doc/screenshots/.temp/` (enforced as gitignored).

---

## 5. SOLID Coding Standards

- **Single Responsibility (S):** One editor file per property group; one React component per visual job; UI separated from write paths.
- **Open / Closed (O):** Extend behavior through registry maps (`FN_CFG`, `DEDICATED`, `ComponentRegistry`), not sprawling `if/else` chains.
- **Liskov Substitution (L):** Panel components share standard props contract (`{ instanceId: string; currentCss: string }`).
- **Interface Segregation (I):** Focused, small prop interfaces; no grab-bag `Record<string, unknown>`.
- **Dependency Inversion (D):** Builder components talk only to Nanostores atoms and write-path abstractions (`updateData`, `transactions.ts`), never calling Supabase or REST APIs directly.

---

## 6. Key File Locations

| Purpose | File / Directory |
|---|---|
| Builder Entry | `apps/nova-builder/src/app/builder/[projectId]/page.tsx` |
| Canvas Entry | `apps/nova-builder/src/canvas/canvas.tsx` |
| Nanostores Atoms | `apps/nova-builder/src/lib/nano-states.ts` & `lib/data-stores.ts` |
| Single Write-Path & Undo | `apps/nova-builder/src/lib/transactions.ts` & `lib/history.ts` |
| Topbar & Actions | `apps/nova-builder/src/builder/Topbar.tsx` & `TopbarActions.tsx` |
| Style Inspector | `apps/nova-builder/src/builder/StyleInspector.tsx` |
| Left Sidebar Panels | `apps/nova-builder/src/builder/left-sidebar/` |
| AI Panels | `apps/nova-builder/src/builder/AIPanel.tsx` & `AIContentPanel.tsx` |
| Active Tasks | `docs/tasks/` & `docs/tasks/README.md` |
| Verified Ledger | `doc/VERIFIED.md` |
