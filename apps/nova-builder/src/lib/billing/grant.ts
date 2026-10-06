// Applies a confirmed payment exactly once: claims the order code in
// processed_payments (primary key = idempotency), then upgrades the plan or adds
// a credit pack. Shared by every provider's webhook and status check.
import type { SupabaseClient } from "@supabase/supabase-js";

export const CREDIT_PACK = 500;

export type Purchase = {
  orderCode: string;
  provider: "sepay" | "payos";
  plan: string;
  userId?: string | null;
  teamId?: string | null;
  amount: number;
};

export type GrantResult = "granted" | "duplicate";

const tierFor = (plan: string) => (plan === "team" ? "team" : plan === "max" ? "max" : "pro");

export async function applyPurchase(db: SupabaseClient, p: Purchase): Promise<GrantResult> {
  const { error: claimError } = await db.from("processed_payments").insert({
    order_code: p.orderCode,
    provider: p.provider,
    kind: p.plan === "credits" ? "credits" : "plan",
    user_id: p.userId || null,
    amount: p.amount,
    plan: p.plan,
    status: "success",
  });
  if (claimError) {
    // Unique violation = this payment was already applied; anything else is a real failure.
    if (claimError.code === "23505") return "duplicate";
    throw new Error(`processed_payments insert failed: ${claimError.message}`);
  }

  if (p.plan === "credits" && p.userId) {
    const { data: user } = await db.from("users").select("credits_remaining").eq("id", p.userId).single();
    const { error } = await db
      .from("users")
      .update({ credits_remaining: ((user as { credits_remaining?: number } | null)?.credits_remaining ?? 0) + CREDIT_PACK })
      .eq("id", p.userId);
    if (error) throw new Error(`credit grant failed: ${error.message}`);
  } else if (p.teamId) {
    const { error } = await db.from("teams").update({ plan: tierFor(p.plan) }).eq("id", p.teamId);
    if (error) throw new Error(`team plan update failed: ${error.message}`);
  } else if (p.userId) {
    const { error } = await db.from("users").update({ tier: tierFor(p.plan) }).eq("id", p.userId);
    if (error) throw new Error(`user tier update failed: ${error.message}`);
  }

  await db.from("payment_orders").update({ status: "paid", paid_at: new Date().toISOString() }).eq("order_code", p.orderCode);
  return "granted";
}
