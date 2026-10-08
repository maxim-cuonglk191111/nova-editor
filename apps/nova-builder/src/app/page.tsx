"use client";
export const dynamic = "force-dynamic";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PublicNav } from "@/components/public/PublicNav";
import { PublicFooter } from "@/components/public/PublicFooter";
import { useI18n } from "@/lib/i18n";
import { useTypingAnimation, FadeSection } from "@/components/landing/landingMotion";
import { LANDING_CSS } from "@/components/landing/landingStyles";

export default function Home() {
  const { t } = useI18n();
  const { data: session, status } = useSession();
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [creating, setCreating] = useState(false);

  const isLoading = status === "loading";

  const typedText = useTypingAnimation(t.site.typingPhrases);

  async function handleStart() {
    const trimmed = prompt.trim();
    if (!trimmed || creating) return;
    if (!session) {
      sessionStorage.setItem("nova-pending-prompt", trimmed);
      router.push("/login");
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
    <div className="origin-home">
      <PublicNav theme="dark" />

      {/* ═══════════════ HERO ═══════════════ */}
      <div className="origin-hero">
        <div className="origin-hero__site-wrapper">
          {/* Background clouds video */}
          <video
            autoPlay loop muted playsInline
            className="origin-hero__video"
            poster="https://cdn.prod.website-files.com/68acbc076b672f730e0c77b9%2F68bb73e8d95f81619ab0f106_Clouds1-poster-00001.jpg"
          >
            <source src="https://cdn.prod.website-files.com/68acbc076b672f730e0c77b9%2F68bb73e8d95f81619ab0f106_Clouds1-transcode.mp4" type="video/mp4" />
            <source src="https://cdn.prod.website-files.com/68acbc076b672f730e0c77b9%2F68bb73e8d95f81619ab0f106_Clouds1-transcode.webm" type="video/webm" />
          </video>
          <div className="origin-hero__overlay" />

          <div className="origin-container" style={{ position: "relative", zIndex: 2 }}>
            <div className="origin-hero__wrapper">
              {/* Promo badge */}
              <div className="origin-promo">
                <p className="origin-smalltext">{t.landing.badge}</p>
              </div>

              {/* Main heading */}
              <h1 className="origin-display-heading">
                <em>{t.landing.titleLead.split(" ")[0]}</em>{" "}
                {t.landing.titleLead.split(" ").slice(1).join(" ")}{" "}
                {t.landing.titleAccent}
              </h1>

              {/* Sub copy */}
              <div className="origin-hero__sub-wrapper">
                <p className="origin-body-white">{t.landing.subtitle}</p>
              </div>

              {/* CTA Button */}
              <Link href="/signup" className="origin-button origin-button--nav">
                <span>{t.landing.getStartedFree}</span>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </Link>

              {/* Typing search bar */}
              <button
                onClick={() => {
                  const el = document.getElementById("site-prompt");
                  if (el) el.focus();
                }}
                className="origin-search-bar"
              >
                <span className="origin-typed-words">{typedText}</span>
                <span className="origin-search-btn">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                </span>
              </button>

              {/* Trust line */}
              <div className="origin-hero__trust">
                <p className="origin-p60">{t.landing.trustBadges.join("  ·  ")}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════ SIMPLIFY SECTION ═══════════════ */}
      <div className="origin-intro">
        <div className="origin-site-wrapper">
          <FadeSection>
            <div className="origin-container">
              <div className="origin-hero__wrapper">
                <h3 className="origin-large-heading">
                  <em className="origin-text-italics">{t.landing.simplifyDesignLead}</em> {t.landing.simplifyDesignAccent}
                </h3>
              </div>
            </div>
          </FadeSection>
        </div>
      </div>

      {/* ═══════════════ BUILD EVERYTHING — TRACK CARDS ═══════════════ */}
      <div className="origin-divider" />
      <div className="origin-intro">
        <div className="origin-site-wrapper">
          <FadeSection>
            <div className="origin-container">
              <div className="origin-hero__wrapper">
                <h2 className="origin-large-heading">
                  <em className="origin-text-italics">{t.landing.buildEverythingLead}</em> {t.landing.buildEverythingAccent}
                </h2>
                <div className="origin-hero__sub-wrapper">
                  <p className="origin-p60">{t.landing.buildEverythingDesc}</p>
                </div>
                <Link href="/signup" className="origin-button origin-button--dark">
                  {t.landing.getStartedFree.toUpperCase()}
                </Link>
              </div>
            </div>
          </FadeSection>

          {/* Track cards grid */}
          <FadeSection>
            <div className="origin-track-grid">
              {t.landing.features.slice(0, 2).map((feat, i) => (
                <div key={i} className="origin-track-card">
                  <div className="origin-track-card__image-wrapper">
                    <div className="origin-image-blur-bg">
                      <img
                        src={[
                          "https://cdn.prod.website-files.com/68acbc076b672f730e0c77b9/68bf6605b4df5f9a02f2489b_spend-this-month.avif",
                          "https://cdn.prod.website-files.com/68acbc076b672f730e0c77b9/68c02b1aa2d9315689379726_budgetcard.avif",
                        ][i]}
                        alt={feat.title}
                        loading="lazy"
                        className="origin-track-card__img"
                      />
                    </div>
                  </div>
                  <div className="origin-track-card__text">
                    <p className="origin-body-white">{feat.title}</p>
                    <p className="origin-p60">{feat.body}</p>
                  </div>
                  <div className="origin-track-card__gradient" />
                </div>
              ))}
            </div>
          </FadeSection>
        </div>
      </div>

      {/* ═══════════════ ASK ANYTHING — AI SECTION ═══════════════ */}
      <div className="origin-divider" />
      <div className="origin-ai-section">
        <div className="origin-intro origin-aigradient">
          <div className="origin-site-wrapper">
            <FadeSection>
              <div className="origin-container">
                <div className="origin-hero__wrapper">
                  <svg className="origin-star" width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2l2.09 6.26L20.18 10l-6.09 1.74L12 18l-2.09-6.26L3.82 10l6.09-1.74L12 2z" fill="white" fillOpacity="0.6"/>
                  </svg>
                  <h2 className="origin-large-heading origin-font-weight-normal">
                    <span className="origin-text-span">
                      <em className="origin-text-italics">{t.landing.deployAnythingLead}</em> {t.landing.deployAnythingAccent}
                    </span>
                  </h2>
                  <div className="origin-hero__sub-wrapper">
                    <p className="origin-p60">{t.landing.deployAnythingDesc}</p>
                  </div>
                </div>
              </div>
            </FadeSection>

            {/* AI Prompt Input — prominent */}
            <FadeSection>
              <div className="origin-container">
                <div className="origin-ai-prompt-wrapper">
                  <div className="origin-ai-prompt">
                    <label htmlFor="site-prompt" className="sr-only">{t.landing.promptSrLabel}</label>
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
                      placeholder={t.landing.promptPlaceholder}
                      rows={3}
                      className="origin-ai-prompt__textarea"
                    />
                    <div className="origin-ai-prompt__footer">
                      <span className="origin-ai-prompt__hint">{t.landing.pressEnter}</span>
                      <button
                        onClick={handleStart}
                        disabled={!prompt.trim() || creating || isLoading}
                        className="origin-ai-prompt__submit"
                      >
                        {creating ? (
                          <>
                            <span className="origin-spinner" />
                            {t.landing.building}
                          </>
                        ) : (
                          <>
                            {t.landing.startBuildingFree}
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Example chips */}
                  <div className="origin-examples">
                    <span className="origin-examples__label">{t.landing.tryLabel}</span>
                    {t.landing.examples.map((ex) => (
                      <button key={ex.label} onClick={() => setPrompt(ex.prompt)} className="origin-examples__chip">
                        {ex.icon} {ex.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </FadeSection>
          </div>
        </div>
      </div>

      {/* ═══════════════ DEPLOY — FEATURE CARDS (3-col) ═══════════════ */}
      <div className="origin-updates">
        <FadeSection>
          <div className="origin-container">
            <div className="origin-hero__wrapper">
              <h2 className="origin-large-heading">
                <em className="origin-text-italics">{t.landing.growProductTitle.split(" ")[0]}</em>{" "}
                {t.landing.growProductTitle.split(" ").slice(1).join(" ")}
              </h2>
              <div className="origin-hero__sub-wrapper">
                <p className="origin-p60">{t.landing.growProductDesc}</p>
              </div>
            </div>
          </div>
        </FadeSection>

        <FadeSection>
          <div className="origin-container">
            <div className="origin-3col-grid">
              {t.landing.features.map((feat, i) => (
                <div key={i} className="origin-update-card">
                  <div className="origin-product-update-title">{feat.icon}</div>
                  <h3 className="origin-update-card__title">{feat.title}</h3>
                  <p className="origin-p60">{feat.body}</p>
                </div>
              ))}
            </div>
          </div>
        </FadeSection>
      </div>

      {/* ═══════════════ CONNECT SPHERE SECTION ═══════════════ */}
      <div className="origin-sphere-section">
        <div className="origin-sphere-bg" />
        <FadeSection>
          <div className="origin-sphere-center">
            <h2 className="origin-large-heading" style={{ fontSize: "clamp(32px, 5vw, 48px)" }}>
              <em className="origin-text-italics">{t.site.connectLead}</em> {t.site.connectRest}
            </h2>
            <div className="origin-hero__sub-wrapper" style={{ marginTop: 16 }}>
              <p className="origin-p60">
                {t.site.connectBody}
              </p>
            </div>
            <Link href="/signup" className="origin-button origin-button--dark" style={{ marginTop: 24 }}>
              {t.site.exploreIntegrations}
            </Link>
          </div>
        </FadeSection>
      </div>

      {/* ═══════════════ TESTIMONIALS ═══════════════ */}
      <div className="origin-testimonials">
        <FadeSection>
          <div className="origin-container">
            <div className="origin-hero__wrapper" style={{ marginBottom: 60 }}>
              <h2 className="origin-large-heading">{t.landing.testimonialsTitle}</h2>
            </div>

            <div className="origin-testimonial-grid">
              {t.landing.testimonials.map((item, i) => (
                <div key={i} className={`origin-quote-card origin-quote-card--${i + 1}`}>
                  <div>
                    <img
                      src="https://cdn.prod.website-files.com/68acbc076b672f730e0c77b9/68acd3d1459c4533e7d4649a_stars.svg"
                      alt={t.site.starsAlt}
                      className="origin-quote-card__stars"
                    />
                    <p className="origin-quote-card__text">&ldquo;{item.quote}&rdquo;</p>
                  </div>
                  <div className="origin-quote-card__author">{item.name}</div>
                </div>
              ))}
            </div>
          </div>
        </FadeSection>
      </div>

      {/* ═══════════════ BOTTOM CTA / FOOTER HERO ═══════════════ */}
      <div className="origin-forecast-section">
        <div className="origin-site-wrapper-forecast">
          <FadeSection>
            <div className="origin-container">
              <div className="origin-hero__wrapper">
                <div className="origin-hero-label">
                  <span className="origin-hero-label-text">{t.landing.newsEyebrow}</span>
                </div>
                <h2 className="origin-large-heading" style={{ color: "#ffffff" }}>
                  {t.landing.newsTitle}
                </h2>
                <div className="origin-hero__sub-wrapper" style={{ marginTop: 16 }}>
                  <p className="origin-p60" style={{ color: "rgba(255,255,255,0.7)" }}>{t.landing.ctaSubtitle}</p>
                </div>
                <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginTop: 32 }}>
                  <Link href="/signup" className="origin-button origin-button--nav">
                    <span>{t.landing.getStartedFree}</span>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </Link>
                  <Link href="/builder/demo" className="origin-button origin-button--dark">
                    {t.landing.tryDemo}
                  </Link>
                </div>
              </div>
            </div>
          </FadeSection>
        </div>
      </div>

      <PublicFooter theme="dark" />

      {/* ═══════════════ STYLES ═══════════════ */}
      <style>{LANDING_CSS}</style>
    </div>
  );
}
