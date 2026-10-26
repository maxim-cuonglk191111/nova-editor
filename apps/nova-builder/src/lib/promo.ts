// The welcome offer: 50% off the first purchase of an account created while the offer runs.
// Pure and shared by the server (which decides the real price) and the UI (which only
// explains it). The end date is real — there is no per-visitor countdown.

export const PROMO = {
  id: "welcome-50",
  percentOff: 50,
  // Two months from launch, Vietnam time (UTC+7).
  startsAt: "2026-10-26T00:00:00+07:00",
  endsAt: "2026-12-26T23:59:59+07:00",
} as const;

export function isPromoActive(now: Date = new Date()): boolean {
  const t = now.getTime();
  return t >= Date.parse(PROMO.startsAt) && t <= Date.parse(PROMO.endsAt);
}

/** Price after the offer. Exact, never rounded: 50% of 499,000 is 249,500. */
export function promoPrice(listPrice: number, percentOff: number = PROMO.percentOff): number {
  return Math.floor((listPrice * (100 - percentOff)) / 100);
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

/** What GET /api/promo returns. `eligible` is null for visitors who are not signed in. */
export type PromoStatus = {
  active: boolean;
  percentOff: number;
  endsAt: string;
  eligible: boolean | null;
};
