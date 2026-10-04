// packages/ai/src/providers/openrouter.ts
// OpenRouter adapter — aggregates many providers, free models available with ":free" suffix.
// Docs: https://openrouter.ai/docs
// Free model list: https://openrouter.ai/models?q=:free
import OpenAI, { type ClientOptions } from "openai";
import type { AIProvider, AIMessage, CompleteOptions } from "./base.js";
import { platformFetch, requireApiKey, resolveModel } from "./runtime.js";

// Pinned models: openrouter/auto picked a different model per request, so the
// same prompt produced anything from a full landing page to a page missing its
// navbar and hero. Gemini via OpenRouter is also not region-blocked from the
// Worker's colo the way the direct Google API is. Override with
// AI_MODEL_OPENROUTER_<TIER> when a model is retired.
const MODELS = {
  planner: "google/gemini-2.5-flash-lite",
  patcher: "google/gemini-2.5-flash",
} as const;

export class OpenRouterProvider implements AIProvider {
  readonly name = "OpenRouter (Gemma 3 / Llama 3)";
  readonly id = "openrouter" as const;

  private _client: OpenAI | null = null;
  private readonly _apiKey: string | undefined;

  constructor(apiKey?: string) {
    this._apiKey = apiKey ?? process.env["OPENROUTER_API_KEY"];
  }

  private get client(): OpenAI {
    if (!this._client) {
      this._client = new OpenAI({
        baseURL: "https://openrouter.ai/api/v1",
        apiKey: requireApiKey(this._apiKey, "OPENROUTER_API_KEY", this.name),
        fetch: platformFetch as ClientOptions["fetch"],
        // OpenRouter asks for these headers for proper attribution + dashboard tracking.
        defaultHeaders: {
          "HTTP-Referer": "https://nova-editor.app",
          "X-Title": "Nova No-Code Editor",
        },
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
      max_tokens: opts.maxTokens,
      messages: allMessages,
    });

    return response.choices[0]?.message?.content ?? "";
  }
}
