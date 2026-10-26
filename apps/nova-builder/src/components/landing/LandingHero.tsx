"use client";
// Hero: promise, the working prompt box, example chips, trust line and the editor picture.
import { useI18n } from "@/lib/i18n";
import { HeroMockup } from "./HeroMockup";
import { IconArrow, IconCheck, IconSpark } from "./icons";

type Props = {
  prompt: string;
  onPromptChange: (value: string) => void;
  onStart: () => void;
  busy: boolean;
};

export function LandingHero({ prompt, onPromptChange, onStart, busy }: Props) {
  const L = useI18n().t.landing;
  return (
    <section className="lp-hero" aria-labelledby="lp-title">
      <div className="lp-container lp-hero__grid">
        <div className="lp-hero__text">
          <div className="lp-badge"><IconSpark width={16} height={16} />{L.badge}</div>
          <h1 id="lp-title" className="lp-hero__title">
            {L.titleLead} <span>{L.titleAccent}</span>
          </h1>
          <p className="lp-hero__sub">{L.subtitle}</p>

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
              <button type="button" onClick={onStart} disabled={busy} className="lp-btn lp-btn--primary">
                {busy ? (<><span className="lp-spinner" />{L.building}</>) : (<>{L.startBuildingFree}<IconArrow width={16} height={16} /></>)}
              </button>
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
