// Polled by the checkout modal every few seconds. A payment counts as paid once
// processed_payments has its order code; otherwise the provider is asked directly
// (the webhook may not have arrived yet) and the purchase is applied here.
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { applyPurchase } from "@/lib/billing/grant";
import { sepayConfig, paymentCode, findSepayPayment } from "@/lib/billing/sepay";

type OrderRow = { order_code: string; provider: string; user_id: string | null; team_id: string | null; plan: string; amount: number };

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const user = session?.user as { id?: string } | undefined;
  if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = user.id;

  const url = new URL(req.url);
  const orderCode = url.searchParams.get("orderCode");
  if (!orderCode) return NextResponse.json({ error: "Missing orderCode" }, { status: 400 });

  const db = getSupabaseAdmin();
  const { data: processed, error } = await db
    .from("processed_payments")
    .select("order_code, user_id")
    .eq("order_code", orderCode)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (processed) {
    if (processed.user_id && processed.user_id !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    return NextResponse.json({ paid: true });
  }

  const { data: order } = await db.from("payment_orders").select("*").eq("order_code", orderCode).maybeSingle();
  const row = order as OrderRow | null;
  if (row && row.user_id !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    if (row?.provider === "sepay") {
      const cfg = sepayConfig();
      const tx = cfg ? await findSepayPayment(cfg, paymentCode(orderCode), row.amount) : null;
      if (!tx) return NextResponse.json({ paid: false });
      await applyPurchase(db, {
        orderCode, provider: "sepay", plan: row.plan, userId: row.user_id, teamId: row.team_id, amount: Number(tx.amount_in),
      });
      return NextResponse.json({ paid: true });
    }
    return NextResponse.json({ paid: await checkPayos(orderCode, userId, url, db) });
  } catch (err) {
    console.error("[billing/status]", orderCode, err);
    return NextResponse.json({ paid: false });
  }
}

// PayOS fallback: ask PayOS whether the payment request is PAID.
async function checkPayos(orderCode: string, userId: string, url: URL, db: ReturnType<typeof getSupabaseAdmin>): Promise<boolean> {
  const clientId = process.env.PAYOS_CLIENT_ID;
  const apiKey = process.env.PAYOS_API_KEY;
  if (!clientId || !apiKey) return false;
  const res = await fetch(`https://api-merchant.payos.vn/v2/payment-requests/${orderCode}`, {
    headers: { "x-client-id": clientId, "x-api-key": apiKey, "Content-Type": "application/json" },
  });
  if (!res.ok) return false;
  const json = (await res.json()) as { code?: string; data?: { status?: string; amount?: number; items?: Array<{ name?: string }> } };
  if (json.code !== "00" || json.data?.status !== "PAID") return false;

  // Intent: "nova:<plan>:<userId>:<teamId>" from the checkout item name.
  const [tag, plan, itemUserId, teamId] = (json.data.items?.[0]?.name ?? "").split(":");
  const resolvedPlan = tag === "nova" && plan ? plan : url.searchParams.get("plan");
  if (!resolvedPlan) return false;
  await applyPurchase(db, {
    orderCode,
    provider: "payos",
    plan: resolvedPlan,
    userId: itemUserId || userId,
    teamId: teamId || url.searchParams.get("teamId") || null,
    amount: json.data.amount ?? 0,
  });
  return true;
}
