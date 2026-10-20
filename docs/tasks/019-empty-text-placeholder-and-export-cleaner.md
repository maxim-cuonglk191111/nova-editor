# Task 019 — Empty Text Element Canvas Placeholder & Clean HTML Export

- **Status:** Open
- **Filed:** 2026-10-20
- **Owner:** Antigravity / Claude Code
- **Severity:** Medium (WYSIWYG Integrity & SEO: Deleting heading text renders invisible zombie tags on canvas and empty heading tags in export)

---

## 1. Problem & Root Cause (Report 19/10 Pages 8, 10, 11, 12)

1. **Empty Headings Collapsing to Zero Height:**
   - **Symptom:** When a user double-clicks a heading (or paragraph/button), presses `Cmd+A` $\rightarrow$ `Backspace` and clicks out, the element collapses to 0 height and disappears from the canvas. It remains in the Navigator tree, but cannot be clicked or selected on canvas.
   - **Symptom in Export:** The exported HTML contains empty tags like `<h1></h1>` or `<p></p>`, which harms SEO rankings and accessibility audits.
   - **Fix:**
     - On canvas: When text instance value is empty (`""` or whitespace only), render a faint placeholder (`"Nhập tiêu đề…"` / `"Enter heading…"`) with muted italic styling so the element remains visible, clickable, and editable.
     - In `htmlExporter.ts`: Strip empty heading/paragraph elements or warn during export to ensure clean production HTML output.

---

## 2. Solution Checklist

- [ ] In `canvas.tsx` text renderer and `TextEditOverlay.tsx`: Render localized placeholder when text instance child is empty.
- [ ] In `htmlExporter.ts`: Filter out empty text blocks or render a warning during export.
- [ ] Run `node scripts/i18n-audit.mjs --max=0`.
- [ ] Run `pnpm --filter @nova/builder typecheck`.
- [ ] Verify live in Chrome DevTools MCP.
