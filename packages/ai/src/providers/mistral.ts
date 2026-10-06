// packages/ai/src/providers/mistral.ts
// Mistral AI adapter — open-weight models are free, no billing required.
// Docs: https://docs.mistral.ai/api/
// The free "Experiment" tier serves the "-latest" aliases; the open-mixtral models are retired.
import OpenAI, { type ClientOptions } from "openai";
import type { AIProvider, AIMessage, CompleteOptions } from "./base.js";
import { platformFetch, requireApiKey, resolveModel } from "./runtime.js";

const MODELS = {
  planner: "mistral-small-latest",
  patcher: "mistral-medium-latest",
} as const;

export class MistralProvider implements AIProvider {
  readonly name = "Mistral (Mixtral)";
  readonly id = "mistral" as const;

  private _client: OpenAI | null = null;
  private readonly _apiKey: string | undefined;

  constructor(apiKey?: string) {
    this._apiKey = apiKey ?? process.env["MISTRAL_API_KEY"];
  }

  private get client(): OpenAI {
    if (!this._client) {
      this._client = new OpenAI({
        baseURL: "https://api.mistral.ai/v1",
        apiKey: requireApiKey(this._apiKey, "MISTRAL_API_KEY", this.name),
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
      max_tokens: opts.maxTokens,
      messages: allMessages,
    });

    return response.choices[0]?.message?.content ?? "";
  }
}
