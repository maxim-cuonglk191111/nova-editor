// R3 (P0-2) — PayOS webhook (one-time VietQR payments).
// Verifies the payload signature (HMAC-SHA256 of the alphabetically-sorted
// data fields with the checksum key), then applies the purchase:
//   plan purchase  → users.tier / teams.plan
//   credit top-up  → users.credits += pack size
// Intent is carried in the item name set at checkout: "nova:<plan>:<userId>:<teamId>".
// Public route (middleware whitelists /api/billing/webhook).

import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { applyPurchase } from "@/lib/billing/grant";

type PayOSWebhook = {
  code?: string;
  signature?: string;
  data?: Record<string, unknown> & {
    orderCode?: number;
    amount?: number;
    description?: string;
    items?: Array<{ name?: string }>;
  };
};

// PayOS signs the `data` object: keys sorted alphabetically, joined as
// key=value&key=value, HMAC-SHA256 with the checksum key.
function signData(data: Record<string, unknown>, checksumKey: string): string {
  const sorted = Object.keys(data)
    .filter((k) => k !== "items")
    .sort()
    .map((k) => {
      const v = data[k];
      const s = v === null || v === undefined ? "" : typeof v === "object" ? JSON.stringify(v) : String(v);
      return `${k}=${s}`;
    })
    .join("&");
  return createHmac("sha256", checksumKey).update(sorted).digest("hex");
}

export async function POST(req: Request) {
  const checksumKey = process.env.PAYOS_CHECKSUM_KEY;
  if (!checksumKey) return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });

  const body = (await req.json()) as PayOSWebhook;
  if (!body.data || !body.signature) {
    return NextResponse.json({ error: "Malformed payload" }, { status: 400 });
  }

  const expected = signData(body.data, checksumKey);
  const sigBuf = Buffer.from(body.signature, "utf8");
  const expBuf = Buffer.from(expected, "utf8");
  if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  // Only successful payments mutate state.
  if (body.code !== "00") return NextResponse.json({ ok: true, ignored: true });

  // Intent: "nova:<plan>:<userId>:<teamId>" from the checkout item name.
  const itemName = body.data.items?.[0]?.name ?? "";
  const [tag, plan, userId, teamId] = itemName.split(":");
  if (tag !== "nova" || !plan) return NextResponse.json({ ok: true, ignored: true });

  // FA-003: idempotency lives in applyPurchase (order code is the primary key).
  const orderCode = body.data.orderCode;
  if (orderCode === undefined || orderCode === null) {
    return NextResponse.json({ error: "Missing orderCode" }, { status: 400 });
  }
  const result = await applyPurchase(getSupabaseAdmin(), {
    orderCode: String(orderCode),
    provider: "payos",
    plan,
    userId: userId || null,
    teamId: teamId || null,
    amount: body.data.amount ?? 0,
  });
  return NextResponse.json({ ok: true, alreadyProcessed: result === "duplicate" });
}
