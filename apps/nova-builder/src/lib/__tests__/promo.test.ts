import { describe, it, expect } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { PROMO, PROMO_PRICES_VND, formatPromoEnd, isPromoActive, promoDaysLeft, promoPrice } from "../promo";
import { PAYOS_PRICES_VND } from "../billing/payos";
import { isEligibleForFirstPurchase } from "../billing/promoEligibility";

describe("list prices", () => {
  it("every price ends in 9; Pro is 249,000 and Team 379,000 after the 2026-10-27 halving", () => {
    expect(PAYOS_PRICES_VND.pro).toBe(249000);
    expect(PAYOS_PRICES_VND.team).toBe(379000);
    for (const [plan, vnd] of Object.entries(PAYOS_PRICES_VND)) {
      expect(String(vnd), plan).toMatch(/9000$/);
    }
  });

  it("Max keeps its original price: the dollar ratio 49/19 of the old 499k anchor, without rounding past the next 9", () => {
    const exact = (49 * 499000) / 19; // 1,286,842
    expect(PAYOS_PRICES_VND.max).toBeGreaterThanOrEqual(exact);
    expect(PAYOS_PRICES_VND.max - exact).toBeLessThan(5000);
  });
});

describe("welcome offer window", () => {
  it("runs exactly two months, Vietnam time", () => {
    const start = new Date(PROMO.startsAt);
    const end = new Date(PROMO.endsAt);
    expect(start.toISOString()).toBe("2026-10-25T17:00:00.000Z");
    const months = (end.getUTCFullYear() - start.getUTCFullYear()) * 12 + (end.getUTCMonth() - start.getUTCMonth());
    expect(months).toBe(2);
  });

  it("is active inside the window and not outside", () => {
    expect(isPromoActive(new Date("2026-10-25T16:59:59Z"))).toBe(false);
    expect(isPromoActive(new Date("2026-10-26T00:00:00+07:00"))).toBe(true);
    expect(isPromoActive(new Date("2026-12-26T23:59:59+07:00"))).toBe(true);
    expect(isPromoActive(new Date("2026-12-27T00:00:00+07:00"))).toBe(false);
  });

  it("counts whole days left and stops at zero", () => {
    expect(promoDaysLeft(new Date("2026-12-26T00:00:00+07:00"))).toBe(1);
    expect(promoDaysLeft(new Date("2026-12-25T00:00:00+07:00"))).toBe(2);
    expect(promoDaysLeft(new Date("2027-01-01T00:00:00+07:00"))).toBe(0);
  });

  it("formats the end date in both languages", () => {
    expect(formatPromoEnd("en")).toContain("26");
    expect(formatPromoEnd("en")).toContain("December");
    expect(formatPromoEnd("vi")).toMatch(/26/);
  });
});

describe("first-purchase prices", () => {
  it("are fixed numbers that end in 9, each the 9-ending price nearest to half the regular price", () => {
    expect(PROMO_PRICES_VND).toEqual({ pro: 129000, team: 189000, max: 649000, credits: 49000 });
    for (const [plan, promo] of Object.entries(PROMO_PRICES_VND)) {
      const regular = PAYOS_PRICES_VND[plan]!;
      expect(String(promo), plan).toMatch(/9000$/);
      expect(promo, plan).toBeLessThan(regular);
      const half = regular / 2;
      const nearest9 = Math.round((half - 9000) / 10000) * 10000 + 9000;
      expect(promo, plan).toBe(nearest9);
    }
  });

  it("promoPrice returns the first-purchase price, and the regular price for a plan without one", () => {
    expect(promoPrice("pro", PAYOS_PRICES_VND.pro!)).toBe(129000);
    expect(promoPrice("max", PAYOS_PRICES_VND.max!)).toBe(649000);
    expect(promoPrice("free", 0)).toBe(0);
  });
});

// A minimal stand-in for the two queries the eligibility check makes.
function fakeDb(opts: { processed?: number; paidOrders?: number }): SupabaseClient {
  const head = (count: number) => ({ eq: () => ({ eq: () => Promise.resolve({ count, error: null }) }) });
  return {
    from: (table: string) => ({
      select: (_cols: string, o?: { head?: boolean }) => {
        if (table === "processed_payments" && o?.head) return { eq: () => Promise.resolve({ count: opts.processed ?? 0, error: null }) };
        if (table === "payment_orders" && o?.head) return head(opts.paidOrders ?? 0);
        throw new Error(`unexpected query on ${table}`);
      },
    }),
  } as unknown as SupabaseClient;
}

describe("isEligibleForFirstPurchase", () => {
  const during = new Date("2026-11-10T12:00:00+07:00");

  it("accepts any account that has never paid, whatever its age", async () => {
    expect(await isEligibleForFirstPurchase(fakeDb({}), "new", during)).toBe(true);
    expect(await isEligibleForFirstPurchase(fakeDb({}), "from-july", during)).toBe(true);
  });

  it("rejects an account that has already paid, by either record", async () => {
    expect(await isEligibleForFirstPurchase(fakeDb({ processed: 1 }), "u1", during)).toBe(false);
    expect(await isEligibleForFirstPurchase(fakeDb({ paidOrders: 1 }), "u1", during)).toBe(false);
  });

  it("rejects everyone once the offer is over", async () => {
    expect(await isEligibleForFirstPurchase(fakeDb({}), "u1", new Date("2027-01-02T00:00:00Z"))).toBe(false);
  });
});
