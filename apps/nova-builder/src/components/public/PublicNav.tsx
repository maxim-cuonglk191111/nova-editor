"use client";
// Shared public header (landing, pricing, terms, privacy). Light, sticky, with the Nova
// mark and wordmark at 36px so it is legible. Every control is a real link or button:
// the current page is marked with aria-current, never with pointer-events.
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { LogoIcon } from "@/components/LogoIcon";
import { UserDropdown } from "@/components/UserDropdown";
import { IconArrow, IconClose, IconMenu } from "@/components/landing/icons";
import { useI18n } from "@/lib/i18n";
import { PUBLIC_CHROME_CSS } from "./publicChromeStyles";

type NavItem = { href: string; label: string };

export function PublicNav() {
  const { t } = useI18n();
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isLoggedIn = status === "authenticated" && Boolean(session);
  const isLoading = status === "loading";

  // Close the mobile panel on navigation, on Escape and when the viewport grows past it.
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    const onResize = () => { if (window.innerWidth > 960) setOpen(false); };
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    return () => { window.removeEventListener("keydown", onKey); window.removeEventListener("resize", onResize); };
  }, [open]);

  const items: NavItem[] = [
    { href: "/#features", label: t.nav.features },
    { href: "/pricing", label: t.nav.pricing },
    { href: "/#faq", label: t.nav.faq },
    { href: "/builder/demo", label: t.nav.tryDemo },
    ...(isLoggedIn ? [{ href: "/projects", label: t.nav.projects }] : []),
  ];

  const link = (item: NavItem, onClick?: () => void) => (
    <Link
      key={item.href}
      href={item.href}
      className="pn__link"
      aria-current={pathname === item.href ? "page" : undefined}
      onClick={onClick}
    >
      {item.label}
    </Link>
  );

  return (
    <header className="pn">
      <div className="pn__inner">
        <Link href="/" className="pn__brand" aria-label={`Nova — ${t.site.navHome}`}>
          <LogoIcon width={36} height={36} />
          <span>Nova</span>
        </Link>

        <nav aria-label={t.site.navMenu} className="pn__links">
          {items.map((item) => link(item))}
        </nav>

        <div className="pn__actions">
          {isLoading ? null : isLoggedIn ? (
            <UserDropdown mode="light" />
          ) : (
            <>
              <Link href="/login" className="pn__btn pn__btn--ghost">{t.nav.login}</Link>
              <Link href="/signup" className="pn__btn pn__btn--primary">{t.nav.signup}<IconArrow width={16} height={16} /></Link>
            </>
          )}
        </div>

        {isLoggedIn && <div className="pn__avatar"><UserDropdown mode="light" /></div>}

        <button
          type="button"
          className="pn__toggle"
          aria-expanded={open}
          aria-controls="pn-panel"
          aria-label={t.site.navMenu}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <IconClose /> : <IconMenu />}
        </button>
      </div>

      {open && (
        <div id="pn-panel" className="pn__panel">
          {items.map((item) => link(item, () => setOpen(false)))}
          {isLoggedIn ? null : (
            <>
              <Link href="/login" className="pn__btn pn__btn--outline" onClick={() => setOpen(false)}>{t.nav.login}</Link>
              <Link href="/signup" className="pn__btn pn__btn--primary" onClick={() => setOpen(false)}>{t.nav.signup}<IconArrow width={16} height={16} /></Link>
            </>
          )}
        </div>
      )}
      <style>{PUBLIC_CHROME_CSS}</style>
    </header>
  );
}
