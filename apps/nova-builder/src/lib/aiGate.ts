// The checks every AI request passes before a provider is called: signed-in user, enough credits
// (ADR-038), at most 10 AI calls a minute. Credits are deducted by the caller, and only after a
// valid answer (ADR-NB-005). `POST /api/ai` has the same steps inline; this is the shared form
// used by the chat route.
//
// DEV FALLBACK: in development, with no session or no reachable Supabase, the checks are skipped
// so the AI can be tried locally without a database.
import { getToken } from "next-auth/jwt";
import { getOrProvisionUser, getMonthlySpentToday, supabase } from "@/lib/supabase-server";
import { dailyCreditCap, decideCreditSource } from "@/lib/tiers";

const isDev = process.env.NODE_ENV === "development";

type DbUser = Awaited<ReturnType<typeof getOrProvisionUser>>;

export type AiGate =
  | { kind: "dev" }
  | { kind: "user"; user: DbUser; source: "monthly" | "topup" }
  | { kind: "deny"; response: Response };

const deny = (error: string, status: number, extra: Record<string, unknown> = {}): AiGate => ({
  kind: "deny",
  response: Response.json({ error, ...extra }, { status }),
});

/** `cost` is the most one answer can charge (the preferred provider's price). */
export async function openAiGate(req: Request, cost: number, projectId: string | null): Promise<AiGate> {
  const token = await getToken({ req: req as Parameters<typeof getToken>[0]["req"] });
  if (!token?.githubId && !token?.email) {
    return isDev ? { kind: "dev" } : deny("Unauthorized", 401);
  }

  let user: DbUser;
  try {
    user = await getOrProvisionUser(token);
  } catch (err) {
    if (isDev) {
      console.warn("[aiGate] DEV FALLBACK — Supabase unreachable, skipping checks:", String(err));
      return { kind: "dev" };
    }
    return deny("User not found", 404);
  }

  const cap = dailyCreditCap(user.tier);
  const spentToday = cap !== null ? await getMonthlySpentToday(user.id) : 0;
  const decision = decideCreditSource({
    cost,
    monthly: user.credits_remaining,
    topup: user.topup_credits_remaining,
    dailyCap: cap,
    spentTodayMonthly: spentToday,
  });
  if (!decision.ok) {
    const combined = user.credits_remaining + user.topup_credits_remaining;
    return decision.reason === "daily_cap"
      ? deny(`Daily limit reached (${cap} credits/day). Buy a top-up or come back tomorrow.`, 429, { code: "daily_cap" })
      : deny(`Need ${cost} credits, have ${combined}. Upgrade or buy a top-up.`, 402, { code: "no_credits" });
  }

  const { count } = await supabase
    .from("credit_transactions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("reason", "ai_request")
    .gte("created_at", new Date(Date.now() - 60_000).toISOString());
  if ((count ?? 0) >= 10) return deny("Rate limit exceeded. Max 10 AI calls per minute.", 429, { code: "rate_limit" });

  // The marker goes in BEFORE the slow call, so a burst of requests cannot slip past the limit.
  await supabase.from("credit_transactions").insert({ user_id: user.id, project_id: projectId, delta: 0, reason: "ai_request" });
  return { kind: "user", user, source: decision.source };
}
