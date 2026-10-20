# Task 018 — Inspector Numeric Bounds Clamping, Decimal Formatting & High-Contrast Dialog Buttons

- **Status:** Closed
- **Filed:** 2026-10-20
- **Completed:** 2026-10-20
- **Owner:** Antigravity / Claude Code
- **Severity:** Medium (Safety & Accessibility: Unbounded margins break canvas layout; localized commas break CSS numbers; low button contrast)

---

## 1. Problem & Root Cause (Report 19/10 Pages 2, 3, 7)

1. **Numeric Input Narrow Width & Decimal Comma vs Dot (Page 2):**
   - **Symptom:** In Style Inspector, numeric inputs were too narrow (52px) to view full decimal values, and typing commas in decimal numbers broke CSS interpretation.
   - **Fix:**
     - In `UnitInput.tsx`, standardized decimal inputs with real-time comma-to-dot sanitization (`.replace(/,/g, '.')`).
     - Expanded minimum width to 58px / 100% width.
     - Added title tooltip displaying full raw value and unit on hover.

2. **Unbounded Style Values & Body Disappearance (Page 7):**
   - **Symptom:** Entering `margin: -99999px` threw body contents offscreen into oblivion.
   - **Fix:**
     - Enforced bounds clamping in `clampNumericStyleValue()` across `styleWriteHelper.ts` and `styleInspectorWrite.ts`:
       - `margin`: $[-2000\text{px}, 2000\text{px}]$
       - `padding`: $\ge 0\text{px}$
       - `fontSize`: $[0, 500\text{px}]$
       - `opacity`: $[0, 1]$
       - `zIndex`: $[-9999, 9999]$
       - `letterSpacing`: $[-20\text{px}, 50\text{px}]$
     - Replaced `×` button with Reset (`↺`) icon next to modified style property rows in `StyleSectionRows.tsx`.

3. **Dialog Create Button Contrast (Page 3):**
   - **Symptom:** Create buttons on page/folder creation forms displayed light purple text (`#c4b5fd`) on translucent purple background, failing WCAG contrast guidelines.
   - **Fix:**
     - High-contrast active state: Crisp white `#ffffff` on `#7c3aed` (`rgb(124, 58, 237)`), meeting WCAG AAA standard ($\ge 4.5:1$).
     - Disabled state: Uniform subtle opacity (`0.5`) with muted border and text.

---

## 2. Solution Checklist

- [x] Update `UnitInput` in `apps/nova-builder/src/builder/StyleSectionRows.tsx`: Enforce dot `.` separator, expand min-width, add title tooltip.
- [x] Add style bounds clamping and validation in `styleWriteHelper.ts`.
- [x] Add Reset (`↺`) button to modified style property rows.
- [x] Fix contrast in `Create` buttons across `NewPageModal`, `SaveProjectDialog`, and `NewSiteModal`.
- [x] Run `node scripts/i18n-audit.mjs --max=0`.
- [x] Run `pnpm --filter @nova/builder typecheck`.
- [x] Verify live in Chrome DevTools MCP.
