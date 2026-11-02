// EDIT flow: a request about the page the user is looking at → operations on it. The answer is
// validated against the context it was given (validateEditReply) before anyone sees it, and the
// chain of providers is tried in order like the compose flow, so one busy free model does not
// end the conversation.
import type { AIProvider, AIMessage, ProviderName } from "../providers/base.js";
import { getProvider } from "../providers/registry.js";
import { buildEditPrompt } from "../prompts/edit.prompt.js";
import { extractJsonPatch } from "../utils/extractJson.js";
import { languageInstruction } from "./composerAgentWS.js";
import { validateEditReply, type EditContext, type EditReply } from "../utils/validateOps.js";

export type ChatTurn = { role: "user" | "assistant"; text: string };
export type EditInput = { message: string; context: EditContext; history?: ChatTurn[] };

const MAX_CONTEXT_CHARS = 14_000;
const MAX_HISTORY_TURNS = 4;
const MAX_TURN_CHARS = 240;

/** The context as compact JSON; when it is too big for a free tier, styles go first, then nodes at the end. */
export function serializeContext(ctx: EditContext): string {
  let json = JSON.stringify(ctx);
  if (json.length <= MAX_CONTEXT_CHARS) return json;
  json = JSON.stringify({ ...ctx, nodes: ctx.nodes.map(({ styles: _styles, ...rest }) => rest) });
  if (json.length <= MAX_CONTEXT_CHARS) return json;
  const nodes = [...ctx.nodes].map(({ styles: _styles, ...rest }) => rest);
  while (nodes.length > 1 && JSON.stringify({ ...ctx, nodes }).length > MAX_CONTEXT_CHARS) nodes.pop();
  return JSON.stringify({ ...ctx, nodes });
}

export function buildEditUserMessage(input: EditInput): string {
  const turns = (input.history ?? []).slice(-MAX_HISTORY_TURNS).map((t) => `${t.role === "user" ? "USER" : "ASSISTANT"}: ${t.text.slice(0, MAX_TURN_CHARS)}`);
  return [
    `CONTEXT (JSON): ${serializeContext(input.context)}`,
    turns.length > 0 ? `EARLIER IN THIS CONVERSATION:\n${turns.join("\n")}` : "",
    `REQUEST: ${input.message}`,
    languageInstruction(input.message),
    "Output the JSON object now.",
  ].filter(Boolean).join("\n\n");
}

/** One provider, up to two tries when the answer is not usable JSON. Provider failures propagate. */
export async function editAgent(provider: AIProvider, input: EditInput): Promise<EditReply> {
  const system = buildEditPrompt();
  const userContent = buildEditUserMessage(input);
  let lastError = "";

  for (let attempt = 1; attempt <= 2; attempt++) {
    const messages: AIMessage[] = attempt === 1
      ? [{ role: "user", content: userContent }]
      : [
          { role: "user", content: userContent },
          { role: "assistant", content: "{}" },
          { role: "user", content: `That was not usable: ${lastError}. Answer again with ONLY the JSON object {"reply": "...", "ops": [...]}.` },
        ];
    const text = await provider.complete(messages, { tier: "patcher", maxTokens: 3000, system });
    try {
      const reply = validateEditReply(extractJsonPatch(text), input.context);
      if (reply.reply || reply.ops.length > 0) return reply;
      lastError = "no reply and no operations";
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
    }
  }
  throw new Error(`editAgent failed: ${lastError}`);
}

export type EditFallbackResult = { result: EditReply; provider: ProviderName; failures: { provider: ProviderName; error: string }[] };

// Rate limits and "model overloaded" usually clear within seconds.
const TRANSIENT = /\b(429|503)\b|overloaded|rate.?limit|unavailable/i;

export async function editWithFallback(chain: ProviderName[], input: EditInput, retryDelayMs = 2000): Promise<EditFallbackResult> {
  const failures: EditFallbackResult["failures"] = [];
  for (const name of chain) {
    try {
      let result: EditReply;
      try {
        result = await editAgent(getProvider(name), input);
      } catch (err) {
        if (!TRANSIENT.test(err instanceof Error ? err.message : String(err))) throw err;
        await new Promise((r) => setTimeout(r, retryDelayMs));
        result = await editAgent(getProvider(name), input);
      }
      return { result, provider: name, failures };
    } catch (err) {
      failures.push({ provider: name, error: err instanceof Error ? err.message : String(err) });
    }
  }
  throw new Error(`All providers failed: ${failures.map((f) => `${f.provider}: ${f.error.slice(0, 120)}`).join(" | ")}`);
}
