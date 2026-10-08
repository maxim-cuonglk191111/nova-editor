// packages/ai/src/providers/groq.ts
// Groq LPU adapter — OpenAI-compatible, free tier (no credit card required).
// Docs: https://console.groq.com/docs/openai
import OpenAI, { type ClientOptions } from "openai";
import type { AIProvider, AIMessage, CompleteOptions } from "./base.js";
import { capTokens, platformFetch, requireApiKey, resolveModel } from "./runtime.js";

// Groq model IDs (as of 2025). Updated via: https://console.groq.com/docs/models
const MODELS = {
  planner: "openai/gpt-oss-20b",        // llama-3.1-8b-instant is not available to this key (404)
  patcher: "openai/gpt-oss-120b",       // strongest free JSON model; llama-3.3-70b-versatile is the fallback
} as const;

// The free tier allows 8k tokens per minute per model and counts prompt + max_tokens
// against it (over → 413 "Request too large"), so max_tokens is sized to what is left.
const MAX_TOKENS = 6000;
const TPM = 8000;
// ~3.5 characters per token for this mostly-English JSON prompt, 300 tokens of margin.
const fitTokens = (cap: number, promptChars: number) => Math.max(1024, Math.min(cap, TPM - 300 - Math.ceil(promptChars / 3.5)));

// The next model is tried when one refuses for size, rate or retirement. Each model has
// its own per-minute budget. Models this key can use (GET /api/ai/providers, 2026-10-08):
// gpt-oss-120b, gpt-oss-20b, qwen3.8-27b — Llama 4 Scout and Llama 3.x answer 404.
const BACKUP_MODELS: { id: string; maxTokens: number }[] = [
  { id: "openai/gpt-oss-20b", maxTokens: MAX_TOKENS },
  { id: "qwen/qwen3.8-27b", maxTokens: MAX_TOKENS },
];
const RETRYABLE = /\b(413|429|404)\b|too large|rate limit|decommissioned|does not exist/i;
// gpt-oss models reason before answering and those tokens count against max_tokens:
// at the default effort a page JSON was cut short (thin pages, missing sections).
const REASONING_MODELS = /^openai\/gpt-oss/;

export class GroqProvider implements AIProvider {
  readonly name = "Groq (Llama 3)";
  readonly id = "groq" as const;

  private _client: OpenAI | null = null;
  private readonly _apiKey: string | undefined;

  constructor(apiKey?: string) {
    this._apiKey = apiKey ?? process.env["GROQ_API_KEY"];
  }

  private get client(): OpenAI {
    if (!this._client) {
      this._client = new OpenAI({
        baseURL: "https://api.groq.com/openai/v1",
        apiKey: requireApiKey(this._apiKey, "GROQ_API_KEY", this.name),
        fetch: platformFetch as ClientOptions["fetch"],
      });
    }
    return this._client;
  }

  async complete(messages: AIMessage[], opts: CompleteOptions): Promise<string> {
    const allMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      ...(opts.system ? [{ role: "system" as const, content: opts.system }] : []),
      ...messages
        .filter((m) => m.role !== "system")
        .map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
    ];

    const primary = { id: resolveModel(this.id, opts.tier, MODELS), maxTokens: MAX_TOKENS };
    const candidates = [primary, ...BACKUP_MODELS.filter((m) => m.id !== primary.id)];
    const promptChars = allMessages.reduce((n, m) => n + String(m.content ?? "").length, 0);
    const errors: string[] = [];
    for (const model of candidates) {
      try {
        const response = await this.client.chat.completions.create({
          model: model.id,
          max_tokens: fitTokens(capTokens(this.id, opts.maxTokens, model.maxTokens), promptChars),
          messages: allMessages,
          ...(REASONING_MODELS.test(model.id) ? { reasoning_effort: "low" as const } : {}),
        });
        return response.choices[0]?.message?.content ?? "";
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        if (!RETRYABLE.test(message)) throw err;
        // Keep every model's reason: the last one alone hid why the first was refused.
        errors.push(`${model.id}: ${message.slice(0, 160)}`);
      }
    }
    throw new Error(errors.join(" | "));
  }
}
