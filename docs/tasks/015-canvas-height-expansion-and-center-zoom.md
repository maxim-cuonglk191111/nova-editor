# Task 015 — Canvas Artboard Full-Height Expansion & Center Zoom

- **Status:** Open
- **Filed:** 2026-10-20
- **Owner:** Antigravity / Claude Code
- **Severity:** High (Core WYSIWYG Usability: Content trapped in artificial scroll area; canvas zoom pushes content offscreen)

---

## 1. Problem & Root Cause

1. **Content Trapped in Artificial Scroll Area (Report 19/10 & Image 3):**
   - **Symptom:** As seen in screenshot `media_1792488777743_27d754b5.png`, canvas content is constrained within a short inner container with an inner scrollbar on the right, leaving large empty unused vertical space below instead of expanding to fill the height or matching natural content length.
   - **Root Cause:**
     - In `apps/nova-builder/src/app/builder/[projectId]/page.tsx`, the iframe is given a hardcoded height `calc(100vh - 112px)` while outer `canvasAreaRef` has `overflow: auto`.
     - In `apps/nova-builder/src/canvas/canvas.tsx`, the body/html has fixed viewport or clipping rules (`height: 100%`, `overflow-y: scroll`) inside the iframe.
     - When zoomed or framed, the iframe creates a nested viewport scrollbar instead of allowing seamless artboard display.
   - **Fix:**
     - Inside `/canvas`: Remove artificial `overflow-y: scroll` on canvas body in edit mode; let document height reflect content or fill `minHeight: 100vh`.
     - In `apps/nova-builder/src/app/builder/[projectId]/page.tsx`: Dynamically adjust artboard wrapper to expand and fill available height without trapping content in a tiny scroll area.
     - Forward height sync message from canvas iframe (`resize` observer) or set iframe `min-height: calc(100vh - 48px)` with unified single scroll container.

2. **Canvas Zoom Origin (Report 19/10 Page 9):**
   - **Symptom:** When zooming canvas to 210% (Ctrl + mouse wheel or zoom controls), the canvas zooms from top-left, displacing main page content outside the visible viewport.
   - **Root Cause:** Zoom scale is applied with `transformOrigin: "top center"` or top-left without pan/scroll compensation for cursor position.
   - **Fix:** Set `transformOrigin: "top center"` and calculate scroll compensation so the center of the viewport or cursor remains anchored during zoom in/out.

3. **Canvas Empty Area Click Deselect (Report PDF 1 Page 4):**
   - **Symptom:** Clicking outside elements on the canvas background does not deselect the active element; designers cannot view the clean design without active bounding boxes.
   - **Fix:** In `initPointerSelection.ts` or `canvas.tsx`, add click handler on canvas root / artboard background to reset `$selectedInstanceId.set(null)` when clicking outside any selectable element.

---

## 2. Solution Checklist

- [ ] Inspect and fix iframe / body height constraints so canvas content expands naturally to fill vertical space without nested scrollbars.
- [ ] Implement cursor/center-anchored zoom in `page.tsx` wheel event handler.
- [ ] Implement click-outside deselect on canvas backdrop in `pointerSelection.ts`.
- [ ] Run `node scripts/i18n-audit.mjs --max=0`.
- [ ] Run `pnpm --filter @nova/builder typecheck`.
- [ ] Verify live in Chrome DevTools MCP.
