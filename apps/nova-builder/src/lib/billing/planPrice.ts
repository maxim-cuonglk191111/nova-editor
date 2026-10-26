import { PAYOS_PRICES_VND } from "./payos";
import { formatNumber } from "@/lib/i18n";

/** Monthly price on plan cards — the same VND amount the VietQR checkout charges. */
export function formatVnd(amount: number, locale: string): string {
  return `${formatNumber(amount, locale)} VND`;
}

export function planPriceVnd(tier: string, locale: string): string {
  return formatVnd(PAYOS_PRICES_VND[tier] ?? 0, locale);
}
