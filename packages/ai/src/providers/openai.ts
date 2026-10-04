// packages/ai/src/providers/openai.ts
// OpenAI GPT adapter (ADR-011)
import OpenAI, { type ClientOptions } from "openai";
import type { AIProvider, AIMessage, CompleteOptions } from "./base.js";
import { platformFetch, requireApiKey, resolveModel } from "./runtime.js";

const MODELS = {
  planner: "gpt-4o-mini",
  patcher: "gpt-4o",
} as const;

export class OpenAIProvider implements AIProvider {
  readonly name = "GPT (OpenAI)";
  readonly id = "openai" as const;

  private _client: OpenAI | null = null;
  private readonly _apiKey: string | undefined;

  constructor(apiKey?: string) {
    this._apiKey = apiKey ?? process.env["OPENAI_API_KEY"];
  }

  private get client(): OpenAI {
    if (!this._client) {
      this._client = new OpenAI({
        apiKey: requireApiKey(this._apiKey, "OPENAI_API_KEY", this.name),
        fetch: platformFetch as ClientOptions["fetch"],
      });
    }
    return this._client;
  }

  async complete(messages: AIMessage[], opts: CompleteOptions): Promise<string> {
    // OpenAI supports system as a message with role "system"
    const allMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      ...(opts.system ? [{ role: "system" as const, content: opts.system }] : []),
      ...messages
        .filter((m) => m.role !== "system")
        .map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
    ];

    const response = await this.client.chat.completions.create({
      model: resolveModel(this.id, opts.tier, MODELS),
      max_tokens: opts.maxTokens,
      messages: allMessages,
    });

    return response.choices[0]?.message?.content ?? "";
  }
}
