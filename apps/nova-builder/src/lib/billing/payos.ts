// PayOS (VietQR) adapter — all PayOS constants and helpers live here.

export const PAYOS_API_URL = "https://api-merchant.payos.vn/v2/payment-requests";

// Plan slug → one-time VND price.
// Every price ends in 9 on purpose and is never rounded up: Pro 499k is the anchor
// ($19), Max is $49 at the same rate (49 x 499,000 / 19 = 1,286,842 -> 1,289,000).
export const PAYOS_PRICES_VND: Record<string, number> = {
  pro: 499000,
  max: 1289000,
  team: 749000,
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
