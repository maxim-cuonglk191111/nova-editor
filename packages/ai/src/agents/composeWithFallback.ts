// Runs composerAgentWS against an ordered list of providers and returns the
// first composition that validates. A provider that errors (missing key,
// retired model, rate limit, region block) or yields an empty page is skipped.
import type { ProviderName } from "../providers/base.js";
import { getProvider } from "../providers/registry.js";
import { composerAgentWS } from "./composerAgentWS.js";
import { validateCompositionWS, type WSCompositionResult } from "../utils/validateCompositionWS.js";

export const DEFAULT_FALLBACK_ORDER: ProviderName[] = [
  "openrouter", "groq", "mistral", "anthropic", "openai", "google",
];

export type FallbackResult = {
  composition: WSCompositionResult;
  provider: ProviderName;
  failures: { provider: ProviderName; error: string }[];
};

export function providerChain(preferred: (string | undefined | null)[], fallbacks: string | undefined): ProviderName[] {
  const known = new Set<string>(DEFAULT_FALLBACK_ORDER);
  const order = fallbacks?.trim()
    ? fallbacks.split(",").map((s) => s.trim())
    : DEFAULT_FALLBACK_ORDER;
  const chain: ProviderName[] = [];
  for (const name of [...preferred, ...order]) {
    if (name && known.has(name) && !chain.includes(name as ProviderName)) chain.push(name as ProviderName);
  }
  return chain;
}

export async function composeWithFallback(chain: ProviderName[], userPrompt: string): Promise<FallbackResult> {
  const failures: FallbackResult["failures"] = [];
  for (const name of chain) {
    try {
      const raw = await composerAgentWS(getProvider(name), userPrompt);
      const composition = validateCompositionWS(raw);
      if (composition.instances.length > 0) return { composition, provider: name, failures };
      failures.push({ provider: name, error: "empty composition" });
    } catch (err) {
      failures.push({ provider: name, error: err instanceof Error ? err.message : String(err) });
    }
  }
  const detail = failures.map((f) => `${f.provider}: ${f.error.slice(0, 160)}`).join(" | ");
  throw new Error(`All AI providers failed — ${detail}`);
}
