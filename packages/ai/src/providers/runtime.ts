// packages/ai/src/providers/runtime.ts
// Shared runtime helpers for provider adapters.
import type { CompleteOptions } from "./base.js";

// On Cloudflare Workers (nodejs_compat) the openai / anthropic SDKs detect a
// Node-like runtime and fall back to node-fetch, which fails with
// "Connection error". Handing them the platform fetch avoids that.
export const platformFetch: typeof fetch = (input, init) => globalThis.fetch(input, init);

// Model IDs drift (providers retire models); AI_MODEL_<PROVIDER>_<TIER>
// overrides the built-in default without a code change.
export function resolveModel(
  provider: string,
  tier: CompleteOptions["tier"],
  defaults: Record<CompleteOptions["tier"], string>
): string {
  const override = process.env[`AI_MODEL_${provider.toUpperCase()}_${tier.toUpperCase()}`]?.trim();
  return override || defaults[tier];
}

export function requireApiKey(value: string | undefined, envName: string, providerName: string): string {
  const key = value?.trim();
  if (!key) throw new Error(`${providerName}: ${envName} is not configured`);
  return key;
}
