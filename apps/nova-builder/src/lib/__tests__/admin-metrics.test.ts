import { describe, it, expect } from "vitest";
import { summarizeAdmin, isInternalAccount, DEMO_PROVIDER, type AdminOrderRow, type AdminUserRow } from "../adminMetrics";

const NOW = new Date("2026-10-27T12:00:00.000Z");
const user = (id: string, email: string, tier = "free", role = "user", created = "2026-10-01T00:00:00.000Z"): AdminUserRow => ({ id, email, tier, role, created_at: created });
const order = (code: string, userId: string, amount: number, status = "paid", provider = "sepay"): AdminOrderRow => ({ order_code: code, provider, user_id: userId, plan: "pro", amount, status, paid_at: status === "paid" ? "2026-10-26T10:00:00.000Z" : null });

describe("admin business numbers", () => {
  it("treats admins and @testqa.dev accounts as internal", () => {
    expect(isInternalAccount({ email: "qa.g1.1@testqa.dev", role: "user" })).toBe(true);
    expect(isInternalAccount({ email: "boss@example.com", role: "admin" })).toBe(true);
    expect(isInternalAccount({ email: "mai@example.com", role: "user" })).toBe(false);
    expect(isInternalAccount({ email: null, role: "user" })).toBe(false);
  });

  it("counts customers, paid users, projects and revenue without internal accounts", () => {
    const users = [
      user("a", "a@x.com", "pro", "user", "2026-10-26T00:00:00.000Z"),
      user("b", "b@x.com"),
      user("c", "c@x.com", "pro", "user", "2026-10-20T00:00:00.000Z"),
      user("q", "qa.1@testqa.dev", "pro"),
      user("adm", "root@x.com", "pro", "admin"),
    ];
    const orders = [
      order("1", "a", 249500),
      order("2", "c", 499000),
      order("3", "q", 499000), // internal: ignored
      order("4", "b", 249500, "pending"), // not paid: ignored
    ];
    const k = summarizeAdmin(users, orders, [{ user_id: "a" }, { user_id: "a" }, { user_id: "q" }, { user_id: null }], NOW);
    expect(k.users).toBe(3);
    expect(k.newUsers7d).toBe(1);
    expect(k.paidUsers).toBe(2);
    expect(k.paidPercent).toBe(66.7);
    expect(k.projects).toBe(2);
    expect(k.revenue).toBe(748500);
    expect(k.paidOrders).toBe(2);
    expect(k.averageOrder).toBe(374250);
  });

  it("reports demo-seed orders separately so they are never passed off as bank transfers", () => {
    const users = [user("a", "a@x.com", "pro"), user("b", "b@x.com", "pro")];
    const k = summarizeAdmin(users, [order("d1", "a", 249500, "paid", DEMO_PROVIDER), order("r1", "b", 499000)], [], NOW);
    expect(k.paidOrders).toBe(2);
    expect(k.demoOrders).toBe(1);
    expect(k.demoRevenue).toBe(249500);
    expect(k.revenue).toBe(748500);
  });

  it("does not divide by zero on an empty database", () => {
    const k = summarizeAdmin([], [], [], NOW);
    expect(k).toMatchObject({ users: 0, paidPercent: 0, averageOrder: 0, revenue: 0, demoOrders: 0 });
  });
});
