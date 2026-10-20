# Task 017 — Topbar Action State Management & Contextual Toolbar

- **Status:** Open
- **Filed:** 2026-10-20
- **Owner:** Antigravity / Claude Code
- **Severity:** Medium (Ergonomics: Duplicate & Delete buttons active with no selection, causing user confusion)

---

## 1. Problem & Root Cause (Report 19/10 Page 5)

1. **Topbar Duplicate & Delete Button Ambiguity & Disabled State:**
   - **Symptom:** In `TopbarActions.tsx`, `Duplicate` (`⧉ Duplicate`) and `Delete` (`🗑 Delete`) buttons sit in the global top toolbar. When no element is selected on canvas, they look clickable (active), but clicking them produces zero feedback. Users get confused whether they apply to the page, the layer, or canvas elements.
   - **Root Cause:** The buttons do not bind their `disabled` state to `$selectedInstanceId`.
   - **Fix:**
     - In `TopbarActions.tsx`, subscribe to `$selectedInstanceId`.
     - When `$selectedInstanceId` is null (or root Body is selected without ability to delete body), disable `Duplicate` and `Delete` (`disabled={!canDuplicateOrDelete}` with `opacity: 0.4`, `cursor: not-allowed`).
     - Add contextual tooltip indicating active target (e.g. `Duplicate "Primary Button"` / `Delete "Heading"`).
     - Wire quick duplicate / delete shortcuts to SelectionOverlay bounding box (Contextual Action Toolbar).

---

## 2. Solution Checklist

- [ ] Update `TopbarActions.tsx`: Bind `disabled` and tooltip on `Duplicate` and `Delete` to `$selectedInstanceId`.
- [ ] Ensure non-deletable root Body element is protected.
- [ ] Localize dynamic tooltips in `en` and `vi`.
- [ ] Run `node scripts/i18n-audit.mjs --max=0`.
- [ ] Run `pnpm --filter @nova/builder typecheck`.
- [ ] Verify live in Chrome DevTools MCP.
