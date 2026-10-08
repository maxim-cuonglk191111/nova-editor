// POST /api/ai/content — AI fills placeholder text in the current page.
// Takes a list of { instanceId, currentText } objects and a topic/tone prompt.
// Returns { fills: { instanceId: string; text: string }[] }.
// Auth and credit logic identical to /api/ai.

import { getToken } from "next-auth/jwt";
import {
  getOrProvisionUser,
  deductCredit,
  getMonthlySpentToday,
} from "@/lib/supabase-server";
import type { getProvider, ProviderName } from "@studio/ai";
import { withProviderFallback } from "@/lib/ai-fallback";
import { dailyCreditCap, decideCreditSource } from "@/lib/tiers";
import { MAX_FILL_TEXTS, type TextInstance } from "@/lib/textInstances";

type Fill = { instanceId: string; text: string };
const BATCH = 20;

async function generateContent(
  provider: ReturnType<typeof getProvider>,
  topic: string,
  instances: TextInstance[]
): Promise<Fill[]> {
  const list = instances
    .map((i, idx) => `${idx + 1}. [${i.instanceId}] "${i.currentText || "(empty)"}"`)
    .join("\n");

  const prompt = `You rewrite the text of a web page. The site owner's instruction:
"${topic}"

Rewrite EVERY element below following that instruction (e.g. translate, change the tone, fit a new topic).
If an element is a placeholder or empty, write fitting copy. Keep prices, numbers, phone numbers,
addresses and brand names unless the instruction says to change them. Keep each text about as long
as the original. Write in the language the instruction asks for; otherwise in the instruction's language.
Reply ONLY with a JSON array containing one entry per element: [{ "instanceId": "...", "text": "..." }, ...]

Elements:
${list}`;

  const raw = await provider.complete(
    [{ role: "user", content: prompt }],
    { tier: "patcher", maxTokens: 3000 }
  );
  try {
    const match = raw.match(/\[[\s\S]*\]/);
    if (!match) return [];
    return JSON.parse(match[0]) as { instanceId: string; text: string }[];
  } catch {
    return [];
  }
}

export async function POST(req: Request) {
  const token = await getToken({ req: req as Parameters<typeof getToken>[0]["req"] });
  if (!token?.githubId && !token?.email) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let user: Awaited<ReturnType<typeof getOrProvisionUser>>;
  try {
    user = await getOrProvisionUser(token);
  } catch {
    return Response.json({ error: "User not found" }, { status: 404 });
  }

  const { topic, instances, provider: clientProvider } = (await req.json()) as {
    topic: string;
    instances: TextInstance[];
    provider?: ProviderName;
  };

  if (!topic?.trim() || !instances?.length) {
    return Response.json({ error: "topic and instances are required" }, { status: 400 });
  }

  if (instances.length > MAX_FILL_TEXTS || !instances.every((i) => typeof i?.instanceId === "string" && typeof i.currentText === "string")) {
    return Response.json({ error: "Too many or malformed text elements" }, { status: 400 });
  }

  const creditCost = Math.max(1, Math.ceil(instances.length / 5));

  const cap = dailyCreditCap(user.tier);
  const spentTodayMonthly = cap !== null ? await getMonthlySpentToday(user.id) : 0;
  const decision = decideCreditSource({
    cost: creditCost,
    monthly: user.credits_remaining,
    topup: user.topup_credits_remaining,
    dailyCap: cap,
    spentTodayMonthly,
  });
  if (!decision.ok) {
    return Response.json({ error: "Insufficient credits" }, { status: 402 });
  }

  // One AI call per batch keeps each answer within the model's output budget.
  const fills: Fill[] = [];
  let lastErr: unknown;
  for (let i = 0; i < instances.length; i += BATCH) {
    const batch = instances.slice(i, i + BATCH);
    const ids = new Set(batch.map((b) => b.instanceId));
    try {
      const out = await withProviderFallback(clientProvider, (p) => generateContent(p, topic, batch), (f) => f.length > 0);
      fills.push(...out.filter((f) => ids.has(f.instanceId) && typeof f.text === "string"));
    } catch (err) {
      lastErr = err;
    }
  }
  if (fills.length === 0) {
    console.error("[api/ai/content] no fills:", String(lastErr ?? "empty answers"));
    return Response.json({ error: "AI is busy — try again in a minute." }, { status: 502 });
  }
  // Charge for what was filled, never more than the amount checked above.
  const charged = Math.min(creditCost, Math.max(1, Math.ceil(fills.length / 5)));
  await deductCredit(user.id, null, charged, decision.source === "topup");
  return Response.json({ fills, creditCost: charged });
}
