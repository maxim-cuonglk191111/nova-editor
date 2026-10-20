# Task 023 — Canvas Drag & Drop Reparenting Target Snapping & Smooth Nesting

- **Status:** Open
- **Filed:** 2026-10-20
- **Owner:** Antigravity / Claude Code
- **Severity:** High (Core Canvas WYSIWYG Manipulation: Dragging elements into cards and nested containers is sticky/unreliable)

---

## 1. Problem & Root Cause (Report PDF 1 Page 3)

1. **Jittery / Sticky Drag Reparenting ("Elements kéo bị rít"):**
   - **Symptom:** When dragging an element (such as a "Thêm vào giỏ hàng" button) away from a product card and attempting to drag it back, the element refuses to re-enter the card container and instead snaps to an outer section, or requires pixel-perfect aiming to drop.
   - **Root Cause:**
     - In `apps/nova-builder/src/canvas/dragReparent.ts`, candidate parent detection computes bounding rects using strict coordinate points without inner padding or depth weighting.
     - When an element is dragged over a nested container, the parent container or sibling elements intercept pointer events or shadow the target drop zone.
     - Lack of magnetic snapping towards the hovered container interior.
   - **Fix:**
     - In `dragReparent.ts`: Implement depth-first target container resolution (favor innermost valid container under cursor).
     - Add generous drop-zone padding buffer ($\ge 8\text{px}$) around container borders.
     - Display a prominent drop preview placeholder / guide inside the target container during drag.
     - Ensure smooth state transition without pointer event leaks or overlay interference.

---

## 2. Solution Checklist

- [ ] Update container hit-testing in `dragReparent.ts` to prioritize innermost containers.
- [ ] Add drop-zone tolerance padding for small/nested cards.
- [ ] Render visual insertion indicator inside the hovered parent container.
- [ ] Run `node scripts/i18n-audit.mjs --max=0`.
- [ ] Run `pnpm --filter @nova/builder typecheck`.
- [ ] Verify live in Chrome DevTools MCP.
