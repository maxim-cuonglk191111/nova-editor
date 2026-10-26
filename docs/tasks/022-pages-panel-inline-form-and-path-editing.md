# Task 022 — Pages Panel UX: Inline Form Placement, Blur Validation & Dual Inline Edit (Name + Path)

- **Status:** Closed
- **Filed:** 2026-10-20
- **Owner:** Antigravity / Claude Code
- **Severity:** High (Core Site Navigation & UX: Creating and editing pages in Pages sidebar)

---

## 1. Problem & Root Cause (Report 19/10 Pages 6, 14, 19)

1. **Form Position Disconnected from Action Button (Page 6):**
   - **Symptom:** In `PagesPanel.tsx`, when user clicks `+ Page`, the new page creation form pops up at the very bottom of the sidebar list, far away from where the user clicked.
   - **Fix:** Render the creation card inline directly below the active "+ Page" / action trigger or at the top of the pages tree.

2. **Premature Validation & Path Input State (Page 6 & Owner Instruction):**
   - **Symptom:** Ô Path is pre-filled with `/`, immediately triggering red error text `"Root path / is reserved for the home page"` before the user has typed anything.
   - **Fix (Owner Rule):** When Page Name is empty (`!name.trim()`), disable or blur the Path input with reduced opacity (`opacity: 0.5`, `cursor: not-allowed`) and a subtle placeholder (e.g. `/path-auto-generated`), rather than showing a red error while allowing typing. Once user types the name, the Path field activates and auto-generates the slug. Validation checks (route collision, root reservation) only execute on `blur` or `submit`.

3. **Inability to Edit Path via Inline Edit (Page 19):**
   - **Symptom:** Double-clicking a page item in the list enables editing the page Name, but the URL Path remains uneditable or locked.
   - **Fix:** Allow seamless inline editing of both Name and Path with tab switching and blur validation.

4. **Action Icon Size & Tooltips (Page 19):**
   - **Symptom:** Action icons in page row (Rename, Make Home, Delete, SEO) are small and lack helpful tooltips explaining their purpose.
   - **Fix:** Increase hit targets ($\ge 28\text{px}$) and ensure descriptive localized tooltips on hover.

---

## 2. Solution Checklist

- [x] Place "+ Page" creation card directly adjacent to the trigger button.
- [x] Disable/blur Path input when Page Name is empty (`disabled={!name.trim()}`); auto-populate slug as Name is typed.
- [x] Defer collision and format validation to `onBlur` or `onSubmit`.
- [x] Enable dual inline editing (Name + Path) in `PageItem.tsx`.
- [x] Enhance action icons with clear tooltips and accessible touch targets.
- [x] Run `node scripts/i18n-audit.mjs --max=0`.
- [x] Run `pnpm --filter @nova/builder typecheck`.
- [x] Verify live in Chrome DevTools MCP.

## 3. Notes

- Add actions moved to the panel header; form opens under them (`NewPageForm.tsx`, rules in `pagePathRules.ts`).
- Dual inline edit (Name + Path) already existed; the gap was that a taken path closed the editor silently. It now stays open with a message.
- Verified with Playwright + system Chrome on `/builder/demo`: path empty+disabled on open, `/about-us` from "About us", `/` flagged on blur, duplicate flagged on submit, inline path edit rejects `/` and accepts `/company`; console clean. "Chrome DevTools MCP" itself was not used.
