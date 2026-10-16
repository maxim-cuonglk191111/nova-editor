# Task 012 — Pages Slug Auto-Generation, Route Collision Validation & Inline Edit Fix

- **Status:** Open
- **Filed:** 2026-10-17
- **Owner:** Antigravity / Claude Code
- **Severity:** High (Routing & Data Integrity: Prevents duplicate `/` routes, auto-generates SEO-friendly slugs, fixes path editing UX)

---

## 1. Problem & Root Cause

1. **Path Defaults to `/` & No Auto-Slug (Report Page 1):** In `apps/nova-builder/src/builder/left-sidebar/pages/index.tsx`, `newPath` is initialized to `"/"`. As the user types `newName` (e.g. "About"), `newPath` remains static `"/"`. If left unedited, creating the page assigns path `"/"`.
2. **Missing Duplicate Validation (Report Page 1):** `usePageCrud.ts` does not check if `path` already exists across other pages. Creating multiple pages with path `"/"` succeeds silently, causing route collisions on publish where the server cannot resolve which page belongs to root `/`.
3. **Double-Click Cannot Edit Path (Report Page 6):** In `PageItem.tsx`, `onBlur={commitEdit}` is attached directly to the `<input>` element of both name and path. When the user double-clicks to edit and attempts to click or tab into the path input, the name input's `onBlur` immediately triggers `setIsEditing(false)` and commits, preventing path edits.
4. **Missing Tooltips on Page Action Icons (Report Page 6):** Small action icons (SEO, Delete, Set as Home) lack proper tooltip descriptions for novice users.

---

## 2. Solution Plan

### A. Auto-Slug Generation & Dynamic Sync
- In `PagesPanel` (`index.tsx`), introduce a flag `isPathManual` (default `false`).
- While `!isPathManual`, typing in `newName` automatically transforms the string via `toSlug(name)` and updates `newPath` to `/${slug}`.
- If the user manually edits `newPath`, set `isPathManual = true` to preserve user intent.

### B. Route Collision Validation & Error Warning
- Before calling `createPage` or `renamePage`:
  - Validate that `path` is unique among all pages in `$pages` (ignoring current page if renaming).
  - If a collision is detected (e.g. attempting to create a second `/` or duplicate `/about`), display an inline warning: *"Đường dẫn này đã tồn tại / Path already exists"* and disable the Create button.

### C. Fix Inline Edit Container Blur
- In `PageItem.tsx`, move `onBlur` to the parent wrapper using `relatedTarget`:
  ```tsx
  onBlur={(e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      commitEdit();
    }
  }}
  ```
- This allows fluid clicking and tabbing between the Name input and the Path input without abruptly closing the editor.

### D. Icon Tooltips & Accessibility
- Ensure all action buttons (`✎`, `⌂`, `SEO`, `×`) have descriptive `title` and `aria-label` localized via `t.sidebar.pages`.

---

## 3. Acceptance Criteria

- [ ] Typing "About Us" in New Page automatically sets path to `/about-us`.
- [ ] Attempting to set path to an existing page path displays an inline validation error and blocks creation.
- [ ] Double-clicking a page item allows seamlessly editing both Name and Path before saving on outside click or Enter.
- [ ] 0 hardcoded strings (`node scripts/i18n-audit.mjs --max=0`).
- [ ] Typecheck passes with 0 errors (`pnpm --filter @nova/builder typecheck`).
