# Task 002 — SePay VietQR go-live

- **Status:** Blocked (needs owner input)
- **Filed:** 2026-10-07
- **Owner:** Owner (config) + Claude Code (verification)
- **Severity:** Critical — wrong account = customers pay the wrong person

## What works (production, 2026-10-06)
Payment probe 19/19: SePay order created, VietQR decodes as NAPAS standard (GUID A000000727, MB BIN 970422, account, amount, `NOVA<order>` description, valid CRC), signed webhook grants once, replay ignored, history lists it, SePay API token accepted. Test data cleaned (QA credits back to 197).
Probe script: `scripts/payment-probe.mjs` (needs `npm i --no-save jsqr`; it grants 500 credits to the QA account — reset afterwards with SQL: delete the QA user's rows in `processed_payments` and `payment_orders`, set `credits_remaining` back).

## Blocking questions for the owner
1. `SEPAY_ACCOUNT_NUMBER` looks like a placeholder (`01…6789`, 10 digits, name "NOVA STUDIO"). Confirm or set the real account + `SEPAY_ACCOUNT_NAME` + `SEPAY_BANK_CODE` as Worker secrets.
2. In my.sepay.vn add the webhook: URL `https://nova-editor.maximi.workers.dev/api/billing/webhook/sepay`, auth "API Key", key = Worker secret `SEPAY_WEBHOOK_KEY` (value saved locally by Claude in the session scratchpad `sepay-webhook-key.txt`; if lost, generate a new one and `wrangler secret put SEPAY_WEBHOOK_KEY`).
3. Scan the checkout QR with MoMo, ZaloPay, ShopeePay and one banking app; confirm the fields auto-fill; cancel (no money needed). Optionally one real small transfer to confirm the webhook end-to-end.

## After that
Re-run the probe on production; record results in `doc/VERIFIED.md`.
Pricing note: credit pack is 500 credits / 100,000đ in code vs packs of 1,000 ($2) / 4,000 ($7) in `doc/pricing-policy.md` — owner to decide.
