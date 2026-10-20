# Task 021 — Interactive Draggable Image Crop Area

- **Status:** Open
- **Filed:** 2026-10-20
- **Owner:** Antigravity / Claude Code
- **Severity:** Low (Feature Enhancement: Allow users to drag/position the crop selection window up and down)

---

## 1. Problem & Root Cause (Report PDF 1 Page 2)

1. **Static/Rigid Image Crop Area:**
   - **Symptom:** In the image cropping tool modal, the crop selection is centered and rigid; users cannot drag the selection rectangle up or down to align with the desired subject ("kiểu kéo vùng chọn lên xuống để phù hợp với đoạn cần cắt á").
   - **Fix:**
     - Add draggable/resizable crop box in the image cropper component.
     - Allow panning/re-positioning of the crop window with mouse/touch drag handlers.
     - Recalculate aspect-ratio and crop coordinates on save.

---

## 2. Solution Checklist

- [ ] Implement draggable selection area in image crop modal.
- [ ] Support vertical/horizontal drag constraints within image bounds.
- [ ] Run `node scripts/i18n-audit.mjs --max=0`.
- [ ] Run `pnpm --filter @nova/builder typecheck`.
- [ ] Verify live in Chrome DevTools MCP.
