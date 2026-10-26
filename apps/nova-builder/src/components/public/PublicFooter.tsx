"use client";
// Shared public footer: brand, product / account / legal columns. Only real routes.
import Link from "next/link";
import { LogoIcon } from "@/components/LogoIcon";
import { useI18n, fmt } from "@/lib/i18n";

export function PublicFooter() {
  const { t } = useI18n();
  const S = t.site;
  const columns: { heading: string; links: { href: string; label: string }[] }[] = [
    {
      heading: S.footerProduct,
      links: [
        { href: "/#features", label: t.nav.features },
        { href: "/pricing", label: t.nav.pricing },
        { href: "/#faq", label: t.nav.faq },
        { href: "/builder/demo", label: t.nav.tryDemo },
      ],
    },
    {
      heading: S.footerAccount,
      links: [
        { href: "/login", label: t.nav.login },
        { href: "/signup", label: t.nav.signup },
        { href: "/projects", label: t.nav.projects },
      ],
    },
    {
      heading: S.footerLegal,
      links: [
        { href: "/terms", label: S.footerTerms },
        { href: "/privacy", label: S.footerPrivacy },
        { href: "mailto:support@nova.build", label: S.footerSupport },
      ],
    },
  ];

  return (
    <footer className="pf">
      <div className="pf__inner">
        <div className="pf__grid">
          <div>
            <Link href="/" className="pf__brand" aria-label={`Nova — ${S.navHome}`}>
              <LogoIcon width={36} height={36} />
              Nova
            </Link>
            <p className="pf__tag">{S.footerTagline}</p>
          </div>
          {columns.map((col) => (
            <nav key={col.heading} aria-label={col.heading}>
              <h2 className="pf__h">{col.heading}</h2>
              <ul className="pf__list">
                {col.links.map((l) => (
                  <li key={l.href}>
                    {l.href.startsWith("mailto:")
                      ? <a className="pf__link" href={l.href}>{l.label}</a>
                      : <Link className="pf__link" href={l.href}>{l.label}</Link>}
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div className="pf__bar">{fmt(S.footerRights, { year: new Date().getFullYear() })}</div>
      </div>
    </footer>
  );
}
