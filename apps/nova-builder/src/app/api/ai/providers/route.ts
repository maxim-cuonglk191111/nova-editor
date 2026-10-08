// GET /api/ai/providers — which AI providers this Worker can use (signed-in users only).
// Key configured (never the key itself), the fallback chain, model overrides, and the
// models the Groq key can access — retired models showed up only as "temporarily unavailable".
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { providerChain } from "@studio/ai";

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

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!(session?.user as { id?: string } | undefined)?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
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
  });
}
