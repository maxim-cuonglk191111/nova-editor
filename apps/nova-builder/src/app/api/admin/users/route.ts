// GET /api/admin/users — list all users (admin only).
// PATCH /api/admin/users — update user tier/role.

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";


export async function GET(req: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(req.url);
  const search = url.searchParams.get("q") ?? "";
  // Same rule as the business overview: admins and @testqa.dev accounts are internal.
  const hideInternal = url.searchParams.get("hideInternal") === "1";
  const page = parseInt(url.searchParams.get("page") ?? "1", 10);
  const limit = 50;
  const offset = (page - 1) * limit;

  let query = getSupabaseAdmin()
    .from("users")
    .select("id, email, github_login, tier, role, credits_remaining, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (search) query = query.ilike("email", `%${search}%`);
  if (hideInternal) query = query.neq("role", "admin").or("email.is.null,email.not.ilike.%@testqa.dev"); // GitHub sign-ups can have no email

  const { data, count } = await query;
  const mapped = (data ?? []).map((u: Record<string, unknown>) => ({
    id: u.id,
    // GitHub sign-ups can have no email: show the login instead of an empty row.
    email: u.email ?? (u.github_login ? `${u.github_login} (GitHub)` : "—"),
    tier: u.tier,
    role: u.role,
    credits: u.credits_remaining ?? 0,
    created_at: u.created_at,
  }));
  return NextResponse.json({ users: mapped, total: count ?? 0 });
}

export async function PATCH(req: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await req.json()) as { userId: string; tier?: string; role?: string; credits?: number };
  if (!body.userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  const updates: Record<string, unknown> = {};
  if (body.tier !== undefined) updates["tier"] = body.tier;
  if (body.role !== undefined) updates["role"] = body.role;
  if (body.credits !== undefined) updates["credits_remaining"] = body.credits;

  await getSupabaseAdmin().from("users").update(updates).eq("id", body.userId);
  return NextResponse.json({ ok: true });
}
