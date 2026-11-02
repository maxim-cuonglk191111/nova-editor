# Task 036 — Old landing page back, first-purchase prices for everyone who never paid

- **Status:** Closed
- **Filed:** 2026-10-27
- **Owner:** Claude Code

## Request
The reviewers did not like the redesigned landing page: go back to the old one (sky video hero, dark pill navbar). Pro list price 249,000; for the two months of the offer every plan shows the struck-through regular price and the first-purchase price (Pro 129,000), labelled "first purchase", to anyone who has never bought, whatever their state (visitor, new or old account). Someone who has bought pays the regular price.

## What was done
- `components/landing/legacy/`: the landing from before task 028 rebuilt from git history (page, styles, motion, nav, footer, English and Vietnamese copy) and rendered by `app/page.tsx`. The only change to it is the Docs link, removed because /docs does not exist (that is also what the red box in the reviewers' screenshot points at). The eyebrow badge is a `div` and the nav CTA is 44px tall so the elder-first accessibility gate still passes. The `#features` anchor exists, the shared header on pricing/terms/privacy no longer links to the FAQ the old landing does not have.
- The new landing components (`LandingHero`, `HeroMockup`, `doodles`, `landingStyles`) are not used any more; they stay in the repo until the owner decides whether to delete them.
- Prices: `PROMO_PRICES_VND` (Pro 129,000, Team 189,000, Max 649,000, credits 49,000), each the price ending in 9 nearest to half of the regular price. `promoPrice(plan, regular)` replaces the percentage. `isEligibleForFirstPurchase` replaces the welcome-offer check: no payment record and no paid order, account age no longer matters. Applies to create-link (SePay, PayOS, mock) and the portal. The pricing grid, the checkout modal and the banner show the struck-through regular price, the first-purchase price and a "First purchase" / "Lần mua đầu tiên" label to visitors and to accounts that never paid.
- Seed orders are written at the first-purchase price (129,000); the admin overview reads 516,000 VND for the four buyers.

## Verified
Unit: 125 app tests, 50 in @studio/ai; e2e: landing-header, promo, builder-audit/landing, a11y (public pages and elder-first), i18n, demo-parity pass on the local build; pricing page checked as a visitor in Vietnamese.
