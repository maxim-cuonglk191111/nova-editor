// The first-purchase offer: until the end date, an account that has never paid for anything
// sees every plan at a lower price with the regular price struck through. Whoever has bought
// before pays the regular price. Pure and shared by the server (which decides the real price)
// and the UI (which only explains it). The end date is real: there is no per-visitor countdown.

export const PROMO = {
  id: "first-purchase",
  // Two months from launch, Vietnam time (UTC+7).
  startsAt: "2026-10-26T00:00:00+07:00",
  endsAt: "2026-12-26T23:59:59+07:00",
} as const;

// First-purchase price of each plan, in VND. Fixed numbers rather than "50% off", so every price
// keeps ending in 9: each is the price ending in 9 nearest to half of the regular price.
export const PROMO_PRICES_VND: Record<string, number> = {
  pro: 129000, // regular 249,000
  team: 189000, // regular 379,000
  max: 649000, // regular 1,289,000
  credits: 49000, // regular 99,000
};

export function isPromoActive(now: Date = new Date()): boolean {
  const t = now.getTime();
  return t >= Date.parse(PROMO.startsAt) && t <= Date.parse(PROMO.endsAt);
}

/** What a first purchase of `plan` costs. A plan without a first-purchase price keeps its regular price. */
export function promoPrice(plan: string, regularPrice: number): number {
  return PROMO_PRICES_VND[plan] ?? regularPrice;
}

/** Whole days left, counting today; 0 once the offer has ended. */
export function promoDaysLeft(now: Date = new Date()): number {
  const ms = Date.parse(PROMO.endsAt) - now.getTime();
  return ms <= 0 ? 0 : Math.ceil(ms / 86_400_000);
}

export function formatPromoEnd(locale: string): string {
  return new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Ho_Chi_Minh" })
    .format(new Date(PROMO.endsAt));
}

/** What GET /api/promo returns. `eligible` is null for visitors who are not signed in (they see the offer too). */
export type PromoStatus = {
  active: boolean;
  endsAt: string;
  eligible: boolean | null;
};
