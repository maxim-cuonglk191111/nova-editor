# Task 017 — Topbar Action State Management & Contextual Toolbar

- **Status:** Closed
- **Filed:** 2026-10-20
- **Completed:** 2026-10-20
- **Owner:** Antigravity / Claude Code
- **Severity:** Medium (Ergonomics: Duplicate & Delete buttons active with no selection, causing user confusion)

---

## 1. Problem & Root Cause (Report 19/10 Page 5)

1. **Topbar Duplicate & Delete Button Ambiguity & Disabled State:**
   - **Symptom:** In `Topbar.tsx`, `Duplicate` (`⧉ Duplicate`) and `Delete` (`🗑 Delete`) buttons sit in the global top toolbar. When no element is selected on canvas or when the root Body is active, they looked clickable, but clicking them produced zero feedback.
   - **Root Cause:** The buttons did not bind their `disabled` state and tooltips to the active instance and whether the element can be duplicated/deleted.
   - **Fix:**
     - In `Topbar.tsx`, bound `disabled`, `opacity: 0.35`, and `cursor: not-allowed` to `canDuplicateOrDelete` (`Boolean(selectedId && !isRoot)`).
     - Added dynamic contextual tooltips informing the user of the active target (e.g. `Duplicate "Heading" (Ctrl+D)`, `Delete "Heading" (Del)`, or `Page body cannot be deleted or duplicated`).
     - Added `ContextualToolbar.tsx` inside the canvas selection overlay to display quick Duplicate (`⧉`) and Delete (`🗑`) actions right on the selected element's bounding box.
     - Wired direct postMessage bridge (`nova:duplicate`, `nova:delete`) in `useCanvasMessages.ts`.

---

## 2. Solution Checklist

- [x] Update `Topbar.tsx`: Bind `disabled` and tooltip on `Duplicate` and `Delete` to `$selectedInstanceId`.
- [x] Ensure non-deletable root Body element is protected.
- [x] Localize dynamic tooltips in `en` and `vi`.
- [x] Add `ContextualToolbar.tsx` with duplicate and delete buttons on element bounding box.
- [x] Run `node scripts/i18n-audit.mjs --max=0`.
- [x] Run `pnpm --filter @nova/builder typecheck`.
- [x] Verify live in Chrome DevTools MCP.
