import { describe, it, expect } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { PROMO, formatPromoEnd, isPromoActive, promoDaysLeft, promoPrice } from "../promo";
import { PAYOS_PRICES_VND } from "../billing/payos";
import { isEligibleForWelcomeOffer } from "../billing/promoEligibility";

describe("list prices", () => {
  it("every price ends in 9 and the anchor is Pro 499,000", () => {
    expect(PAYOS_PRICES_VND.pro).toBe(499000);
    for (const [plan, vnd] of Object.entries(PAYOS_PRICES_VND)) {
      expect(String(vnd), plan).toMatch(/9000$/);
    }
  });

  it("Max follows the dollar ratio without rounding past the next 9: 49/19 of 499k", () => {
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

describe("promoPrice", () => {
  it("is an exact half, never rounded to a neighbour", () => {
    expect(promoPrice(499000)).toBe(249500);
    expect(promoPrice(1289000)).toBe(644500);
    expect(promoPrice(99000)).toBe(49500);
  });
});

// A minimal stand-in for the three queries the eligibility check makes.
function fakeDb(opts: { createdAt?: string | null; processed?: number; paidOrders?: number }): SupabaseClient {
  const head = (count: number) => ({ eq: () => ({ eq: () => Promise.resolve({ count, error: null }) }) });
  return {
    from: (table: string) => ({
      select: (_cols: string, o?: { head?: boolean }) => {
        if (table === "users") return { eq: () => ({ maybeSingle: () => Promise.resolve({ data: opts.createdAt ? { created_at: opts.createdAt } : null }) }) };
        if (table === "processed_payments" && o?.head) return { eq: () => Promise.resolve({ count: opts.processed ?? 0, error: null }) };
        if (table === "payment_orders" && o?.head) return head(opts.paidOrders ?? 0);
        throw new Error(`unexpected query on ${table}`);
      },
    }),
  } as unknown as SupabaseClient;
}

describe("isEligibleForWelcomeOffer", () => {
  const during = new Date("2026-11-10T12:00:00+07:00");

  it("accepts a new account with no payments", async () => {
    expect(await isEligibleForWelcomeOffer(fakeDb({ createdAt: "2026-11-01T00:00:00Z" }), "u1", during)).toBe(true);
  });

  it("rejects accounts created before the offer started", async () => {
    expect(await isEligibleForWelcomeOffer(fakeDb({ createdAt: "2026-09-01T00:00:00Z" }), "u1", during)).toBe(false);
  });

  it("rejects an account that has already paid, by either record", async () => {
    expect(await isEligibleForWelcomeOffer(fakeDb({ createdAt: "2026-11-01T00:00:00Z", processed: 1 }), "u1", during)).toBe(false);
    expect(await isEligibleForWelcomeOffer(fakeDb({ createdAt: "2026-11-01T00:00:00Z", paidOrders: 1 }), "u1", during)).toBe(false);
  });

  it("rejects everyone once the offer is over, and unknown users", async () => {
    expect(await isEligibleForWelcomeOffer(fakeDb({ createdAt: "2026-11-01T00:00:00Z" }), "u1", new Date("2027-01-02T00:00:00Z"))).toBe(false);
    expect(await isEligibleForWelcomeOffer(fakeDb({ createdAt: null }), "ghost", during)).toBe(false);
  });
});
