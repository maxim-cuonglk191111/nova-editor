// GET /api/admin/overview — business numbers plus the latest transactions and projects (admin only).
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { isInternalAccount, summarizeAdmin, type AdminOrderRow, type AdminProjectRow, type AdminUserRow } from "@/lib/adminMetrics";

const LATEST = 12;

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const db = getSupabaseAdmin();

  const [usersRes, ordersRes, projectsRes] = await Promise.all([
    db.from("users").select("id, email, tier, role, created_at"),
    db.from("payment_orders").select("order_code, provider, user_id, plan, amount, status, created_at, paid_at"),
    // Light columns only: schema_json is the whole site.
    db.from("projects").select("id, user_id, project_name, updated_at").order("updated_at", { ascending: false }),
  ]);
  const failed = usersRes.error ?? ordersRes.error ?? projectsRes.error;
  if (failed) return NextResponse.json({ error: failed.message }, { status: 500 });

  const users = (usersRes.data ?? []) as AdminUserRow[];
  const orders = (ordersRes.data ?? []) as (AdminOrderRow & { created_at: string })[];
  const projects = (projectsRes.data ?? []) as (AdminProjectRow & { id: string; project_name: string | null; updated_at: string })[];
  const emailOf = new Map(users.map((u) => [u.id, u.email ?? ""]));
  const customers = new Set(users.filter((u) => !isInternalAccount(u)).map((u) => u.id));

  return NextResponse.json({
    kpis: summarizeAdmin(users, orders, projects),
    transactions: orders
      .filter((o) => o.status === "paid" && o.user_id && customers.has(o.user_id))
      .sort((a, b) => Date.parse(b.paid_at ?? b.created_at) - Date.parse(a.paid_at ?? a.created_at))
      .slice(0, LATEST)
      .map((o) => ({ orderCode: o.order_code, email: emailOf.get(o.user_id!) ?? "", plan: o.plan, amount: o.amount, provider: o.provider, paidAt: o.paid_at })),
    projects: projects
      .filter((p) => p.user_id && customers.has(p.user_id))
      .slice(0, LATEST)
      .map((p) => ({ id: p.id, name: p.project_name ?? "", email: emailOf.get(p.user_id!) ?? "", updatedAt: p.updated_at })),
  });
}
