# Task 027 — VietQR Real Payment Account Configuration

- **Status:** Open
- **Filed:** 2026-10-20
- **Owner:** Antigravity / Claude Code
- **Severity:** High (Monetization & Go-Live: Replace dummy bank account with real VietQR recipient details)

---

## 1. Problem & Root Cause (Report PDF 1 Page 2)

1. **Dummy Bank Information on Payment Modal:**
   - **Symptom:** In VietQR checkout modal (`PayOSCheckoutModal.tsx` / `vietqr.ts`), account holder is hardcoded as `NOVA STUDIO` and account number is dummy `0123456789`.
   - **Request from Owner:** `"chỉnh lại thông tin thật — tính năng ok rồi Cường."`
   - **Fix:**
     - Externalize recipient configuration into environment variables:
       - `NEXT_PUBLIC_VIETQR_BANK_ID` (e.g. MBBank, Techcombank, Vietcombank)
       - `NEXT_PUBLIC_VIETQR_ACCOUNT_NO`
       - `NEXT_PUBLIC_VIETQR_ACCOUNT_NAME`
     - Update QR generator and display modal to read real account credentials from env config.
     - Document required environment variables in `.env.example` and deploy guide.

---

## 2. Solution Checklist

- [ ] Wire environment variables for real bank ID, account number, and account holder name.
- [ ] Update VietQR QR string generator to use configured real bank details.
- [ ] Update display fields in checkout modal.
- [ ] Run `node scripts/i18n-audit.mjs --max=0`.
- [ ] Run `pnpm --filter @nova/builder typecheck`.
- [ ] Verify live in Chrome DevTools MCP.
