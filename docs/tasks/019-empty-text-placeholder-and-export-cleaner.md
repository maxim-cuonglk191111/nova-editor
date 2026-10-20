# Task 019 — Empty Text Element Canvas Placeholder & Clean HTML Export

- **Status:** Closed
- **Filed:** 2026-10-20
- **Completed:** 2026-10-20
- **Owner:** Antigravity / Claude Code
- **Severity:** Medium (WYSIWYG Integrity & SEO: Deleting heading text renders invisible zombie tags on canvas and empty heading tags in export)

---

## 1. Problem & Root Cause (Report 19/10 Pages 8, 10, 11, 12)

1. **Empty Headings Collapsing to Zero Height:**
   - **Symptom:** When a user cleared all text in a heading or paragraph, the element collapsed to 0px height and vanished visually from the canvas, becoming unselectable and leaving empty tags (`<h1></h1>`, `<p></p>`) in exported HTML.
   - **Fix:**
     - On canvas: Added collapse prevention (`min-height: 1.25em !important; min-width: 48px !important; display: inline-block`) and dynamic `::before` placeholder (`"Empty Heading…"` / `"Tiêu đề trống…"`) in `canvasStyles` so cleared text elements remain visible, clickable, and editable. Suppressed placeholders automatically in preview mode.
     - In `htmlExporter.ts`: Cleaned up exported markup by detecting text elements without children and whitespace-only text, omitting empty tags from production HTML output.

---

## 2. Solution Checklist

- [x] In `canvas/page.tsx`: Render localized placeholder and min-height when text instance child is empty.
- [x] In `htmlExporter.ts`: Filter out empty text blocks during export.
- [x] Run `node scripts/i18n-audit.mjs --max=0`.
- [x] Run `pnpm --filter @nova/builder typecheck`.
- [x] Verify live in Chrome DevTools MCP.
