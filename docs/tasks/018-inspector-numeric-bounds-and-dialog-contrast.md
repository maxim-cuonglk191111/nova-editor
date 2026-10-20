# Task 018 — Inspector Numeric Bounds Clamping, Decimal Formatting & High-Contrast Dialog Buttons

- **Status:** Open
- **Filed:** 2026-10-20
- **Owner:** Antigravity / Claude Code
- **Severity:** Medium (Safety & Accessibility: Unbounded margins break canvas layout; localized commas break CSS numbers; low button contrast)

---

## 1. Problem & Root Cause (Report 19/10 Pages 2, 3, 7)

1. **Numeric Input Narrow Width & Decimal Comma vs Dot (Page 2):**
   - **Symptom:** In Style Inspector, numeric inputs are too narrow to view full decimal values (e.g. `letter-spacing: -0.05em`), and Vietnamese locale formats decimals with a comma (`,`) rather than standard CSS dot (`.`), confusing users about the actual value.
   - **Fix:**
     - Standardize decimal inputs to always use dot (`.`) for CSS properties.
     - Increase minimum width of numeric unit inputs or make them auto-expand.
     - Add tooltip displaying full raw value on hover.

2. **Unbounded Style Values & Body Disappearance (Page 7):**
   - **Symptom:** Entering `margin: -99999px` is accepted without validation, throwing the entire body and canvas contents offscreen, leaving a blank canvas. Users panic thinking all data was lost.
   - **Fix:**
     - Enforce sensible min/max bounds in style write helper:
       - `padding`: $\ge 0\text{px}$
       - `margin`: $[-2000\text{px}, 2000\text{px}]$
       - `fontSize`: $[0, 500\text{px}]$
       - `opacity`: $[0, 1]$
       - `zIndex`: $[-9999, 9999]$
     - Add warning indicator when value is clamped or exceeds reasonable range.
     - Add Reset button (`↺`) next to modified property rows in Style Inspector.

3. **Dialog Create Button Contrast (Page 3):**
   - **Symptom:** Create button on page/folder/project creation modals displays light purple/gray text on light purple background, failing WCAG contrast guidelines and looking disabled.
   - **Fix:**
     - Active state: Crisp white `#ffffff` on deep accent `#7c3aed` (WCAG AAA compliant $\ge 4.5:1$).
     - Disabled state: Uniform muted styling across background and text with clear `opacity: 0.5`.

---

## 2. Solution Checklist

- [ ] Update `UnitInput` in `apps/nova-builder/src/builder/StyleSectionRows.tsx`: Enforce dot `.` separator, expand min-width, add title tooltip.
- [ ] Add style bounds clamping and validation in `styleWriteHelper.ts`.
- [ ] Add Reset (`↺`) button to modified style property rows.
- [ ] Fix contrast in `Create` buttons across `NewPageModal`, `SaveProjectDialog`, and `NewSiteModal`.
- [ ] Run `node scripts/i18n-audit.mjs --max=0`.
- [ ] Run `pnpm --filter @nova/builder typecheck`.
- [ ] Verify live in Chrome DevTools MCP.
