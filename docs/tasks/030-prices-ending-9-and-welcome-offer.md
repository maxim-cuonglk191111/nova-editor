# Task 030 — Prices ending in 9 and the welcome offer

- **Status:** Closed (server path not exercised with a real order)
- **Filed:** 2026-10-26
- **Owner:** Claude Code

## Request
Pro list price 499k; make the other plans end in 9 too, no rounding. Add an offer banner. The real offer: 50% off the first purchase of any new account, for 2 months.

## Decisions
- Max = 1,289,000: $49 at the Pro rate (49 × 499,000 / 19 = 1,286,842), then up to the next ...9,000. Credits pack 99,000; Team 749,000.
- **No fake urgency.** The brief mentioned a "1 hour" style banner. A countdown that restarts for each visitor would mislead people about a discount that really lasts until 26 Dec 2026, so the banner shows that date and the days left. If a short-timer is wanted, it should count down to a real moment.
- "New account" = created on/after 2026-10-26 00:00 UTC+7. Accounts that existed before launch do not get it; say so if they should.
- Discount applies to the first purchase of any kind (plan or credits pack). It first shipped only on the SePay checkout; task 032 extended it to PayOS and the portal so the offer does not depend on which provider is configured.

## Done
- [x] `PAYOS_PRICES_VND` → 499,000 / 1,289,000 / 749,000 / 99,000
- [x] `lib/promo.ts`, `billing/promoEligibility.ts`, `GET /api/promo`, `usePromo`, `PromoBanner`
- [x] create-link stores the discounted amount; one open discounted order at a time
- [x] PricingGrid + checkout modal show list price, offer price, badge
- [x] unit tests (11) + e2e (5)

## Open
- Paying a superseded discounted order (an earlier QR) is ignored by the webhook ("unknown order") and needs manual handling. Rare; the modal always shows the latest QR.
- The banner is mounted on `/pricing`; mount it on the landing page when the redesign branch is merged.
- Run one real order on production with a brand-new account to confirm the 249,500 QR.
