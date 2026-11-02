// POST /api/ai/chat — one message of the AI tab's conversation about the page being edited.
// The client sends the request, a compact context (what the user pointed at) and the last few
// turns; the answer is a short reply plus operations the user can apply or discard. A new section
// takes a second AI call (the page composer). Auth, credits and rate limit are the same as
// POST /api/ai (aiGate); credits are deducted only after a valid answer (ADR-NB-005).
import { composeWithFallback, editWithFallback, languageInstruction, needsComposition, providerChain, PROVIDER_CREDIT_COST } from "@studio/ai";
import type { ChatTurn, EditContext, EditOp, ProviderName } from "@studio/ai";
import { deductCredit } from "@/lib/supabase-server";
import { openAiGate } from "@/lib/aiGate";
import { sectionPrompt } from "@/lib/aiSectionPrompt";

const MAX_MESSAGE = 2000;
const MAX_NODES = 300;
const MAX_SECTIONS = 60;
const MAX_NEW_SECTIONS = 2;
const PROVIDERS = new Set(["groq", "mistral", "google", "openrouter", "openai", "anthropic"]);

type Body = {
  message?: unknown;
  context?: unknown;
  history?: unknown;
  projectId?: unknown;
  /** "auto" (or missing) walks the whole fallback chain; a provider id puts that one first. */
  provider?: unknown;
};

function readContext(raw: unknown): EditContext | null {
  if (!raw || typeof raw !== "object") return null;
  const c = raw as Partial<EditContext>;
  if (typeof c.rootId !== "string" || !Array.isArray(c.nodes) || !Array.isArray(c.sections)) return null;
  if (c.nodes.length > MAX_NODES || c.sections.length > MAX_SECTIONS) return null;
  const scope = c.scope === "element" || c.scope === "section" ? c.scope : "page";
  return {
    scope,
    pageName: typeof c.pageName === "string" ? c.pageName.slice(0, 80) : "Page",
    rootId: c.rootId,
    sections: c.sections.filter((s) => s && typeof s.id === "string").map((s) => ({ id: s.id, label: String(s.label ?? "").slice(0, 80) })),
    targetId: typeof c.targetId === "string" ? c.targetId : undefined,
    nodes: c.nodes.filter((n) => n && typeof n.id === "string" && typeof n.component === "string"),
  };
}

function readHistory(raw: unknown): ChatTurn[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((t): t is ChatTurn => !!t && (t.role === "user" || t.role === "assistant") && typeof t.text === "string")
    .slice(-4)
    .map((t) => ({ role: t.role, text: t.text.slice(0, 240) }));
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as Body;
  const message = typeof body.message === "string" ? body.message.trim() : "";
  const context = readContext(body.context);
  if (!message || message.length > MAX_MESSAGE || !context) {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
  const projectId = typeof body.projectId === "string" ? body.projectId : null;
  const preferred = typeof body.provider === "string" && PROVIDERS.has(body.provider) ? body.provider : undefined;
  const chain = providerChain([preferred, process.env["AI_PROVIDER"]], process.env["AI_FALLBACK_PROVIDERS"]);
  const cost = PROVIDER_CREDIT_COST[chain[0]!] ?? 1;

  const gate = await openAiGate(req, cost, projectId);
  if (gate.kind === "deny") return gate.response;

  const started = Date.now();
  try {
    const edit = await editWithFallback(chain, { message, context, history: readHistory(body.history) });
    let usedProvider: ProviderName = edit.provider;
    const failures = [...edit.failures];

    // New or replaced sections: one composer call each, the first few only.
    const ops: EditOp[] = [];
    let composed = 0;
    const dropped = [...edit.result.dropped];
    for (const op of edit.result.ops) {
      if (!needsComposition(op)) { ops.push(op); continue; }
      if (composed >= MAX_NEW_SECTIONS) { dropped.push("too many new sections"); continue; }
      composed++;
      try {
        const built = await composeWithFallback(chain, sectionPrompt(op, context, languageInstruction(message)));
        usedProvider = built.provider;
        ops.push({ ...op, composition: built.composition });
      } catch (err) {
        failures.push({ provider: chain[0]!, error: err instanceof Error ? err.message : String(err) });
        dropped.push(`${op.op}: section could not be built`);
      }
    }
    if (ops.length === 0 && !edit.result.reply) {
      return Response.json({ error: "AI is busy, try again in a minute.", code: "busy" }, { status: 502 });
    }

    // ADR-NB-005: charge only now that the answer is valid.
    const charged = Math.min(PROVIDER_CREDIT_COST[usedProvider] ?? 1, cost);
    if (gate.kind === "user") await deductCredit(gate.user.id, projectId, charged, gate.source === "topup");

    return Response.json({
      reply: edit.result.reply,
      ops,
      dropped,
      provider: usedProvider,
      ms: Date.now() - started,
      creditCost: gate.kind === "user" ? charged : 0,
      creditsRemaining: gate.kind === "user" ? gate.user.credits_remaining + gate.user.topup_credits_remaining - charged : null,
      fallbacks: failures.map((f) => ({ provider: f.provider, error: f.error.slice(0, 160) })),
    });
  } catch (err) {
    const detail = err instanceof Error ? err.message : "AI request failed";
    console.error("[ai/chat] failed:", detail);
    return Response.json({ error: "AI is busy, try again in a minute.", code: "busy", detail }, { status: 502 });
  }
}
