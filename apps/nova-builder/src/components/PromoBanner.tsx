"use client";
// Welcome-offer strip for public pages. It states the real rule and the real end date, so
// the urgency is true: the offer ends on that date for everyone, not after a timer that
// restarts per visitor. Hidden when the offer is over, when the account already bought
// something, and after the visitor dismisses it.
import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useI18n, fmt } from "@/lib/i18n";
import { usePromo } from "@/lib/usePromo";
import { PROMO, formatPromoEnd, promoDaysLeft } from "@/lib/promo";

const DISMISS_KEY = `nova-promo-dismissed:${PROMO.id}`;

export function PromoBanner() {
  const { t, locale } = useI18n();
  const { data: session } = useSession();
  const promo = usePromo();
  const [dismissed, setDismissed] = useState(true);

  // Read the stored choice after mount so server and first client render agree.
  useEffect(() => {
    try { setDismissed(localStorage.getItem(DISMISS_KEY) === "1"); } catch { setDismissed(false); }
  }, []);

  if (!promo?.active || promo.eligible === false || dismissed) return null;

  const days = promoDaysLeft();
  const cta = session ? { href: "/pricing", label: t.billing.promoCtaPlans } : { href: "/signup", label: t.billing.promoCtaSignUp };

  return (
    <aside className="promo" role="region" aria-label={t.billing.promoBannerTitle}>
      <p className="promo__text">
        <strong>{t.billing.promoBannerTitle}</strong>
        <span>{fmt(t.billing.promoBannerBody, { date: formatPromoEnd(locale), days })}</span>
      </p>
      <Link href={cta.href} className="promo__cta">{cta.label}</Link>
      <button
        type="button"
        className="promo__close"
        aria-label={t.billing.promoDismiss}
        onClick={() => { setDismissed(true); try { localStorage.setItem(DISMISS_KEY, "1"); } catch { /* storage blocked: stays dismissed for this visit */ } }}
      >
        ×
      </button>
      <style>{`
        .promo { position: relative; display: flex; align-items: center; justify-content: center; gap: 16px; flex-wrap: wrap;
          padding: 10px 48px 10px 16px; background: #24262a; color: #fff; font-family: var(--font-suisse-intl); font-size: 14px; line-height: 1.4; }
        .promo__text { margin: 0; display: flex; flex-wrap: wrap; gap: 4px 12px; align-items: baseline; justify-content: center; }
        .promo__text strong { font-family: var(--font-lyon-display); font-weight: 700; color: #dac7fa; }
        .promo__text span { color: rgba(255, 255, 255, 0.86); }
        .promo__cta { display: inline-flex; align-items: center; min-height: 36px; padding: 0 14px; border-radius: 6px; background: #fff; color: #24262a;
          font-weight: 700; text-decoration: none; white-space: nowrap; }
        .promo__cta:hover { background: #dac7fa; }
        .promo__close { position: absolute; right: 8px; top: 50%; transform: translateY(-50%); width: 44px; height: 44px; border: 0; background: transparent;
          color: #fff; font-size: 24px; line-height: 1; cursor: pointer; border-radius: 6px; }
        .promo__close:hover { background: rgba(255, 255, 255, 0.12); }
        .promo :focus-visible { outline: 2px solid #dac7fa; outline-offset: 2px; }
      `}</style>
    </aside>
  );
}
