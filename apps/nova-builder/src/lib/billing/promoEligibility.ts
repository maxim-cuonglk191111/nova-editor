// Server-side check for the welcome offer. An account qualifies when it was created while
// the offer runs and has never paid for anything. Reads only existing tables, so no
// migration: users.created_at, processed_payments (every applied payment) and payment_orders.
import type { SupabaseClient } from "@supabase/supabase-js";
import { PROMO, isPromoActive } from "@/lib/promo";

export async function isEligibleForWelcomeOffer(db: SupabaseClient, userId: string, now: Date = new Date()): Promise<boolean> {
  if (!isPromoActive(now)) return false;

  const { data: user } = await db.from("users").select("created_at").eq("id", userId).maybeSingle();
  const createdAt = (user as { created_at?: string } | null)?.created_at;
  if (!createdAt || Date.parse(createdAt) < Date.parse(PROMO.startsAt)) return false;

  const paid = await db.from("processed_payments").select("order_code", { count: "exact", head: true }).eq("user_id", userId);
  if (paid.error || (paid.count ?? 0) > 0) return false;
  const orders = await db.from("payment_orders").select("order_code", { count: "exact", head: true }).eq("user_id", userId).eq("status", "paid");
  if (orders.error || (orders.count ?? 0) > 0) return false;
  return true;
}
