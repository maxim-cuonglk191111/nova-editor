// packages/ai/src/providers/groq.ts
// Groq LPU adapter — OpenAI-compatible, free tier (no credit card required).
// Docs: https://console.groq.com/docs/openai
import OpenAI, { type ClientOptions } from "openai";
import type { AIProvider, AIMessage, CompleteOptions } from "./base.js";
import { capTokens, platformFetch, requireApiKey, resolveModel } from "./runtime.js";

// Groq model IDs (as of 2025). Updated via: https://console.groq.com/docs/models
const MODELS = {
  planner: "llama-3.1-8b-instant",      // Fast 8B — ideal for short planning prompts
  // gpt-oss-120b's free tier (8k TPM) rejects a full-page request with 413;
  // Llama 4 Scout allows 30k TPM and up to 8k completion tokens.
  patcher: "meta-llama/llama-4-scout-17b-16e-instruct",
} as const;

const MAX_TOKENS = 8000;

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

    const response = await this.client.chat.completions.create({
      model: resolveModel(this.id, opts.tier, MODELS),
      max_tokens: capTokens(this.id, opts.maxTokens, MAX_TOKENS),
      messages: allMessages,
    });

    return response.choices[0]?.message?.content ?? "";
  }
}
