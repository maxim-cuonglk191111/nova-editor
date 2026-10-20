# Task 025 — Pre-Generate Auth Guard & Dialog Instruction Sync

- **Status:** Open
- **Filed:** 2026-10-20
- **Owner:** Antigravity / Claude Code
- **Severity:** Medium (UX Flow & Waste Prevention: Prompting login before typing prompt; aligning dialog instructions)

---

## 1. Problem & Root Cause (Report 19/10 Pages 15, 18)

1. **Late Auth Error on Generate (Page 15):**
   - **Symptom:** In Demo / unauthenticated mode, users are allowed to spend time formulating and typing a full prompt in the Generate dialog. Only upon pressing "Generate" does the system reject with an auth error, wasting user effort.
   - **Fix:**
     - Pre-Generate Auth Guard: Intercept the Generate action *before* opening the prompt input or immediately inform the user that generation requires an account.
     - Alternatively, if prompt is entered in Demo, preserve it in `sessionStorage["nova-pending-prompt"]` before directing to login/signup, so it is never lost.

2. **Instruction Sync with Tools Menu (Page 18):**
   - **Symptom:** Generate dialog text suggests: `"Muốn sửa một phần thì chọn section rồi dùng Tools → AI Content Fill"`. In some views or screen sizes, users cannot locate the Tools menu easily.
   - **Fix:**
     - Provide a direct 1-click action inside the Generate dialog: `"Sửa phần tử đang chọn (AI Fill)"` that immediately opens AI Content Fill without requiring manual menu navigation.
     - Ensure `Tools` dropdown menu in Topbar is always prominently visible and labeled.

---

## 2. Solution Checklist

- [ ] Add pre-generate auth interceptor or auto-cache prompt across login.
- [ ] Add direct link/button in Generate dialog to launch AI Content Fill on current selection.
- [ ] Run `node scripts/i18n-audit.mjs --max=0`.
- [ ] Run `pnpm --filter @nova/builder typecheck`.
- [ ] Verify live in Chrome DevTools MCP.
