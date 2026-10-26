# Task 026 — Builder Error Boundary & React Void-Element Crash (#137)

- **Status:** Closed
- **Filed:** 2026-10-20
- **Owner:** Antigravity / Claude Code
- **Severity:** Critical (Stability: Prevents whole-builder crash screens during editing)

---

## 1. Problem & Root Cause (Report PDF 1 Page 4)

**Correction:** the original diagnosis said React error #310 (hook order). The screenshot in `nova-request.pdf` page 4 reads `Minified React error #137 … args[]=img`: **an `<img>` was given children.** No hook ordering is involved.

- `Image`, `Input`, `Checkbox`, `RadioButton`, `Separator` render void elements. `nestingGuard` and `treeMove.canAcceptChildren` only knew the text-only components (the list was duplicated in both files), so these accepted children.
- The crash surfaced as the whole canvas document being replaced by `global-error`.

## 2. Solution Checklist

- [x] `nestingGuard.VOID_COMPONENTS` + `acceptsChildren`; `treeMove.canAcceptChildren` delegates (one list).
- [x] Panel drop "into" a non-container lands beside it (`insertComponent`).
- [x] Canvas renderer ignores children of void components, so already-saved projects load.
- [x] `SectionErrorBoundary` around the canvas tree, with Try again / Reload view; resets when data changes.
- [x] Unit tests (`nesting-void.test.ts`).
- [x] typecheck, lint, i18n-audit, tests pass.
- [ ] **Not verified live:** I could not trigger #137 on the old code through the Components-panel drag or the on-canvas drag of an existing button, so the before/after is unit-test + code-reading only. If it recurs, capture the exact steps.
