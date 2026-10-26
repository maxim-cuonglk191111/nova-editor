// GET /api/promo — whether the welcome offer is running and, for a signed-in user, whether
// they qualify. Public: visitors see the offer too (eligible is null for them). It applies to
// every payment method; create-link is where the price is actually decided.
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { isEligibleForWelcomeOffer } from "@/lib/billing/promoEligibility";
import { PROMO, isPromoActive, type PromoStatus } from "@/lib/promo";

export async function GET() {
  const active = isPromoActive();
  const base: PromoStatus = { active, percentOff: PROMO.percentOff, endsAt: PROMO.endsAt, eligible: null };
  if (!active) return NextResponse.json(base, { headers: { "Cache-Control": "no-store" } });

  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (userId) {
    try {
      base.eligible = await isEligibleForWelcomeOffer(getSupabaseAdmin(), userId);
    } catch (err) {
      console.error("[promo] eligibility check failed:", err);
      base.eligible = false;
    }
  }
  return NextResponse.json(base, { headers: { "Cache-Control": "no-store" } });
}
