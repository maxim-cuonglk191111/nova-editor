# AI providers — what works today, what it costs, what to pick when paying

Checked 2026-10-08 (task 009, batch 4 / 7a). Prices are list prices per 1M tokens from the sources
at the end; re-check the provider's own pricing page before paying.

## 1. What one request costs us

| Request | Input tokens | Output tokens |
|---|---|---|
| **Generate a whole page** (`POST /api/ai`, compose prompt ≈ 14k characters) | ≈ 4,500 | ≈ 6,000–10,000 (JSON of the page; reasoning models add ≈ 500–2,000) |
| AI Content Fill, 20 texts per batch | ≈ 1,500 | ≈ 1,500 |
| Accessibility suggestion | ≈ 300 | ≈ 300 |
| AI panel message (batch 6 design) | ≈ 3,000 | ≈ 1,000–4,000 |

"Per page" below = 4,500 in + 8,000 out.

## 2. Production today (live check `GET /api/ai/providers?live=1`, 2026-10-08)

| Provider (chain order) | Key | Live result | Effect |
|---|---|---|---|
| Google Gemini | set | ❌ 400 "User location is not supported" — the Worker runs in a region Gemini's API refuses | adds a failed call (≈ 0.3 s) to every request |
| Mistral | set | ❌ 429 even for a 16-token call — the account is throttled / out of free quota | adds a failed call (≈ 2 s) |
| Groq | set | ✅ `gpt-oss-120b`, `gpt-oss-20b`, `qwen3.8-27b` only (Llama 3.x / 4 → 404) | **the only provider that answers**; free tier 8k tokens/min per model, prompt + `max_tokens` counted → a full page barely fits or is cut short |
| OpenRouter | set | ✅ small calls; prepaid credit nearly used up (a call may ask for ≤ ≈ 5,400 tokens) | fails on full pages (402) |

Measured in batch 4 (six businesses, EN + VI): **2 of 6 pages generated** on the free setup, and those
two lost their last sections (FAQ, contact form) to the output limit. This, not the prompt, is the
main quality problem of AI pages today.

## 3. Options compared

Quality: Artificial Analysis Intelligence Index where published (higher is better; same index
version), plus what we measured ourselves. "Region" = can the Cloudflare Worker call it directly.

| Option | Price in / out | Per page | Free tier | Region | Quality | Notes |
|---|---|---|---|---|---|---|
| **Groq — gpt-oss-120b, Developer (pay as you go)** | $0.15 / $0.60 | **≈ $0.0055** (≈ 140 đ) | free: 8k tokens/min, 1k req/day | ✅ | Index 12; ours: complete pages when not cut, good Vietnamese (spa page) | Same key, **no code change**; limit becomes 250k tokens/min; fastest (5–30 s/page) |
| **Cloudflare Workers AI — gpt-oss-120b** | $0.35 / $0.75 | ≈ $0.0076 | **10,000 Neurons/day free ≈ 14 pages/day** | ✅ runs inside Cloudflare | same model as above | needs a small provider adapter (AI binding); beyond the free daily allocation needs Workers Paid ($5/month) |
| Gemini 2.5 Flash-Lite | $0.10 / $0.40 | ≈ $0.0037 | 15 req/min, 1,000/day | ❌ direct (region) → via OpenRouter only (+ ≈ 5% fee) | Index 7 (non-reasoning) | cheapest; weakest at long structured JSON — test before switching |
| Gemini 2.5 Flash | $0.30 / $2.50 | ≈ $0.021 | 10 req/min, ≈ 500/day | ❌ direct → OpenRouter | Index 10 (non-reasoning), 13 (reasoning) | the model OpenRouter already uses (`google/gemini-2.5-flash`) |
| OpenAI GPT-5 nano | $0.05 / $0.40 | ≈ $0.0035 + reasoning | — | ✅ | not measured | reasoning model (bills thinking tokens); adapter exists (`openai`), no key |
| OpenAI GPT-5 mini | $0.125 / $1.00 | ≈ $0.009 + reasoning | — | ✅ | not measured | — |
| Mistral Small 4 | $0.15 / $0.60 | ≈ $0.0055 | "Experiment": ≈ 1 req/s, ≈ 1B tokens/month | ✅ | not measured | our key is throttled (429); code uses `mistral-medium-latest` ($1.50 / $7.50 → ≈ $0.067/page) — switch to Small if used |
| DeepSeek V4.1 Flash | $0.30 / $1.20 (off-peak half) | ≈ $0.011 (≈ $0.0055 off-peak) | — | ✅ | not measured | no adapter yet |
| Cerebras — gpt-oss-120b | $0.35 / $0.75 | ≈ $0.0076 | trial only ($5 credit, 30 days) | ✅ | same model | very fast; no permanent free tier since 2026-07 |
| Claude Haiku 4.5 | $1.00 / $5.00 | ≈ $0.045 | — | ✅ | not measured here (strong at structured output) | 8× the Groq price; adapter exists (`anthropic`), no key |
| OpenRouter `:free` models | $0 | $0 | 50 req/day (1,000/day after $10 lifetime credit), 20/min | ✅ | varies by model | free models change often; fine as a last fallback |

1,000 pages ≈ $3.5 (Flash-Lite) · $5.5 (Groq Developer) · $7.6 (Workers AI) · $21 (Gemini Flash) · $45 (Haiku 4.5).

## 4. Recommendation

**Now (no spending):**
1. Put Groq first and drop the two providers that always fail: `AI_PROVIDER=groq`,
   `AI_FALLBACK_PROVIDERS=openrouter` (production env, no code change) — every request currently
   wastes ≈ 2.5 s on Gemini + Mistral before reaching Groq.
2. Add **Cloudflare Workers AI** as a provider (gpt-oss-120b, ≈ 14 free full pages a day, no region
   problem, no new account) — small adapter, behind `AI_FALLBACK_PROVIDERS` so the default does not change.

**When you start paying — Groq Developer (gpt-oss-120b):** ≈ $0.0055 per page (≈ 140 VND), same
key and code, 250k tokens/min removes today's failures and cut-off pages. Set a monthly spend
limit in the Groq console. Keep Workers AI and OpenRouter as fallbacks.

**If pages need better design/copy later:** compare GPT-5 mini and Claude Haiku 4.5 on the six
`visitor.spec.ts` businesses before switching (2–8× the price).

## 5. Environment switches (production keeps working without any of them)

| Variable | Meaning | Production today |
|---|---|---|
| `AI_PROVIDER` | first provider tried | together with the next row the effective chain is `google → mistral → groq → openrouter` |
| `AI_FALLBACK_PROVIDERS` | comma list tried after it | (see above) |
| `AI_MODEL_<PROVIDER>_<TIER>` | override a model id (`TIER` = `PLANNER` / `PATCHER`) | none |
| `AI_MAX_TOKENS_<PROVIDER>` | cap the output size | none |
| `<PROVIDER>_API_KEY` (`GROQ_`, `MISTRAL_`, `GOOGLE_GENERATIVE_AI_`, `OPENROUTER_`, `OPENAI_`, `ANTHROPIC_`) | keys | Groq, Mistral, Google, OpenRouter set |

Check them any time (signed in): `/api/ai/providers` (`?live=1` makes one tiny call per provider).

## Sources (checked 2026-10-08)

- Groq: [models](https://console.groq.com/docs/models), [rate limits](https://console.groq.com/docs/rate-limits), [pricing summary (CloudZero)](https://www.cloudzero.com/blog/groq-pricing/)
- Cloudflare Workers AI: [gpt-oss-120b](https://developers.cloudflare.com/workers-ai/models/gpt-oss-120b/), [pricing](https://developers.cloudflare.com/workers-ai/platform/pricing/index.md)
- Gemini: [pricing (morphllm)](https://www.morphllm.com/gemini-api-pricing), [free tier limits (aipromptshub)](https://aipromptshub.co/blog/gemini-api-free-tier-rate-limits)
- OpenAI: [pricing (benchlm)](https://benchlm.ai/openai/api-pricing)
- Mistral: [pricing (benchlm)](https://benchlm.ai/mistral/api-pricing), [free tier (agentdeals)](https://agentdeals.dev/vendor/mistral-ai)
- DeepSeek: [pricing (benchlm)](https://benchlm.ai/deepseek/api-pricing)
- Cerebras: [pricing and trial (morphllm)](https://www.morphllm.com/cerebras-pricing)
- Anthropic: [Claude Haiku 4.5 (OpenRouter)](https://openrouter.ai/anthropic/claude-haiku-4.5)
- OpenRouter free models: [limits (OpenRouter help)](https://openrouter.zendesk.com/hc/en-us/articles/39501163636379-OpenRouter-Rate-Limits-What-You-Need-to-Know)
- Quality index: [Artificial Analysis — gpt-oss-120b vs Gemini 2.5 Flash-Lite](https://artificialanalysis.ai/models/comparisons/gpt-oss-120b-vs-gemini-2-5-flash-lite), [vs Gemini 2.5 Flash](https://artificialanalysis.ai/models/comparisons/gpt-oss-120b-vs-gemini-2-5-flash)
