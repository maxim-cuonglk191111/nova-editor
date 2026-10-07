# Task 003 — Cards, Google Pay, Apple Pay, PayPal via Lemon Squeezy

- **Status:** Blocked (needs owner input)
- **Filed:** 2026-10-07
- **Owner:** Owner (store setup) + Claude Code
- **Severity:** Medium

Google Pay cannot pay a VietQR; it needs a card checkout. Lemon Squeezy hosted checkout supports cards, PayPal, Apple Pay (Safari) and Google Pay (Chrome) — docs.lemonsqueezy.com/help/checkout/payment-methods.

## State
- Code exists: `app/api/billing/portal/route.ts` (`provider=lemonsqueezy`), `lib/billing/lemonsqueezy.ts`, webhook `app/api/billing/webhook/route.ts`.
- Not configured: only `LEMONSQUEEZY_WEBHOOK_SECRET` and `NEXT_PUBLIC_LEMONSQUEEZY_CHECKOUT_URL` exist as Worker secrets; `LEMONSQUEEZY_STORE_ID`, `LEMONSQUEEZY_VARIANT_PRO`, `LEMONSQUEEZY_VARIANT_TEAM` (and a Max variant + credit pack product) are missing.
- No UI button reaches it: `handleUpgrade` in `app/settings/subscription/page.tsx` is unused.

## Owner provides
Lemon Squeezy store (free; fee per sale), products/variants for Pro, Max, Team, credit pack; their ids; webhook pointing to `/api/billing/webhook`.

## Then
Add a "Pay by card / Google Pay" button next to VietQR (i18n, both locales); verify webhook signature handling with a test-mode order; spec + screenshots; score.
