// POST: AI compose — natural language → WebstudioData patch (WS component format).
// Auth, rate-limit, credit check identical to studio's AI route (ADR-006/038).
// Returns WSCompositionResult which the client applies to nanostores atoms.
//
// DEV FALLBACK: In development, if Supabase is unreachable (DNS failure, dummy
// URL, etc.), the auth / credit / rate-limit / conversation steps are skipped
// and the AI compose runs directly. This lets devs test generation locally
// without a real Supabase project.
import { getToken } from "next-auth/jwt";
import {
  getOrProvisionUser,
  deductCredit,
  getMonthlySpentToday,
  saveAIMessage,
  createAIConversation,
  supabase,
} from "@/lib/supabase-server";
import {
  composeWithFallback,
  providerChain,
  PROVIDER_CREDIT_COST,
} from "@studio/ai";
import type { ProviderName } from "@studio/ai";
import { dailyCreditCap, decideCreditSource } from "@/lib/tiers";

const isDev = process.env.NODE_ENV === "development";

/** Run AI compose without any auth/credit checks. Used as dev fallback. */
async function composeWithoutAuth(
  chain: ProviderName[],
  userMessage: string
): Promise<Response> {
  try {
    const { composition, provider } = await composeWithFallback(chain, userMessage);
    return Response.json({
      composition,
      provider,
      creditCost: 0,
      creditsRemaining: 999,
      conversationId: null,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "AI compose failed";
    console.error("[ai/route] AI compose error:", message);
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const body = (await req.json()) as {
    userMessage: string;
    projectId?: string | null;
    conversationId?: string | null;
    provider?: ProviderName;
  };
  const { userMessage, projectId, conversationId: clientConversationId, provider: clientProvider } = body;

  // Requested provider first, then AI_PROVIDER, then the AI_FALLBACK_PROVIDERS
  // order — so one provider's outage or missing key never blocks generation.
  const chain = providerChain(
    [clientProvider, process.env["AI_PROVIDER"]],
    process.env["AI_FALLBACK_PROVIDERS"]
  );
  const creditCost = PROVIDER_CREDIT_COST[chain[0]!] ?? 1;

  // ── 1. Auth ────────────────────────────────────────────────────────────────
  const token = await getToken({ req: req as Parameters<typeof getToken>[0]["req"] });
  if (!token?.githubId && !token?.email) {
    // In dev, allow unauthenticated AI calls (no login required)
    if (isDev) {
      console.log("[ai/route] DEV FALLBACK — no auth token, running AI without auth");
      return composeWithoutAuth(chain, userMessage);
    }
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── 2. Load user from Supabase ─────────────────────────────────────────────
  let user: Awaited<ReturnType<typeof getOrProvisionUser>>;
  try {
    user = await getOrProvisionUser(token);
  } catch (err) {
    // In dev, if Supabase is unreachable (DNS fail, connection refused, etc.)
    // fall back to AI-only mode instead of returning 404.
    if (isDev) {
      console.warn("[ai/route] DEV FALLBACK — Supabase unreachable, skipping auth/credits:", String(err));
      return composeWithoutAuth(chain, userMessage);
    }
    return Response.json({ error: "User not found" }, { status: 404 });
  }

  // ── 3. Credit check (ADR-038) ──────────────────────────────────────────────
  const cap = dailyCreditCap(user.tier);
  const spentTodayMonthly = cap !== null ? await getMonthlySpentToday(user.id) : 0;
  const decision = decideCreditSource({
    cost: creditCost,
    monthly: user.credits_remaining,
    topup: user.topup_credits_remaining,
    dailyCap: cap,
    spentTodayMonthly,
  });
  if (!decision.ok) {
    const combined = user.credits_remaining + user.topup_credits_remaining;
    return decision.reason === "daily_cap"
      ? Response.json(
          { error: `Daily limit reached (${cap} credits/day). Buy a top-up or come back tomorrow.` },
          { status: 429 }
        )
      : Response.json(
          { error: `Need ${creditCost} credits, have ${combined}. Upgrade or buy a top-up.` },
          { status: 402 }
        );
  }

  // ── 4. Rate limit: max 10 AI ops/minute ────────────────────────────────────
  const { count } = await supabase
    .from("credit_transactions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("reason", "ai_request")
    .gte("created_at", new Date(Date.now() - 60_000).toISOString());

  if ((count ?? 0) >= 10) {
    return Response.json(
      { error: "Rate limit exceeded. Max 10 AI calls per minute." },
      { status: 429 }
    );
  }

  // 4b. Log the request marker BEFORE the slow AI call (closes concurrent-burst race)
  await supabase.from("credit_transactions").insert({
    user_id: user.id,
    project_id: projectId ?? null,
    delta: 0,
    reason: "ai_request",
  });

  // ── 5. Resolve or create conversation ──────────────────────────────────────
  let conversationId = clientConversationId ?? null;
  if (!conversationId && projectId) {
    const title = userMessage.slice(0, 60).trim() || "New composition";
    const created = await createAIConversation(projectId, user.id, title).catch(() => null);
    conversationId = created?.id ?? null;
  }

  // ── 6. Save user message ───────────────────────────────────────────────────
  if (conversationId && projectId) {
    await saveAIMessage({
      conversationId,
      projectId,
      userId: user.id,
      role: "user",
      content: userMessage,
    }).catch(() => { /* non-fatal */ });
  }

  // ── 7. Compose → validate ─────────────────────────────────────────────────
  try {
    const { composition, provider: usedProvider, failures } = await composeWithFallback(chain, userMessage);
    if (failures.length > 0) {
      console.warn("[ai/route] provider fallback:", failures.map((f) => `${f.provider}: ${f.error.slice(0, 200)}`).join(" | "));
    }
    // Charge what the serving provider costs, never more than the amount checked above.
    const usedCost = Math.min(PROVIDER_CREDIT_COST[usedProvider] ?? 1, creditCost);

    // ADR-006: deduct ONLY after we have a valid composition (composeWithFallback never returns an empty one)
    await deductCredit(user.id, projectId ?? null, usedCost, decision.source === "topup");

    // Save assistant response
    const responseText = `Composed ${composition.instances.length} instance(s) using: ${composition.usedComponents.join(", ") || "none"}.`;
    if (conversationId && projectId) {
      await saveAIMessage({
        conversationId,
        projectId,
        userId: user.id,
        role: "assistant",
        content: responseText,
        provider: usedProvider,
        creditsUsed: usedCost,
      }).catch(() => { /* non-fatal */ });
    }

    return Response.json({
      composition,
      provider: usedProvider,
      creditCost: usedCost,
      creditsRemaining: user.credits_remaining + user.topup_credits_remaining - usedCost,
      conversationId,
      // Providers skipped before this one succeeded — surfaces a missing key or
      // retired model without needing Worker logs.
      fallbacks: failures.map((f) => ({ provider: f.provider, error: f.error.slice(0, 200) })),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "AI compose failed";
    console.error("[ai/route] AI compose error:", message);
    return Response.json(
      { error: "AI generation is temporarily unavailable. Please try again in a minute.", detail: message },
      { status: 502 }
    );
  }
}

