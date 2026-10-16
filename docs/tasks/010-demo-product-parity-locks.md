# Task 010 — Demo & Product 100% UI Parity with Capability Gate / Lock System

- **Status:** Closed
- **Filed:** 2026-10-16
- **Completed:** 2026-10-17
- **Owner:** Antigravity / Claude Code
- **Severity:** High (Core UX & Conversion Funnel: Eliminates UI waste, fixes 401 unhandled errors on demo, ensures zero divergence between Demo and Logged-in Product)

---

## 1. Problem & Root Cause

1. **Bifurcated UI Anti-Pattern:** `TopbarActions.tsx` previously used a conditional fork `{isDemo ? <stripped UI> : <full UI>}`. As features evolved on the logged-in product, the demo branch was neglected, hiding the **Export** menu, **Tools** menu (Accessibility, History, Grid Guides), and **Deploy** button completely from anonymous visitors.
2. **Unhandled 401 Errors:** On Demo, clicking "Save", "Upload Asset", or running AI prompts makes requests directly to authenticated endpoints (`/api/projects`, `/api/assets`, `/api/ai`), producing ugly 401 error toasts ("Create failed", "Upload failed") instead of a pleasant conversion experience.
3. **Broken Navigation:** In `Topbar.tsx`, the back button `←` navigates to `/projects`. For an unauthenticated demo visitor, `middleware.ts` intercepts this and abruptly bounces them to `/login?callbackUrl=/projects`.
4. **Data Loss Risk:** `useUnsavedChangesGuard` was explicitly disabled for `isDemo`, so refreshing or closing the tab immediately wipes out user work without any warning or invitation to save to an account.

---

## 2. Architectural Decision (ADR-NB-022)

- **Zero JSX Branching on `isDemo`:** The builder chrome (`Topbar`, `LeftSidebar`, `RightPanel`, `Canvas`) renders the exact same unified component tree for both Demo and Product.
- **Capability Gate Interceptor:** Actions requiring an account or Pro tier are intercepted via a centralized `withCapabilityGate` handler, opening a unified `FeatureGateModal` instead of throwing raw API errors or hiding buttons.
- **Draft Handover:** Changes in Demo are continuously mirrored to `localStorage["nova-demo-draft"]`. When an anonymous user signs up via the gate modal, their demo project is automatically transferred into their new account.

---

## 3. Implementation Batches

### Batch 1 — Unify Builder Chrome (Zero UI Forking)
- Refactor `TopbarActions.tsx` to eliminate the `isDemo ? ... : ...` fork. Render one single toolbar containing:
  - Zoom controls
  - **Export ▾** menu (Export HTML, Export .nova, Import .nova, Deploy)
  - **Tools ▾** menu (AI Content Fill, Accessibility, History, Grid Guides)
  - **Preview** button
  - **Save** button (label: "Save" / "Lưu vào Cloud")
  - **✦ Generate** button
- In `Topbar.tsx`, update the back button `←`: when `isDemo`, route to `/` (home) or prompt to confirm leaving if changes are unsaved.

### Batch 2 — Feature Gate Modal & Interceptor System
- Create `src/builder/FeatureGateModal.tsx` and nanostores atom `$featureGateModal`.
- Support gate variants:
  - `save`: "Lưu trang web vào tài khoản miễn phí" → CTA `Đăng ký miễn phí` (`/signup`).
  - `export-html`: "Xuất mã nguồn HTML/CSS sạch chuẩn SEO (Gói Pro)" → CTA `Nâng cấp Pro` (`/pricing`).
  - `deploy`: "Xuất bản 1-click lên Cloudflare Pages / Vercel" → CTA `Nâng cấp Pro` (`/pricing`).
  - `assets`: "Tải lên hình ảnh & font chữ lên Cloud Storage" → CTA `Đăng ký miễn phí`.
  - `ai`: "Trợ lý AI thiết kế tự động" → CTA `Nhận 200 credits miễn phí`.

### Batch 3 — State Handover & Unsaved Guard
- Enable `useUnsavedChangesGuard` for demo sessions when `$isDirty` is true.
- Synchronize active atoms into `localStorage["nova-demo-draft"]` on change.
- In `/signup` and `/login` flow, detect `nova-demo-draft` and seamlessly provision it as the user's first project in Supabase upon successful registration.

### Batch 4 — E2E Parity Verification (Playwright or Chrome DevTools MCP)
- Create `e2e/demo-parity.spec.ts` using Playwright or execute live browser verification via Chrome DevTools MCP (`chrome-mcp`):
  - **DOM Parity:** Verify all topbar buttons, menus, and left rail tabs exist identically on `/builder/demo` and `/builder/[projectId]`.
  - **Gate Interception:** Verify clicking Save on Demo opens the Auth Gate modal (no 401 error).
  - **Pro Paywall:** Verify clicking Export HTML opens the Pro Gate modal.
  - **Client Tools:** Verify Grid Guides, Accessibility panel, and History panel open and function on `/builder/demo`.
  - **Visual Capture:** Take cross-viewport snapshots (Desktop 1920x1080 and Mobile 390x844).

---

## 4. Quality Gate Checklist

- [x] `pnpm --filter @nova/builder typecheck` passes with 0 errors.
- [x] `node scripts/i18n-audit.mjs --max=0` passes with 0 hardcoded strings.
- [x] `pnpm test` passes (16/16 test suites passed).
- [x] `pnpm solid:audit` reports 0 blocking violations.
- [x] `pnpm --filter @nova/builder build:cf` (Cloudflare OpenNext bundle) passes with code 0.
- [x] E2E parity spec `e2e/demo-parity.spec.ts` passes 4/4 tests on Playwright.
- [x] Smoke test `e2e/smoke.spec.ts` passes on Playwright.
