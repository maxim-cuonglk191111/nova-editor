# Task 013 — Desktop Canvas Artboard Framing & Viewport Squeeze Prevention

- **Status:** Closed
- **Filed:** 2026-10-17
- **Resolved:** 2026-10-17
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
  - Standard Desktop artboard width: `1280px` (`const DESKTOP_CANVAS_WIDTH = 1280`).
  - Instead of `canvasMaxWidth = "100%"`, use standard base desktop width (`1280px`).

### B. Auto-Fit Scaling & Screen Framing
- When available container space between sidebars is smaller than `1280px`:
  - Canvas automatically computes `fitZoom = Math.min(1, containerWidth / targetWidth)` and applies `scale(fitZoom)`.
  - Added dedicated Fit button (`⊡`) in Topbar zoom controls and wired to `Ctrl+Shift+1`.
  - Scaled wrapper adjusts horizontal/vertical margins proportionally (`margin: calc(W * (zoom-1)/2)`) so ghost scrollbars are eliminated.
  - Artboard styled with modern elevated drop shadow (`box-shadow: 0 10px 30px -5px rgba(0,0,0,0.15)`), rounded corners, and padding.

### C. Visual Non-Regression
- Verified with Chrome DevTools MCP: Desktop breakpoint renders true 1280px artboard with zero Hero text wrapping or button clipping.

---

## 3. Acceptance Criteria

- [x] Canvas in Desktop mode retains standard desktop artboard width ($\ge 1200\text{px}$) instead of shrinking to available sidebar deficit.
- [x] Responsive text and hero sections render as true desktop layouts without premature wrapping.
- [x] Fit-to-screen zoom button (`⊡`) and `Ctrl+Shift+1` work seamlessly to fit 1280px canvas into narrower viewports.
- [x] Switching between breakpoints dynamically auto-fits to available screen width (e.g. 100% on Mobile, proportional fit on Desktop).
- [x] 0 hardcoded strings (`node scripts/i18n-audit.mjs --max=0`).
- [x] Typecheck passes with 0 errors (`pnpm --filter @nova/builder typecheck`).
- [x] Visual verification via Chrome DevTools MCP completed and recorded in `doc/screenshots/09-desktop-artboard-framing.png`.
