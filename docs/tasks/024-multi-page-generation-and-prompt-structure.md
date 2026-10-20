# Task 024 — Multi-Page Website Generation & Page Structure from Prompt

- **Status:** Open
- **Filed:** 2026-10-20
- **Owner:** Antigravity / Claude Code
- **Severity:** High (AI Generation & Site Architecture: Full multi-page websites vs single landing page)

---

## 1. Problem & Root Cause (Report PDF 1 Page 3)

1. **AI Generator Limited to Single Landing Page:**
   - **Symptom:** When a user prompts for a full website with multiple pages (e.g., "Tạo website bán hàng có trang chủ, danh sách sản phẩm, chi tiết sản phẩm và thanh toán"), the AI generator only creates a single landing page (`/`). The user expects multi-page structure in the Pages panel (`Home`, `Products`, `Product Detail`, `Checkout`).
   - **Root Cause:**
     - AI prompt planner (`packages/ai/src/planner.ts` and `compose.ts`) only outputs a single page instance tree.
     - Project data store initializes only `page-home`.
     - In the builder, there is no easy way to trigger AI generation for secondary subpages.
   - **Fix:**
     - Multi-page Planner: Detect multi-page intent in user prompt; propose and create entries in `$pages` with appropriate routes (`/`, `/products`, `/checkout`).
     - Allow generating or switching active page context in AI Panel so secondary pages can be populated with relevant sections.
     - Add 1-click Page Presets in Pages Panel (`Shop`, `About`, `Contact`, `Pricing`) with pre-configured routes and layouts.

---

## 2. Solution Checklist

- [ ] Support multi-page detection and page scaffold creation in AI generation workflow.
- [ ] Add Page Presets in Pages Panel for common site structures.
- [ ] Wire navbar links automatically to generated page routes.
- [ ] Run `node scripts/i18n-audit.mjs --max=0`.
- [ ] Run `pnpm --filter @nova/builder typecheck`.
- [ ] Verify live in Chrome DevTools MCP.
