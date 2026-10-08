// packages/ai/src/providers/groq.ts
// Groq LPU adapter — OpenAI-compatible, free tier (no credit card required).
// Docs: https://console.groq.com/docs/openai
import OpenAI, { type ClientOptions } from "openai";
import type { AIProvider, AIMessage, CompleteOptions } from "./base.js";
import { capTokens, platformFetch, requireApiKey, resolveModel } from "./runtime.js";

// Groq model IDs (as of 2025). Updated via: https://console.groq.com/docs/models
const MODELS = {
  planner: "llama-3.1-8b-instant",      // Fast 8B — ideal for short planning prompts
  patcher: "openai/gpt-oss-120b",       // llama-3.3-70b-versatile was retired; strongest free JSON model
} as const;

// The free tier allows 8k tokens per minute and counts max_tokens against it
// (12k → 413), so prompt + output must stay under that.
const MAX_TOKENS = 5000;

// The page-compose prompt (~4.5k tokens) + output no longer fits gpt-oss-120b's
// 8k TPM (413 "Request too large"). Llama 4 Scout allows 30k TPM on the free
// tier; it is tried when the first model refuses for size, rate or retirement.
const BACKUP_MODELS: { id: string; maxTokens: number }[] = [
  { id: "meta-llama/llama-4-scout-17b-16e-instruct", maxTokens: 8000 },
];
const RETRYABLE = /\b(413|429|404)\b|too large|rate limit|decommissioned|does not exist/i;

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
    const candidates = opts.tier === "patcher" ? [primary, ...BACKUP_MODELS.filter((m) => m.id !== primary.id)] : [primary];
    let lastErr: unknown;
    for (const model of candidates) {
      try {
        const response = await this.client.chat.completions.create({
          model: model.id,
          max_tokens: capTokens(this.id, opts.maxTokens, model.maxTokens),
          messages: allMessages,
        });
        return response.choices[0]?.message?.content ?? "";
      } catch (err) {
        lastErr = err;
        if (!RETRYABLE.test(err instanceof Error ? err.message : String(err))) throw err;
      }
    }
    throw lastErr;
  }
}
