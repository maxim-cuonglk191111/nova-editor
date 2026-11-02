// COMPOSE-WS flow: natural-language description → WebstudioData tree.
// Uses the WS component system (Box, Heading, Button…) instead of Nova legacy blocks.
// Output schema: { tree: AINode[] } — then validated by validateCompositionWS().
import type { AIProvider, AIMessage } from "../providers/base.js";
import { buildComposePromptWS } from "../prompts/compose-ws.prompt.js";
import { extractJsonPatch } from "../utils/extractJson.js";

// Models guess the page language from context (and guessed Vietnamese for an
// English prompt), so state it explicitly. Vietnamese is detected by its
// diacritics; anything else follows the request's own language.
const VIETNAMESE = /[ăâđêôơưạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ]/i;

export function languageInstruction(userPrompt: string): string {
  return VIETNAMESE.test(userPrompt)
    ? "Write every visible text (headings, copy, buttons, prices, form labels) in Vietnamese."
    : "Write every visible text in the same language as the description above (English if it is in English).";
}

export async function composerAgentWS(
  provider: AIProvider,
  userPrompt: string,
  extraHints?: string,
  onRetry?: (attempt: number, error: string) => void
): Promise<unknown> {
  const system = buildComposePromptWS(extraHints);
  const userContent = `Compose a page for this description:\n\n${userPrompt}\n\n${languageInstruction(userPrompt)}\nOutput the JSON object with a "tree" key now.`;

  let lastError = "";

  for (let attempt = 1; attempt <= 3; attempt++) {
    const messages: AIMessage[] =
      attempt === 1
        ? [{ role: "user", content: userContent }]
        : [
            { role: "user", content: userContent },
            { role: "assistant", content: '{"tree":[]}' },
            {
              role: "user",
              content: `Your previous output caused this error: "${lastError}". Output ONLY a valid JSON object with a "tree" array of node objects using ONLY the listed component names.`,
            },
          ];

    // Provider failures (bad key, retired model, rate limit) are not fixed by
    // re-asking the same provider — let them propagate so the caller can fall
    // back. Only malformed output is retried below.
    const text = await provider.complete(messages, {
      tier: "patcher",
      // 12 000 tokens to avoid mid-string truncation on large page compositions.
      // The compose prompt is ~400 tokens; a full page JSON is typically 2 000–6 000
      // output tokens — 12 k gives 2× headroom for complex requests.
      maxTokens: 12000,
      system,
    });

    try {
      // extractJsonPatch returns the outermost JSON array or object.
      // It auto-repairs truncated JSON before parsing.
      const parsed = extractJsonPatch(text);

      // If AI returned an array instead of {tree:[...]}, wrap it
      if (Array.isArray(parsed)) {
        return { tree: parsed };
      }
      return parsed;
    } catch (err) {
      lastError = String(err);
      onRetry?.(attempt, lastError);
      if (attempt === 3) {
        throw new Error(`composerAgentWS failed after 3 attempts: ${lastError}`);
      }
    }
  }

  return { tree: [] };
}
