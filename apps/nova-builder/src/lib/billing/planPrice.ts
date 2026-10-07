import { PAYOS_PRICES_VND } from "./payos";
import { fmt, formatNumber, type I18nBillingDictionary } from "@/lib/i18n";

/** Monthly price on plan cards — the same VND amount the VietQR checkout charges. */
export function planPriceLabel(tier: string, b: I18nBillingDictionary, locale: string): string {
  return fmt(b.pricePerMonth, { price: `${formatNumber(PAYOS_PRICES_VND[tier] ?? 0, locale)} VND` });
}
