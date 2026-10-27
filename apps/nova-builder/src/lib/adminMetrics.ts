// Business numbers for the admin overview. Pure: rows in, numbers out, so the same rules are
// tested once and the API route stays a thin query layer.
//
// What counts as a customer: every account except admins and internal test accounts (QA runs
// create `@testqa.dev` users). Revenue is the sum of paid orders of customers. Orders written by
// the demo seed carry provider "demo" and are reported separately so a screenshot never passes
// seeded purchases off as bank transfers.

export type AdminUserRow = { id: string; email: string | null; tier: string; role: string; created_at: string };
export type AdminOrderRow = { order_code: string; provider: string; user_id: string | null; plan: string; amount: number; status: string; paid_at: string | null };
export type AdminProjectRow = { user_id: string | null };

export const DEMO_PROVIDER = "demo";

export function isInternalAccount(u: Pick<AdminUserRow, "email" | "role">): boolean {
  return u.role === "admin" || /@testqa\.dev$/i.test(u.email ?? "");
}

export type AdminKpis = {
  users: number;
  newUsers7d: number;
  paidUsers: number;
  /** One decimal, e.g. 25 or 17.9. */
  paidPercent: number;
  projects: number;
  revenue: number;
  paidOrders: number;
  /** Rounded to whole VND; 0 when there are no paid orders. */
  averageOrder: number;
  demoOrders: number;
  demoRevenue: number;
};

const DAY = 86_400_000;

export function summarizeAdmin(users: AdminUserRow[], orders: AdminOrderRow[], projects: AdminProjectRow[], now: Date = new Date()): AdminKpis {
  const customers = users.filter((u) => !isInternalAccount(u));
  const customerIds = new Set(customers.map((u) => u.id));
  const paid = orders.filter((o) => o.status === "paid" && o.user_id && customerIds.has(o.user_id));
  const demo = paid.filter((o) => o.provider === DEMO_PROVIDER);
  const revenue = paid.reduce((sum, o) => sum + o.amount, 0);
  const paidUsers = customers.filter((u) => u.tier !== "free").length;
  return {
    users: customers.length,
    newUsers7d: customers.filter((u) => now.getTime() - Date.parse(u.created_at) <= 7 * DAY).length,
    paidUsers,
    paidPercent: customers.length ? Math.round((paidUsers / customers.length) * 1000) / 10 : 0,
    projects: projects.filter((p) => p.user_id && customerIds.has(p.user_id)).length,
    revenue,
    paidOrders: paid.length,
    averageOrder: paid.length ? Math.round(revenue / paid.length) : 0,
    demoOrders: demo.length,
    demoRevenue: demo.reduce((sum, o) => sum + o.amount, 0),
  };
}
