// Server-side check for the first-purchase offer. An account qualifies while the offer runs
// and until it has paid for anything, whenever it was created. Reads only existing tables, so no
// migration: processed_payments (every applied payment) and payment_orders.
import type { SupabaseClient } from "@supabase/supabase-js";
import { isPromoActive } from "@/lib/promo";

export async function isEligibleForFirstPurchase(db: SupabaseClient, userId: string, now: Date = new Date()): Promise<boolean> {
  if (!isPromoActive(now)) return false;

  const paid = await db.from("processed_payments").select("order_code", { count: "exact", head: true }).eq("user_id", userId);
  if (paid.error || (paid.count ?? 0) > 0) return false;
  const orders = await db.from("payment_orders").select("order_code", { count: "exact", head: true }).eq("user_id", userId).eq("status", "paid");
  if (orders.error || (orders.count ?? 0) > 0) return false;
  return true;
}
