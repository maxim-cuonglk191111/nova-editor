// Development only: marks a checkout as paid without a real transfer.
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { PAYOS_PRICES_VND } from "@/lib/billing/payos";
import { applyPurchase } from "@/lib/billing/grant";

export async function POST(req: Request) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Only available in development mode" }, { status: 403 });
  }

  const body = (await req.json().catch(() => ({}))) as { orderCode?: number | string; plan?: string; userId?: string; teamId?: string };
  const { orderCode, plan, userId, teamId } = body;
  if (!orderCode || !plan) return NextResponse.json({ error: "Missing required fields" }, { status: 400 });

  try {
    const result = await applyPurchase(getSupabaseAdmin(), {
      orderCode: String(orderCode),
      provider: "payos",
      plan,
      userId: userId || null,
      teamId: teamId || null,
      amount: PAYOS_PRICES_VND[plan] ?? 0,
    });
    return NextResponse.json({ ok: true, alreadyProcessed: result === "duplicate" });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
