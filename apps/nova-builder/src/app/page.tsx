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
import { LandingHero } from "@/components/landing/LandingHero";
import { IconArrow, IconCheck, IconCode, IconCursor, IconDevices, IconForm, IconLayers, IconPages } from "@/components/landing/icons";

const FEATURE_PHOTOS = [
  "/images/landing/feature-generate.jpg",
  "/images/landing/feature-edit.jpg",
  "/images/landing/feature-publish.jpg",
];
// One icon per capability, in the order of landing.caps.
const CAP_ICONS = [IconCursor, IconPages, IconDevices, IconLayers, IconForm, IconCode];

export default function Home() {
  const { t } = useI18n();
  const L = t.landing;
  const { data: session, status } = useSession();
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [creating, setCreating] = useState(false);

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
      <PublicNav />

      <main>
        <LandingHero prompt={prompt} onPromptChange={setPrompt} onStart={handleStart} busy={creating || status === "loading"} />

        {/* ═══════════════ FEATURES ═══════════════ */}
        <section id="features" className="lp-section">
          <div className="lp-container">
            <FadeSection className="lp-head">
              <p className="lp-eyebrow">{L.capsEyebrow}</p>
              <h2 className="lp-h2">{L.capsTitle}</h2>
            </FadeSection>
            <FadeSection>
              <ul className="lp-caps">
                {L.caps.map((c, i) => {
                  const Icon = CAP_ICONS[i] ?? IconLayers;
                  return (
                    <li key={c.title} className="lp-cap">
                      <span className="lp-cap__icon"><Icon width={22} height={22} /></span>
                      <h3 className="lp-cap__title">{c.title}</h3>
                      <p className="lp-body">{c.body}</p>
                    </li>
                  );
                })}
              </ul>
            </FadeSection>

            <div className="lp-showcase">
              <FadeSection className="lp-head lp-head--tight">
                <p className="lp-eyebrow">{L.featuresEyebrow}</p>
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
                      {f.points.map((p) => (<li key={p}><IconCheck width={18} height={18} />{p}</li>))}
                    </ul>
                  </div>
                </FadeSection>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════ HOW IT WORKS ═══════════════ */}
        <section id="how-it-works" className="lp-section lp-section--ink">
          <div className="lp-container">
            <FadeSection className="lp-head">
              <p className="lp-eyebrow lp-eyebrow--light">{L.stepsEyebrow}</p>
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
        <section id="audience" className="lp-section lp-section--surface">
          <div className="lp-container">
            <FadeSection className="lp-head">
              <p className="lp-eyebrow">{L.audienceEyebrow}</p>
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
        <section id="pricing" className="lp-section">
          <div className="lp-container">
            <FadeSection className="lp-head">
              <p className="lp-eyebrow">{L.pricingEyebrow}</p>
              <h2 className="lp-h2">{L.pricingTitle}</h2>
              <p className="lp-lead">{L.pricingDesc}</p>
            </FadeSection>
            <FadeSection>
              <PricingGrid onSelectPlan={() => router.push("/pricing")} />
              <p className="lp-more">
                <Link href="/pricing" className="lp-link">{L.pricingSeeAll} <IconArrow width={16} height={16} /></Link>
              </p>
            </FadeSection>
          </div>
        </section>

        {/* ═══════════════ FAQ ═══════════════ */}
        <section id="faq" className="lp-section lp-section--surface">
          <div className="lp-container lp-faq">
            <FadeSection className="lp-faq__head">
              <p className="lp-eyebrow">{L.faqEyebrow}</p>
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
              <Link href={startHref} className="lp-btn lp-btn--light">{startLabel}<IconArrow width={16} height={16} /></Link>
              <Link href="/builder/demo" className="lp-btn lp-btn--ghost">{L.tryDemo}</Link>
            </div>
          </FadeSection>
        </section>
      </main>

      <PublicFooter />

      <style>{LANDING_CSS}</style>
    </div>
  );
}
