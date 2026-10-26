"use client";
export const dynamic = "force-dynamic";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PublicNav } from "@/components/public/PublicNav";
import { PublicFooter } from "@/components/public/PublicFooter";
import PricingGrid from "@/components/PricingGrid";
import { useI18n } from "@/lib/i18n";
import { FadeSection } from "@/components/landing/landingMotion";
import { LANDING_CSS } from "@/components/landing/landingStyles";

const FEATURE_PHOTOS = [
  "/images/landing/feature-generate.jpg",
  "/images/landing/feature-edit.jpg",
  "/images/landing/feature-publish.jpg",
];

const Arrow = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const Check = () => (
  <svg className="lp-check" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M3.5 8.5l3 3 6-7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default function Home() {
  const { t } = useI18n();
  const L = t.landing;
  const { data: session, status } = useSession();
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [creating, setCreating] = useState(false);

  const isLoading = status === "loading";
  const startHref = session ? "/projects" : "/signup";
  const startLabel = session ? t.nav.projects : L.getStartedFree;

  async function handleStart() {
    const trimmed = prompt.trim();
    if (creating) return;
    if (!trimmed) {
      document.getElementById("site-prompt")?.focus();
      return;
    }
    if (!session) {
      sessionStorage.setItem("nova-pending-prompt", trimmed);
      router.push("/login?callbackUrl=%2Fprojects");
      return;
    }
    setCreating(true);
    try {
      const name = trimmed.slice(0, 48) + (trimmed.length > 48 ? "…" : "");
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error("failed");
      const { id } = (await res.json()) as { id: string };
      sessionStorage.setItem("nova-pending-prompt", trimmed);
      router.push(`/builder/${id}`);
    } catch {
      setCreating(false);
    }
  }

  return (
    <div className="lp">
      <PublicNav theme="dark" />

      {/* ═══════════════ HERO ═══════════════ */}
      <header className="lp-hero">
        <img className="lp-hero__photo" src="/images/landing/hero-team.jpg" alt={L.heroPhotoAlt} width={1600} height={1067} fetchPriority="high" />
        <div className="lp-hero__shade" />
        <div className="lp-container lp-hero__body">
          <div className="lp-eyebrow lp-eyebrow--light">{L.badge}</div>
          <h1 className="lp-hero__title">
            {L.titleLead} <span>{L.titleAccent}</span>
          </h1>
          <p className="lp-hero__sub">{L.subtitle}</p>

          <div className="lp-prompt">
            <label htmlFor="site-prompt" className="sr-only">{L.promptSrLabel}</label>
            <textarea
              id="site-prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleStart();
                }
              }}
              placeholder={L.promptPlaceholder}
              rows={3}
              className="lp-prompt__input"
            />
            <div className="lp-prompt__bar">
              <span className="lp-prompt__hint">{L.pressEnter}</span>
              <button onClick={handleStart} disabled={creating || isLoading} className="lp-btn lp-btn--ink">
                {creating ? (<><span className="lp-spinner" />{L.building}</>) : (<>{L.startBuildingFree}<Arrow /></>)}
              </button>
            </div>
          </div>

          <div className="lp-chips">
            <span className="lp-chips__label">{L.tryLabel}</span>
            {L.examples.map((ex) => (
              <button key={ex.label} onClick={() => setPrompt(ex.prompt)} className="lp-chip">
                {ex.label}
              </button>
            ))}
          </div>

          <ul className="lp-trust">
            {L.trustBadges.map((b) => (
              <li key={b}><Check />{b}</li>
            ))}
          </ul>
        </div>
      </header>

      <main>
        {/* ═══════════════ FEATURES ═══════════════ */}
        <section id="features" className="lp-section lp-section--paper">
          <div className="lp-container">
            <FadeSection className="lp-head">
              <div className="lp-eyebrow">{L.featuresEyebrow}</div>
              <h2 className="lp-h2">{L.featuresTitle}</h2>
              <p className="lp-lead">{L.featuresDesc}</p>
            </FadeSection>

            {L.features.map((f, i) => (
              <FadeSection key={f.title} className={`lp-feature${i % 2 ? " lp-feature--flip" : ""}`}>
                <img className="lp-feature__photo" src={FEATURE_PHOTOS[i]} alt={L.featurePhotoAlts[i]} width={1600} height={1067} loading="lazy" />
                <div className="lp-feature__text">
                  <h3 className="lp-h3">{f.title}</h3>
                  <p className="lp-body">{f.body}</p>
                  <ul className="lp-points">
                    {f.points.map((p) => (<li key={p}><Check />{p}</li>))}
                  </ul>
                </div>
              </FadeSection>
            ))}
          </div>
        </section>

        {/* ═══════════════ HOW IT WORKS ═══════════════ */}
        <section id="how-it-works" className="lp-section lp-section--ink">
          <div className="lp-container">
            <FadeSection className="lp-head">
              <div className="lp-eyebrow lp-eyebrow--light">{L.stepsEyebrow}</div>
              <h2 className="lp-h2 lp-h2--light">{L.stepsTitle}</h2>
            </FadeSection>
            <FadeSection>
              <ol className="lp-steps">
                {L.steps.map((s, i) => (
                  <li key={s.title} className="lp-step">
                    <span className="lp-step__num">{String(i + 1).padStart(2, "0")}</span>
                    <h3 className="lp-step__title">{s.title}</h3>
                    <p className="lp-step__body">{s.body}</p>
                  </li>
                ))}
              </ol>
            </FadeSection>
          </div>
        </section>

        {/* ═══════════════ AUDIENCE ═══════════════ */}
        <section id="audience" className="lp-section lp-section--paper">
          <div className="lp-container">
            <FadeSection className="lp-head">
              <div className="lp-eyebrow">{L.audienceEyebrow}</div>
              <h2 className="lp-h2">{L.audienceTitle}</h2>
              <p className="lp-lead">{L.audienceDesc}</p>
            </FadeSection>
            <FadeSection>
              <ul className="lp-audience">
                {L.audiences.map((a) => (
                  <li key={a.title} className="lp-audience__item">
                    <h3 className="lp-audience__title">{a.title}</h3>
                    <p className="lp-body">{a.body}</p>
                  </li>
                ))}
              </ul>
            </FadeSection>
          </div>
        </section>

        {/* ═══════════════ PRICING ═══════════════ */}
        <section id="pricing" className="lp-section lp-section--white">
          <div className="lp-container">
            <FadeSection className="lp-head">
              <div className="lp-eyebrow">{L.pricingEyebrow}</div>
              <h2 className="lp-h2">{L.pricingTitle}</h2>
              <p className="lp-lead">{L.pricingDesc}</p>
            </FadeSection>
            <FadeSection>
              <PricingGrid onSelectPlan={() => router.push("/pricing")} />
              <p className="lp-more">
                <Link href="/pricing" className="lp-link">{L.pricingSeeAll} <Arrow /></Link>
              </p>
            </FadeSection>
          </div>
        </section>

        {/* ═══════════════ FAQ ═══════════════ */}
        <section id="faq" className="lp-section lp-section--paper">
          <div className="lp-container lp-faq">
            <FadeSection className="lp-faq__head">
              <div className="lp-eyebrow">{L.faqEyebrow}</div>
              <h2 className="lp-h2">{L.faqTitle}</h2>
            </FadeSection>
            <FadeSection className="lp-faq__list">
              {t.pricing.faq.map(({ q, a }) => (
                <details key={q} className="lp-faq__item">
                  <summary>{q}</summary>
                  <p className="lp-body">{a}</p>
                </details>
              ))}
            </FadeSection>
          </div>
        </section>

        {/* ═══════════════ FINAL CTA ═══════════════ */}
        <section className="lp-cta">
          <img className="lp-cta__photo" src="/images/landing/cta-office.jpg" alt={L.ctaPhotoAlt} width={1600} height={900} loading="lazy" />
          <div className="lp-cta__shade" />
          <FadeSection className="lp-container lp-cta__body">
            <h2 className="lp-h2 lp-h2--light">{L.ctaTitle}</h2>
            <p className="lp-lead lp-lead--light">{L.ctaSubtitle}</p>
            <div className="lp-cta__actions">
              <Link href={startHref} className="lp-btn lp-btn--white">{startLabel}<Arrow /></Link>
              <Link href="/builder/demo" className="lp-btn lp-btn--ghost">{L.tryDemo}</Link>
            </div>
          </FadeSection>
        </section>
      </main>

      <PublicFooter theme="dark" />

      <style>{LANDING_CSS}</style>
    </div>
  );
}
