# Task 026 — Builder Error Boundary & React Error #310 Crash Protection

- **Status:** Open
- **Filed:** 2026-10-20
- **Owner:** Antigravity / Claude Code
- **Severity:** Critical (Stability: Prevents whole-builder crash screens during editing)

---

## 1. Problem & Root Cause (Report PDF 1 Page 4)

1. **React Minified Error Crash Screen:**
   - **Symptom:** During live testing, the builder threw a black crash screen: `"Đã xảy ra lỗi — Minified React error #310… Thử lại"`.
   - **Root Cause:**
     - React error #310 indicates a React hook ordering mismatch (e.g. conditionally called hooks) or updating parent state during child render.
     - In `apps/nova-builder/src/app/builder/[projectId]/page.tsx` or `canvas.tsx`, state switches (such as transitioning between `loadState === "loading"` and `loadState === "ready"`, or dynamic component mounting) triggered hooks conditionally or caused concurrent dispatcher desync.
   - **Fix:**
     - Audit hook calls in `builder/[projectId]/page.tsx` and `canvas.tsx`: Ensure 100% unconditional hook execution at top of components.
     - Wrap canvas and sidebar panels in a robust React `ErrorBoundary` with state preservation.
     - When an error occurs, render an inline recovery card with "Khôi phục phiên làm việc" (Restore draft) instead of crashing the entire Next.js app.

---

## 2. Solution Checklist

- [ ] Audit and eliminate any conditional hook invocations in builder page and canvas.
- [ ] Implement isolated Error Boundary with graceful recovery around canvas and sidebars.
- [ ] Run `node scripts/i18n-audit.mjs --max=0`.
- [ ] Run `pnpm --filter @nova/builder typecheck`.
- [ ] Verify live in Chrome DevTools MCP.
