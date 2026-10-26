# Task 024 — Multi-Page Website Generation & Page Structure from Prompt

- **Status:** Closed (AI output unverified)
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

- [x] Support multi-page detection and page scaffold creation in AI generation workflow.
- [ ] Add Page Presets in Pages Panel for common site structures. **Not done**: out of scope for this change; prompts cover the need.
- [x] Wire navbar links automatically to generated page routes (instruction in every request + `pointNavLinksAtPages` safety net).
- [x] Run `node scripts/i18n-audit.mjs --max=0`.
- [x] Run `pnpm --filter @nova/builder typecheck`.
- [ ] Verify live. **Not done**: the panel is gated in the signed-out demo and there is no AI key here, so only unit/integration tests ran.

## 3. Design (2026-10-26)

- Planning is deterministic and free (`lib/aiSitePlan.ts`); the original idea of an AI planner would have cost a generation before any page existed.
- One `/api/ai` call per page, so each page is small enough for the free-tier token budget and billed only on success. Cost = number of pages generations; the panel says so before Generate.
- Why conservative detection: the built-in examples ("SaaS pricing page … FAQ", "landing page with about, pricing, contact") must remain single pages.
- Open risk: whether real models obey "Build ONLY this page" and the nav hrefs. The base prompt still tells them to use `#anchors`; `pointNavLinksAtPages` covers links whose text names a page, not renamed ones.
