// R4 (P0-3) — Transactional email over a provider's REST API (server-only).
// Brevo when BREVO_API_KEY is set, else Resend (RESEND_API_KEY). Plain fetch, no SDK.
// Degrades to a logged no-op when neither is set so every caller can fire-and-forget.

type Mail = { to: string; subject: string; html: string };

function sender(): { name: string; email: string; raw: string } {
  const raw = process.env.EMAIL_FROM ?? "Nova <noreply@nova.build>";
  const m = raw.match(/^\s*(.*?)\s*<([^>]+)>\s*$/);
  return m ? { name: m[1] || "Nova", email: m[2]!, raw } : { name: "Nova", email: raw.trim(), raw };
}

// QA accounts (e2e specs) use this mailbox-less domain; Brevo's sandbox validates
// the request without sending, so test runs neither bounce nor use the daily quota.
const SANDBOX_DOMAIN = "@testqa.dev";

function brevoRequest(apiKey: string, mail: Mail): Promise<Response> {
  const from = sender();
  return fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": apiKey, "Content-Type": "application/json", accept: "application/json" },
    body: JSON.stringify({
      sender: { name: from.name, email: from.email },
      to: [{ email: mail.to }],
      subject: mail.subject,
      htmlContent: mail.html,
      ...(mail.to.toLowerCase().endsWith(SANDBOX_DOMAIN) ? { headers: { "X-Sib-Sandbox": "drop" } } : {}),
    }),
  });
}

function resendRequest(apiKey: string, mail: Mail): Promise<Response> {
  return fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: sender().raw, to: [mail.to], subject: mail.subject, html: mail.html }),
  });
}

export async function sendEmail(args: Mail): Promise<boolean> {
  const brevoKey = process.env.BREVO_API_KEY;
  const resendKey = process.env.RESEND_API_KEY;
  if (!brevoKey && !resendKey) {
    console.warn(`[email] no provider (BREVO_API_KEY / RESEND_API_KEY) — skipped "${args.subject}" to ${args.to}`);
    return false;
  }
  const provider = brevoKey ? "Brevo" : "Resend";
  try {
    const res = brevoKey ? await brevoRequest(brevoKey, args) : await resendRequest(resendKey!, args);
    if (!res.ok) {
      console.error(`[email] ${provider} ${res.status}: ${await res.text()}`);
      return false;
    }
    return true;
  } catch (err) {
    console.error(`[email] ${provider} send failed:`, err);
    return false;
  }
}

// Shared dark-card wrapper so all Nova emails look consistent.
export function emailShell(title: string, bodyHtml: string, ctaLabel?: string, ctaUrl?: string): string {
  const cta = ctaLabel && ctaUrl
    ? `<a href="${ctaUrl}" style="display:inline-block;margin-top:20px;padding:10px 24px;background:#7c3aed;color:#ffffff;border-radius:6px;text-decoration:none;font-weight:600;font-size:14px">${ctaLabel}</a>`
    : "";
  return `<!DOCTYPE html>
<html><body style="margin:0;background:#f4f4f7;font-family:system-ui,-apple-system,sans-serif;padding:32px 16px">
  <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:12px;padding:32px;border:1px solid #e5e7eb">
    <div style="font-size:14px;font-weight:800;color:#7c3aed;letter-spacing:-0.02em;margin-bottom:20px">Nova</div>
    <h1 style="font-size:18px;color:#111827;margin:0 0 12px">${title}</h1>
    <div style="font-size:14px;color:#4b5563;line-height:1.6">${bodyHtml}</div>
    ${cta}
  </div>
  <div style="max-width:480px;margin:12px auto 0;text-align:center;font-size:11px;color:#9ca3af">
    Sent by Nova · You can manage notifications in Settings
  </div>
</body></html>`;
}
