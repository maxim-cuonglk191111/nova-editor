# Task 013 — Desktop Canvas Artboard Framing & Viewport Squeeze Prevention

- **Status:** Open
- **Filed:** 2026-10-17
- **Owner:** Antigravity / Claude Code
- **Severity:** High (Core WYSIWYG Integrity: Fixes canvas viewport being squeezed below standard Desktop dimensions when sidebars are expanded)

---

## 1. Problem & Root Cause (Report Page 4)

1. **Fluid Squeezing of Desktop Viewport:**
   - In `apps/nova-builder/src/app/builder/[projectId]/page.tsx`, `canvasMaxWidth` is computed as:
     ```tsx
     const canvasMaxWidth = selectedBreakpoint?.maxWidth ? `${selectedBreakpoint.maxWidth}px` : "100%";
     ```
   - In Webstudio/Nova breakpoint schema, the **Desktop** breakpoint is the base breakpoint and has `maxWidth: undefined`.
   - Consequently, `canvasMaxWidth` evaluates to `"100%"`.
   - When Left Sidebar (`~260px`) and Right Inspector (`~280px`) are both open on a 1440px or 1280px laptop display:
     - The center canvas area is squeezed to `~700px - 850px`!
     - The canvas iframe layout collapses into a mobile/tablet-like column width.
     - Designers see header text wrapping awkwardly, hero sections breaking, and think their design is corrupted, when in reality the canvas is being artificially constrained.

---

## 2. Solution Plan

### A. Desktop Artboard Base Width
- Desktop breakpoint should represent a genuine desktop screen width:
  - Standard Desktop artboard width: `1280px` (or configurable in breakpoint manager, minimum `1200px`).
  - Instead of `canvasMaxWidth = "100%"`, use a defined base desktop width (e.g. `1280px` or `min(100%, 1280px)` with fit-zoom).

### B. Auto-Fit Scaling or Horizontal Canvas Scroll
- When available container space between sidebars is smaller than `1280px`:
  - Provide an automatic **Fit to Width** toggle or scale the canvas cleanly using the existing `scale(zoom)` transform (e.g. scaling down proportionally so the 1280px layout stays completely intact without media-query triggering premature mobile styles).
  - Alternatively, keep `1280px` fixed and allow horizontal panning/scrolling, preserving exact desktop media queries (`@media (min-width: 1024px)`).

### C. Visual Non-Regression
- Verify with Chrome DevTools MCP: Desktop breakpoint renders true 1280px artboard with zero Hero text wrapping or button clipping.

---

## 3. Acceptance Criteria

- [ ] Canvas in Desktop mode retains standard desktop artboard width ($\ge 1200\text{px}$) instead of shrinking to available sidebar deficit.
- [ ] Responsive text and hero sections render as true desktop layouts without premature wrapping.
- [ ] Fit-to-screen zoom button works seamlessly to fit 1280px canvas into narrower viewports.
- [ ] Tested and verified with Chrome DevTools MCP visual captures.
