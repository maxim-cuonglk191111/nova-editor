"use client";
// Hero: a plain-spoken headline with the key phrase underlined by hand, the working prompt
// box (drawn like a ticket, with a handwritten note pointing at it), and the collage.
import { useI18n } from "@/lib/i18n";
import { HeroMockup } from "./HeroMockup";
import { CurlArrow, Squiggle } from "./doodles";
import { IconArrow, IconCheck, IconSpark } from "./icons";

type Props = {
  prompt: string;
  onPromptChange: (value: string) => void;
  onStart: () => void;
  /** True while the project is being created: shows the spinner. */
  busy: boolean;
  /** True while the session is still loading: the button waits but shows no spinner. */
  waiting?: boolean;
};

export function LandingHero({ prompt, onPromptChange, onStart, busy, waiting = false }: Props) {
  const L = useI18n().t.landing;
  return (
    <section className="lp-hero" aria-labelledby="lp-title">
      <div className="lp-container lp-hero__grid">
        <div className="lp-hero__text">
          <div className="lp-badge"><IconSpark width={16} height={16} />{L.badge}</div>
          <h1 id="lp-title" className="lp-hero__title">
            {L.titleLead}{" "}
            <span className="lp-hero__hand">
              {L.titleAccent}
              <Squiggle className="lp-hero__squiggle" />
            </span>
          </h1>
          <p className="lp-hero__sub">{L.subtitle}</p>

          <div className="lp-prompt-wrap">
            <div className="lp-note" aria-hidden="true">
              <span>{L.annotationPrompt}</span>
              <CurlArrow className="lp-note__arrow" />
            </div>
            <div className="lp-prompt">
              <label htmlFor="site-prompt" className="sr-only">{L.promptSrLabel}</label>
              <textarea
                id="site-prompt"
                value={prompt}
                onChange={(e) => onPromptChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onStart(); }
                }}
                placeholder={L.promptPlaceholder}
                rows={3}
                className="lp-prompt__input"
              />
              <div className="lp-prompt__bar">
                <span className="lp-prompt__hint">{L.pressEnter}</span>
                <button type="button" onClick={onStart} disabled={busy || waiting} className="lp-btn lp-btn--primary">
                  {busy ? (<><span className="lp-spinner" />{L.building}</>) : (<>{L.startBuildingFree}<IconArrow width={16} height={16} /></>)}
                </button>
              </div>
            </div>
          </div>

          <div className="lp-chips">
            <span className="lp-chips__label">{L.tryLabel}</span>
            {L.examples.map((ex) => (
              <button key={ex.label} type="button" onClick={() => onPromptChange(ex.prompt)} className="lp-chip">{ex.label}</button>
            ))}
          </div>

          <ul className="lp-trust">
            {L.trustBadges.map((b) => (<li key={b}><IconCheck width={16} height={16} />{b}</li>))}
          </ul>
        </div>

        <HeroMockup prompt={L.examples[0]?.prompt ?? ""} />
      </div>
    </section>
  );
}
