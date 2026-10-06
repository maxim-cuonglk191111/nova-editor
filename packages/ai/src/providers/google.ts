// packages/ai/src/providers/google.ts
// Google Gemini adapter (ADR-011)
import { GoogleGenerativeAI } from "@google/generative-ai";
import type { AIProvider, AIMessage, CompleteOptions } from "./base.js";
import { requireApiKey, resolveModel } from "./runtime.js";

// "-latest" aliases track Google's current GA models; pinned IDs (gemini-2.x) get
// retired for new API keys.
const MODELS = {
  planner: "gemini-flash-lite-latest",
  patcher: "gemini-flash-latest",
} as const;

// Free-tier Gemini models are often "overloaded" (503) or rate limited (429)
// one at a time; the next model in the list usually answers.
const BACKUP_MODELS = ["gemini-2.5-flash", "gemini-flash-lite-latest"];
const RETRYABLE = /\b(429|500|503|404)\b|overloaded|unavailable|not found/i;

export class GoogleProvider implements AIProvider {
  readonly name = "Gemini (Google)";
  readonly id = "google" as const;

  private _genAI: GoogleGenerativeAI | null = null;
  private readonly _apiKey: string;

  constructor(apiKey?: string) {
    this._apiKey = apiKey ?? process.env["GOOGLE_GENERATIVE_AI_API_KEY"] ?? "";
  }

  private get genAI(): GoogleGenerativeAI {
    if (!this._genAI) {
      this._genAI = new GoogleGenerativeAI(
        requireApiKey(this._apiKey, "GOOGLE_GENERATIVE_AI_API_KEY", this.name)
      );
    }
    return this._genAI;
  }

  async complete(messages: AIMessage[], opts: CompleteOptions): Promise<string> {
    const primary = resolveModel(this.id, opts.tier, MODELS);
    const models = [primary, ...BACKUP_MODELS.filter((m) => m !== primary)];
    let lastErr: unknown;
    for (const model of models) {
      try {
        return await this.completeWith(model, messages, opts);
      } catch (err) {
        lastErr = err;
        if (!RETRYABLE.test(err instanceof Error ? err.message : String(err))) throw err;
      }
    }
    throw lastErr;
  }

  private async completeWith(modelId: string, messages: AIMessage[], opts: CompleteOptions): Promise<string> {
    const model = this.genAI.getGenerativeModel({
      model: modelId,
      generationConfig: { maxOutputTokens: opts.maxTokens },
      // Inject system prompt via systemInstruction
      ...(opts.system ? { systemInstruction: { role: "system", parts: [{ text: opts.system }] } } : {}),
    });

    // Gemini uses alternating user/model turns; collapse system messages into user turn
    const history: { role: "user" | "model"; parts: { text: string }[] }[] = [];
    const nonSystem = messages.filter((m) => m.role !== "system");

    for (let i = 0; i < nonSystem.length - 1; i++) {
      const m = nonSystem[i]!;
      history.push({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      });
    }

    const lastMsg = nonSystem[nonSystem.length - 1];
    const userText = lastMsg?.content ?? "";

    const chat = model.startChat({ history });
    const result = await chat.sendMessage(userText);
    return result.response.text();
  }
}
