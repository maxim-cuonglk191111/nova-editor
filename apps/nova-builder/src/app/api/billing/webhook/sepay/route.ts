// SePay webhook — called for every transaction on the linked bank account.
// Auth: SePay sends "Authorization: Apikey <SEPAY_WEBHOOK_KEY>".
// An incoming transfer whose description carries "NOVA<orderCode>" for at least
// the order amount applies the purchase. SePay retries until it gets
// {"success": true}, so ignored transfers are acknowledged too.
// Public route (middleware whitelists /api/billing/webhook).
import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { applyPurchase } from "@/lib/billing/grant";
import { sepayConfig, orderCodeFromContent } from "@/lib/billing/sepay";

type SepayWebhook = {
  id?: number;
  transferType?: "in" | "out";
  transferAmount?: number;
  content?: string;
  code?: string | null;
};

const ack = (extra: Record<string, unknown> = {}) => NextResponse.json({ success: true, ...extra });

function authorized(header: string | null, key: string): boolean {
  const given = Buffer.from((header ?? "").replace(/^Apikey\s+/i, ""), "utf8");
  const expected = Buffer.from(key, "utf8");
  return given.length === expected.length && timingSafeEqual(given, expected);
}

export async function POST(req: Request) {
  const key = sepayConfig()?.webhookKey;
  if (!key) return NextResponse.json({ success: false, error: "Webhook not configured" }, { status: 503 });
  if (!authorized(req.headers.get("authorization"), key)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as SepayWebhook;
  if (body.transferType !== "in") return ack({ ignored: "not incoming" });
  const orderCode = orderCodeFromContent(`${body.code ?? ""} ${body.content ?? ""}`);
  if (!orderCode) return ack({ ignored: "no order code" });

  const db = getSupabaseAdmin();
  const { data: order } = await db.from("payment_orders").select("*").eq("order_code", orderCode).maybeSingle();
  const row = order as { user_id: string | null; team_id: string | null; plan: string; amount: number } | null;
  if (!row) return ack({ ignored: "unknown order" });
  if ((body.transferAmount ?? 0) < row.amount) return ack({ ignored: "amount too low" });

  const result = await applyPurchase(db, {
    orderCode, provider: "sepay", plan: row.plan, userId: row.user_id, teamId: row.team_id, amount: body.transferAmount ?? row.amount,
  });
  return ack({ result });
}
