// SePay adapter — VietQR bank transfer confirmed by SePay's bank-account feed.
// The QR follows the NAPAS VietQR standard, so it can be paid from any Vietnamese
// banking app and from MoMo, ZaloPay and ShopeePay (all scan VietQR).
// Docs: https://docs.sepay.vn/tich-hop-webhooks.html, https://docs.sepay.vn/api-giao-dich.html

export type SepayConfig = {
  accountNumber: string;
  bankCode: string;
  accountName: string;
  apiToken?: string;
  webhookKey?: string;
};

export function sepayConfig(): SepayConfig | null {
  const accountNumber = process.env.SEPAY_ACCOUNT_NUMBER?.trim();
  const bankCode = process.env.SEPAY_BANK_CODE?.trim();
  if (!accountNumber || !bankCode) return null;
  return {
    accountNumber,
    bankCode,
    accountName: process.env.SEPAY_ACCOUNT_NAME?.trim() ?? "",
    apiToken: process.env.SEPAY_API_TOKEN?.trim() || undefined,
    webhookKey: process.env.SEPAY_WEBHOOK_KEY?.trim() || undefined,
  };
}

// Transfer description. Banks may upper-case it, add spaces or prefixes, so
// matching normalises both sides.
export const paymentCode = (orderCode: string | number) => `NOVA${orderCode}`;

const normalise = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]/g, "");

export function contentHasCode(content: string, code: string): boolean {
  return normalise(content).includes(normalise(code));
}

// The order code carried in a transfer description, if any.
export function orderCodeFromContent(content: string): string | null {
  const m = normalise(content).match(/NOVA(\d{6,})/);
  return m ? m[1]! : null;
}

type SepayTransaction = { id: string; amount_in: string; transaction_content: string };

// Looks for an incoming transfer carrying `code` for at least `amount` VND.
export async function findSepayPayment(
  cfg: SepayConfig,
  code: string,
  amount: number
): Promise<SepayTransaction | null> {
  if (!cfg.apiToken) return null;
  const url = new URL("https://my.sepay.vn/userapi/transactions/list");
  url.searchParams.set("account_number", cfg.accountNumber);
  url.searchParams.set("limit", "50");
  const res = await fetch(url, { headers: { Authorization: `Bearer ${cfg.apiToken}` } });
  if (!res.ok) throw new Error(`SePay API ${res.status}`);
  const json = (await res.json()) as { transactions?: SepayTransaction[] };
  return (
    (json.transactions ?? []).find(
      (t) => Number(t.amount_in) >= amount && contentHasCode(t.transaction_content ?? "", code)
    ) ?? null
  );
}
