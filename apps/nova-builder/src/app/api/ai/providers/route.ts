// GET /api/ai/providers — which AI providers this Worker can use (signed-in users only).
// Key configured (never the key itself), the fallback chain, model overrides, and the
// models the Groq key can access — retired models showed up only as "temporarily unavailable".
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getProvider, providerChain, type ProviderName } from "@studio/ai";

const KEYS: Record<string, string> = {
  groq: "GROQ_API_KEY",
  mistral: "MISTRAL_API_KEY",
  google: "GOOGLE_GENERATIVE_AI_API_KEY",
  openrouter: "OPENROUTER_API_KEY",
  openai: "OPENAI_API_KEY",
  anthropic: "ANTHROPIC_API_KEY",
};

async function groqModels(): Promise<string[] | string> {
  const key = process.env.GROQ_API_KEY?.trim();
  if (!key) return "no key";
  try {
    const r = await fetch("https://api.groq.com/openai/v1/models", { headers: { authorization: `Bearer ${key}` } });
    if (!r.ok) return `HTTP ${r.status}`;
    const json = (await r.json()) as { data?: { id: string }[] };
    return (json.data ?? []).map((m) => m.id).sort();
  } catch (err) {
    return String(err).slice(0, 120);
  }
}

/** ?live=1: one tiny completion per configured provider and tier (≈10 tokens each) to read the real error. */
async function liveCheck(ids: string[]) {
  const results: Record<string, unknown> = {};
  for (const id of ids) {
    for (const tier of ["planner", "patcher"] as const) {
      const t0 = Date.now();
      try {
        const text = await getProvider(id as ProviderName).complete([{ role: "user", content: "Reply with the word OK." }], { tier, maxTokens: 16 });
        results[`${id}/${tier}`] = { ok: true, ms: Date.now() - t0, text: text.slice(0, 20) };
      } catch (err) {
        results[`${id}/${tier}`] = { ok: false, ms: Date.now() - t0, error: String(err instanceof Error ? err.message : err).slice(0, 300) };
      }
    }
  }
  return results;
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!(session?.user as { id?: string } | undefined)?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const live = new URL(req.url).searchParams.get("live") === "1";
  const providers = Object.entries(KEYS).map(([id, env]) => ({
    id,
    keyConfigured: Boolean(process.env[env]?.trim()),
    modelOverrides: Object.keys(process.env).filter((k) => k.startsWith(`AI_MODEL_${id.toUpperCase()}_`)).map((k) => `${k}=${process.env[k]}`),
    maxTokensOverride: process.env[`AI_MAX_TOKENS_${id.toUpperCase()}`] ?? null,
  }));
  return Response.json({
    chain: providerChain([process.env.AI_PROVIDER], process.env.AI_FALLBACK_PROVIDERS),
    providers,
    groqModels: await groqModels(),
    live: live ? await liveCheck(providers.filter((p) => p.keyConfigured).map((p) => p.id)) : undefined,
  });
}
