// Runs an AI call across the provider chain (same order as /api/ai): Gemini
// rejects some Worker regions and free tiers rate-limit, so one provider is not enough.
import { getProvider, providerChain } from "@studio/ai";

type Provider = ReturnType<typeof getProvider>;

/** Returns the first result that passes `ok`; rethrows the last error if every provider failed. */
export async function withProviderFallback<T>(
  preferred: string | undefined,
  run: (provider: Provider) => Promise<T>,
  ok: (result: T) => boolean = () => true
): Promise<T> {
  const chain = providerChain([preferred, process.env["AI_PROVIDER"]], process.env["AI_FALLBACK_PROVIDERS"]);
  let last: T | undefined;
  let lastErr: unknown = new Error("No AI provider configured");
  for (const name of chain) {
    try {
      last = await run(getProvider(name));
      if (ok(last)) return last;
    } catch (err) {
      lastErr = err;
    }
  }
  if (last !== undefined) return last;
  throw lastErr;
}
