import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createHmac } from "crypto";
import { PAYOS_PRICES_VND, buildPayosSignData } from "@/lib/billing/payos";
import { sepayConfig, paymentCode } from "@/lib/billing/sepay";
import { isEligibleForWelcomeOffer } from "@/lib/billing/promoEligibility";
import { PROMO, promoPrice } from "@/lib/promo";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

/** Eligibility never blocks a checkout: any failure just means the regular price. */
async function welcomeOfferApplies(userId: string): Promise<boolean> {
  try {
    return await isEligibleForWelcomeOffer(getSupabaseAdmin(), userId);
  } catch {
    return false;
  }
}

// One discounted order at a time: an unpaid earlier one is superseded, so paying two plans at
// half price is not possible.
async function supersedeDiscountedOrders(db: ReturnType<typeof getSupabaseAdmin>, userId: string) {
  const { data: open } = await db.from("payment_orders").select("order_code, plan, amount").eq("user_id", userId).eq("status", "pending");
  const stale = ((open ?? []) as { order_code: string; plan: string; amount: number }[])
    .filter((o) => o.amount < (PAYOS_PRICES_VND[o.plan] ?? 0))
    .map((o) => o.order_code);
  if (stale.length > 0) await db.from("payment_orders").delete().in("order_code", stale);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const user = session?.user as { id?: string; email?: string } | undefined;
  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = user.id;

  const clientId = process.env.PAYOS_CLIENT_ID;
  const apiKey = process.env.PAYOS_API_KEY;
  const checksumKey = process.env.PAYOS_CHECKSUM_KEY;

  let body: { plan?: string; teamId?: string };
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const plan = body.plan ?? "pro";
  const teamId = body.teamId ?? "";

  const amount = PAYOS_PRICES_VND[plan];
  if (amount === undefined) {
    return NextResponse.json({ error: `Invalid plan: ${plan}` }, { status: 400 });
  }

  const orderCode = Number(`${Date.now()}`.slice(-10));

  // Welcome offer: the SERVER decides the price, for every payment method. The amount saved on
  // the order is what the QR asks for and what the bank-transfer webhook checks (PayOS gets the
  // same amount in its payment request), so the client cannot lower it.
  const discounted = await welcomeOfferApplies(userId);
  const chargeAmount = discounted ? promoPrice(amount) : amount;
  const discountPercent = discounted ? PROMO.percentOff : 0;

  // SePay: plain VietQR transfer to our own account, confirmed from the bank feed.
  const sepay = sepayConfig();
  if (sepay) {
    const db = getSupabaseAdmin();
    if (discounted) await supersedeDiscountedOrders(db, userId);
    const { error } = await db.from("payment_orders").insert({
      order_code: String(orderCode),
      provider: "sepay",
      user_id: userId,
      team_id: teamId || null,
      plan,
      amount: chargeAmount,
    });
    if (error) return NextResponse.json({ error: `Could not create the order: ${error.message}` }, { status: 500 });
    return NextResponse.json({
      provider: "sepay",
      qrCode: "",
      amount: chargeAmount,
      listAmount: amount,
      discountPercent,
      orderCode,
      accountNumber: sepay.accountNumber,
      accountName: sepay.accountName,
      bin: sepay.bankCode,
      description: paymentCode(orderCode),
    });
  }

  const isMock = !clientId || clientId.includes("your_") || !apiKey || !checksumKey;

  const customAccountNumber = process.env.PAYOS_CUSTOM_ACCOUNT_NUMBER;
  const customAccountName = process.env.PAYOS_CUSTOM_ACCOUNT_NAME;
  const customBin = process.env.PAYOS_CUSTOM_BIN;

  // A mock QR points at a made-up account: never show it outside local development.
  if (isMock && process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Payments are not configured yet. Please contact support." }, { status: 503 });
  }

  if (isMock) {
    return NextResponse.json({
      qrCode: "mock-vietqr-data",
      amount: chargeAmount,
      listAmount: amount,
      discountPercent,
      orderCode,
      accountNumber: customAccountNumber || "1234567890",
      accountName: customAccountName || "NOVA EDITOR MOCK TEST",
      bin: customBin || "970415",
      description: `nova ${plan} test`.slice(0, 25),
      isMock: true,
    });
  }

  const url = new URL(req.url);
  const origin = url.origin;

  // PayOS description max 25 chars; encode the intent for the webhook.
  const description = `nova ${plan}`.slice(0, 25);
  const returnUrl = `${origin}/settings/subscription?paid=1`;
  const cancelUrl = `${origin}/settings/subscription?cancelled=1`;

  const signData = buildPayosSignData({
    amount: chargeAmount,
    cancelUrl,
    description,
    orderCode,
    returnUrl,
  });
  const signature = createHmac("sha256", checksumKey).update(signData).digest("hex");

  const res = await fetch("https://api-merchant.payos.vn/v2/payment-requests", {
    method: "POST",
    headers: {
      "x-client-id": clientId,
      "x-api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      orderCode,
      amount: chargeAmount,
      description,
      returnUrl,
      cancelUrl,
      signature,
      // Echoed back in the webhook payload so it can attribute the payment.
      items: [{ name: `nova:${plan}:${userId}:${teamId}`, quantity: 1, price: chargeAmount }],
    }),
  });

  const json = (await res.json()) as {
    code?: string;
    desc?: string;
    data?: {
      bin?: string;
      accountNumber?: string;
      accountName?: string;
      amount?: number;
      description?: string;
      orderCode?: number;
      qrCode?: string;
    };
  };

  console.log("[PayOS API Response]:", JSON.stringify(json, null, 2));

  if (json.code !== "00" || !json.data) {
    return NextResponse.json({ error: json.desc ?? "PayOS checkout failed" }, { status: 502 });
  }

  return NextResponse.json({
    qrCode: json.data.qrCode,
    amount: json.data.amount,
    orderCode: json.data.orderCode,
    accountNumber: json.data.accountNumber,
    accountName: json.data.accountName,
    bin: json.data.bin,
    description: json.data.description,
    listAmount: amount,
    discountPercent,
  });
}
