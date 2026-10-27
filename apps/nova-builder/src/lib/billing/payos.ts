// PayOS (VietQR) adapter — all PayOS constants and helpers live here.

export const PAYOS_API_URL = "https://api-merchant.payos.vn/v2/payment-requests";

// Plan slug → one-time VND price.
// Every price ends in 9 on purpose. Pro and Team were halved on 2026-10-27 (Pro 499k -> 249k,
// Team 749k -> 379k: half is 374.5k, and 379k is the nearest price that ends in 9). Max keeps
// its original price (49 x 499,000 / 19 = 1,286,842 -> 1,289,000).
export const PAYOS_PRICES_VND: Record<string, number> = {
  pro: 249000,
  max: 1289000,
  team: 379000,
  credits: 99000,
};

export function buildPayosSignData(fields: {
  amount: number;
  cancelUrl: string;
  description: string;
  orderCode: number;
  returnUrl: string;
}): string {
  // PayOS signature: alphabetically sorted core fields joined with &.
  return `amount=${fields.amount}&cancelUrl=${fields.cancelUrl}&description=${fields.description}&orderCode=${fields.orderCode}&returnUrl=${fields.returnUrl}`;
}
