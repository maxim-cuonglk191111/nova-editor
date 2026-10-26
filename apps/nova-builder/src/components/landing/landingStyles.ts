// Styles for the public landing page (app/page.tsx), kept out of the component.
// Palette: warm paper + ink, one violet accent. Headings use Montserrat (Vietnamese-safe),
// body uses Inter. Cards are separated by 1px rules, not shadows.
export const LANDING_CSS = `
.lp {
  --lp-ink: #15171c;
  --lp-paper: #f4f1ea;
  --lp-white: #fbfaf7;
  --lp-rule: rgba(21, 23, 28, 0.16);
  --lp-muted: #454a54;
  --lp-accent: #5a3fc0;
  --lp-nav-h: 96px;
  min-height: 100vh;
  background: var(--lp-paper);
  color: var(--lp-ink);
  font-family: var(--font-suisse-intl);
  overflow-x: hidden;
}
.lp img { display: block; max-width: 100%; }
.lp section[id] { scroll-margin-top: var(--lp-nav-h); }
.lp-container { max-width: 1200px; margin: 0 auto; padding: 0 32px; position: relative; }

/* ── Type ── */
.lp-eyebrow {
  font-family: var(--font-roboto-mono);
  font-size: 12px; font-weight: 500; letter-spacing: 0.14em; text-transform: uppercase;
  color: var(--lp-accent); margin: 0 0 16px;
}
.lp-eyebrow--light { color: #d9d2ff; }
.lp-h2 {
  font-family: var(--font-lyon-display);
  font-weight: 700; font-size: clamp(30px, 4.2vw, 46px); line-height: 1.15; letter-spacing: -0.015em;
  margin: 0; max-width: 18em;
}
.lp-h2--light { color: #fff; }
.lp-h3 {
  font-family: var(--font-lyon-display);
  font-weight: 700; font-size: clamp(24px, 2.8vw, 32px); line-height: 1.2; letter-spacing: -0.01em; margin: 0 0 16px;
}
.lp-lead { font-size: 18px; line-height: 1.6; color: var(--lp-muted); margin: 16px 0 0; max-width: 40em; }
.lp-lead--light { color: rgba(255, 255, 255, 0.86); }
.lp-body { font-size: 16px; line-height: 1.65; color: var(--lp-muted); margin: 0; max-width: 34em; }

/* ── Buttons ── */
.lp-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  min-height: 48px; padding: 0 22px; border-radius: 6px; border: 1px solid transparent;
  font-family: var(--font-lyon-display); font-size: 15px; font-weight: 600; line-height: 1;
  text-decoration: none; cursor: pointer; transition: background-color 0.2s, color 0.2s, border-color 0.2s;
  white-space: nowrap;
}
.lp-btn:focus-visible, .lp-chip:focus-visible, .lp-link:focus-visible, .lp-faq__item summary:focus-visible {
  outline: 2px solid #fff; outline-offset: 2px; box-shadow: 0 0 0 4px var(--lp-accent);
}
.lp-btn--ink { background: var(--lp-ink); color: #fff; }
.lp-btn--ink:hover:not(:disabled) { background: #2b2f38; }
.lp-btn--ink:disabled { opacity: 0.45; cursor: not-allowed; }
.lp-btn--white { background: #fff; color: var(--lp-ink); }
.lp-btn--white:hover { background: #ece8df; }
.lp-btn--ghost { background: transparent; color: #fff; border-color: rgba(255, 255, 255, 0.55); }
.lp-btn--ghost:hover { background: rgba(255, 255, 255, 0.12); }
.lp-link {
  display: inline-flex; align-items: center; gap: 8px; color: var(--lp-ink); font-weight: 600;
  text-decoration: underline; text-underline-offset: 4px; text-decoration-thickness: 1px;
}
.lp-link:hover { color: var(--lp-accent); }

/* ── Hero ── */
.lp-hero {
  position: relative; min-height: 100vh; display: flex; align-items: center;
  padding: 150px 0 72px; background: #0c0e14; overflow: hidden;
}
.lp-hero__photo { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: 70% 40%; }
.lp-hero__shade {
  position: absolute; inset: 0;
  background: linear-gradient(90deg, rgba(12, 14, 20, 0.92) 0%, rgba(12, 14, 20, 0.74) 52%, rgba(12, 14, 20, 0.38) 100%);
}
.lp-hero__body { width: 100%; }
.lp-hero__title {
  font-family: var(--font-lyon-display); font-weight: 800; color: #fff;
  font-size: clamp(36px, 5.6vw, 68px); line-height: 1.08; letter-spacing: -0.02em;
  margin: 0; max-width: 13em;
}
.lp-hero__title span { color: #cfc5ff; }
.lp-hero__sub { font-size: 19px; line-height: 1.6; color: rgba(255, 255, 255, 0.88); margin: 24px 0 36px; max-width: 36em; }

.lp-prompt {
  background: var(--lp-white); border-radius: 8px; padding: 14px 14px 12px 18px; max-width: 720px;
  border: 1px solid rgba(255, 255, 255, 0.5);
}
.lp-prompt__input {
  width: 100%; border: 0; outline: 0; resize: none; background: transparent; color: var(--lp-ink);
  font-family: var(--font-suisse-intl); font-size: 16px; line-height: 1.5; padding: 6px 0;
}
.lp-prompt__input::placeholder { color: #5b606b; }
.lp-prompt__bar { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding-top: 8px; border-top: 1px solid var(--lp-rule); }
.lp-prompt__hint { font-size: 13px; color: #5b606b; }
.lp-chips { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-top: 18px; max-width: 720px; }
.lp-chips__label { font-size: 13px; color: rgba(255, 255, 255, 0.78); margin-right: 4px; }
.lp-chip {
  background: rgba(255, 255, 255, 0.08); color: #fff; border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 6px; padding: 8px 14px; font-size: 14px; font-family: inherit; cursor: pointer;
  transition: background-color 0.2s;
}
.lp-chip:hover { background: rgba(255, 255, 255, 0.2); }
.lp-trust { list-style: none; margin: 32px 0 0; padding: 0; display: flex; flex-wrap: wrap; gap: 10px 28px; }
.lp-trust li { display: flex; align-items: center; gap: 8px; font-size: 14px; color: rgba(255, 255, 255, 0.86); }
.lp-trust .lp-check { color: #cfc5ff; }

/* ── Sections ── */
.lp-section { padding: 112px 0; }
.lp-section--paper { background: var(--lp-paper); }
.lp-section--white { background: var(--lp-white); border-top: 1px solid var(--lp-rule); border-bottom: 1px solid var(--lp-rule); }
.lp-section--ink { background: var(--lp-ink); color: #fff; }
.lp-head { margin-bottom: 64px; }
.lp-check { flex-shrink: 0; color: var(--lp-accent); }

/* ── Feature rows ── */
.lp-feature { display: grid; grid-template-columns: 1.1fr 1fr; gap: 72px; align-items: center; }
.lp-feature + .lp-feature { margin-top: 96px; }
.lp-feature--flip .lp-feature__photo { order: 2; }
.lp-feature__photo { width: 100%; aspect-ratio: 4 / 3; object-fit: cover; border-radius: 8px; border: 1px solid var(--lp-rule); }
.lp-points { list-style: none; margin: 28px 0 0; padding: 0; display: flex; flex-direction: column; gap: 12px; }
.lp-points li { display: flex; align-items: flex-start; gap: 10px; font-size: 16px; line-height: 1.5; color: var(--lp-ink); }
.lp-points .lp-check { margin-top: 3px; }

/* ── Steps ── */
.lp-steps { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(3, 1fr); gap: 0 48px; }
.lp-step { border-top: 1px solid rgba(255, 255, 255, 0.28); padding-top: 28px; }
.lp-step__num { font-family: var(--font-roboto-mono); font-size: 14px; color: #cfc5ff; letter-spacing: 0.1em; }
.lp-step__title { font-family: var(--font-lyon-display); font-weight: 700; font-size: 26px; margin: 14px 0 12px; color: #fff; }
.lp-step__body { font-size: 16px; line-height: 1.65; color: rgba(255, 255, 255, 0.82); margin: 0; max-width: 28em; }

/* ── Audience ── */
.lp-audience { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(3, 1fr); gap: 0 48px; }
.lp-audience__item { border-top: 1px solid var(--lp-ink); padding: 24px 0 40px; }
.lp-audience__title { font-family: var(--font-lyon-display); font-weight: 700; font-size: 20px; margin: 0 0 10px; }

/* ── Pricing ── */
.lp-more { margin: 8px 0 0; text-align: center; }

/* ── FAQ ── */
.lp-faq { display: grid; grid-template-columns: 1fr 1.6fr; gap: 72px; align-items: start; }
.lp-faq__item { border-bottom: 1px solid var(--lp-rule); padding: 22px 0; }
.lp-faq__item:first-child { border-top: 1px solid var(--lp-ink); }
.lp-faq__item summary {
  font-family: var(--font-lyon-display); font-weight: 600; font-size: 18px; line-height: 1.4;
  cursor: pointer; list-style: none; display: flex; justify-content: space-between; gap: 16px;
}
.lp-faq__item summary::-webkit-details-marker { display: none; }
.lp-faq__item summary::after { content: "+"; font-weight: 400; font-size: 24px; line-height: 1; color: var(--lp-accent); }
.lp-faq__item[open] summary::after { content: "\\2212"; }
.lp-faq__item p { margin-top: 14px; }

/* ── Final CTA ── */
.lp-cta { position: relative; padding: 128px 0; background: #0c0e14; overflow: hidden; }
.lp-cta__photo { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.lp-cta__shade { position: absolute; inset: 0; background: rgba(12, 14, 20, 0.8); }
.lp-cta__body { text-align: center; display: flex; flex-direction: column; align-items: center; }
.lp-cta__body .lp-h2 { max-width: 16em; }
.lp-cta__actions { display: flex; flex-wrap: wrap; justify-content: center; gap: 12px; margin-top: 36px; }

/* ── Misc ── */
@keyframes lp-spin { to { transform: rotate(360deg); } }
.lp-spinner {
  width: 14px; height: 14px; border: 2px solid rgba(255, 255, 255, 0.35); border-top-color: #fff;
  border-radius: 50%; display: inline-block; animation: lp-spin 0.7s linear infinite;
}
.sr-only {
  position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden;
  clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0;
}
@media (prefers-reduced-motion: reduce) {
  .lp * { animation: none !important; transition: none !important; }
}

/* ── Responsive ── */
@media screen and (max-width: 991px) {
  .lp-section { padding: 80px 0; }
  .lp-feature, .lp-faq { grid-template-columns: 1fr; gap: 32px; }
  .lp-feature--flip .lp-feature__photo { order: 0; }
  .lp-feature + .lp-feature { margin-top: 72px; }
  .lp-steps, .lp-audience { grid-template-columns: 1fr; }
  .lp-step { padding-bottom: 36px; }
}
@media screen and (max-width: 767px) {
  .lp { --lp-nav-h: 80px; }
  .lp-container { padding: 0 20px; }
  .lp-hero { padding: 120px 0 56px; min-height: 0; }
  .lp-hero__shade { background: rgba(12, 14, 20, 0.78); }
  .lp-hero__sub { font-size: 17px; }
  .lp-prompt__bar { flex-direction: column; align-items: stretch; }
  .lp-prompt__hint { display: none; }
  .lp-head { margin-bottom: 40px; }
  .lp-cta { padding: 88px 0; }
}
`;
