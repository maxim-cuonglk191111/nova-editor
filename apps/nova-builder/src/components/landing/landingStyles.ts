// Styles for the public landing page (app/page.tsx). Colors come from the Nova mark via
// the --brand-* tokens in globals.css: graphite tile, violet ribbon, lavender highlight.
// Headings use Montserrat (Vietnamese-safe), body uses Inter. Cards are separated by
// 1px rules, not drop shadows.
export const LANDING_CSS = `
.lp { background: #fff; color: var(--brand-text); font-family: var(--font-suisse-intl); overflow-x: hidden; }
.lp img { display: block; max-width: 100%; }
.lp section[id] { scroll-margin-top: 72px; }
.lp :focus-visible { outline: 2px solid var(--brand-violet); outline-offset: 2px; }
.lp-container { max-width: 1200px; margin: 0 auto; padding: 0 24px; position: relative; }

/* ── Type ── */
.lp-eyebrow { font-family: var(--font-roboto-mono); font-size: 13px; font-weight: 500; letter-spacing: 0.12em; text-transform: uppercase; color: var(--brand-violet-deep); margin: 0 0 14px; }
.lp-eyebrow--light { color: var(--brand-lavender); }
.lp-h2 { font-family: var(--font-lyon-display); font-weight: 800; font-size: clamp(28px, 3.6vw, 42px); line-height: 1.18; letter-spacing: -0.02em; margin: 0; max-width: 20em; }
.lp-h2--light { color: #fff; }
.lp-h3 { font-family: var(--font-lyon-display); font-weight: 700; font-size: clamp(23px, 2.5vw, 30px); line-height: 1.22; letter-spacing: -0.01em; margin: 0 0 14px; }
.lp-lead { font-size: 18px; line-height: 1.6; color: var(--brand-muted); margin: 16px 0 0; max-width: 40em; }
.lp-lead--light { color: rgba(255, 255, 255, 0.86); }
.lp-body { font-size: 16px; line-height: 1.65; color: var(--brand-muted); margin: 0; max-width: 34em; }

/* ── Buttons ── */
.lp-btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-height: 48px; padding: 0 24px; border-radius: 8px; border: 1px solid transparent; font-family: var(--font-lyon-display); font-size: 15px; font-weight: 600; text-decoration: none; cursor: pointer; white-space: nowrap; transition: background-color 0.15s, border-color 0.15s; }
.lp-btn--primary { background: var(--brand-violet); color: #fff; }
.lp-btn--primary:hover:not(:disabled) { background: var(--brand-violet-deep); }
.lp-btn--primary:disabled { opacity: 0.6; cursor: wait; }
.lp-btn--light { background: #fff; color: var(--brand-ink); }
.lp-btn--light:hover { background: var(--brand-tint); }
.lp-btn--ghost { background: transparent; color: #fff; border-color: rgba(255, 255, 255, 0.55); }
.lp-btn--ghost:hover { background: rgba(255, 255, 255, 0.12); }
.lp-cta .lp-btn:focus-visible { outline-color: #fff; }
.lp-link { display: inline-flex; align-items: center; gap: 8px; color: var(--brand-violet-deep); font-weight: 600; text-decoration: underline; text-underline-offset: 4px; }
.lp-link:hover { color: var(--brand-ink); }

/* ── Hero: graphite like the logo tile, violet ribbon as the accent ── */
.lp-hero { background: var(--brand-ink); color: #fff; padding: 72px 0 88px; position: relative; overflow: hidden; }
.lp-hero::before { content: ""; position: absolute; width: 760px; height: 760px; right: -220px; top: -260px; background: radial-gradient(circle, rgba(106, 57, 187, 0.55) 0%, rgba(106, 57, 187, 0) 68%); pointer-events: none; }
.lp-hero__grid { display: grid; grid-template-columns: minmax(0, 1.02fr) minmax(0, 1fr); gap: 56px; align-items: center; }
.lp-badge { display: inline-flex; align-items: center; gap: 8px; padding: 7px 14px 7px 12px; border-radius: 999px; background: rgba(169, 128, 230, 0.16); border: 1px solid rgba(218, 199, 250, 0.35); color: var(--brand-lavender); font-size: 14px; font-weight: 500; }
.lp-hero__title { font-family: var(--font-lyon-display); font-weight: 800; font-size: clamp(36px, 4.8vw, 58px); line-height: 1.1; letter-spacing: -0.025em; margin: 22px 0 0; }
.lp-hero__title span { color: var(--brand-lavender); }
.lp-hero__sub { font-size: 18px; line-height: 1.65; color: rgba(255, 255, 255, 0.82); margin: 22px 0 30px; max-width: 34em; }
.lp-prompt { background: #fff; border-radius: 12px; padding: 14px 14px 12px 18px; max-width: 580px; }
.lp-prompt__input { width: 100%; border: 0; outline: 0; resize: none; background: transparent; color: var(--brand-ink); font-family: var(--font-suisse-intl); font-size: 16px; line-height: 1.5; padding: 4px 0; }
.lp-prompt__input::placeholder { color: #5d6069; }
.lp-prompt__bar { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding-top: 10px; border-top: 1px solid var(--brand-rule); }
.lp-prompt__hint { font-size: 13px; color: #5d6069; }
.lp-chips { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-top: 16px; max-width: 580px; }
.lp-chips__label { font-size: 14px; color: rgba(255, 255, 255, 0.72); margin-right: 4px; }
.lp-chip { min-height: 36px; padding: 0 14px; border-radius: 999px; border: 1px solid rgba(255, 255, 255, 0.32); background: transparent; color: #fff; font-size: 14px; font-family: inherit; cursor: pointer; transition: background-color 0.15s; }
.lp-chip:hover { background: rgba(255, 255, 255, 0.12); }
.lp-hero :focus-visible { outline-color: var(--brand-lavender); }
.lp-prompt :focus-visible { outline-color: var(--brand-violet); }
.lp-trust { list-style: none; margin: 28px 0 0; padding: 0; display: flex; flex-wrap: wrap; gap: 8px 24px; }
.lp-trust li { display: flex; align-items: center; gap: 8px; font-size: 14px; color: rgba(255, 255, 255, 0.82); }
.lp-trust svg { color: var(--brand-violet-soft); }

/* ── Editor picture ── */
.lp-mock { position: relative; padding-bottom: 28px; }
.lp-mock__window { background: #fff; border-radius: 14px; overflow: hidden; border: 1px solid rgba(255, 255, 255, 0.2); box-shadow: 0 40px 80px -30px rgba(0, 0, 0, 0.7); color: var(--brand-ink); }
.lp-mock__bar { display: flex; align-items: center; gap: 6px; padding: 10px 14px; background: #eeeaf5; border-bottom: 1px solid var(--brand-rule); }
.lp-mock__bar i { width: 10px; height: 10px; border-radius: 50%; background: #c9c3d6; }
.lp-mock__url { flex: 1; height: 18px; margin-left: 10px; border-radius: 9px; background: #fff; max-width: 60%; }
.lp-mock__body { display: grid; grid-template-columns: 44px minmax(0, 1fr) 128px; min-height: 330px; }
.lp-mock__rail { display: flex; flex-direction: column; align-items: center; gap: 18px; padding-top: 16px; background: #faf9fc; border-right: 1px solid var(--brand-rule); color: var(--brand-violet-deep); }
.lp-mock__canvas { background: #f3f1f7; padding: 16px; display: flex; }
.lp-mock__site { flex: 1; background: #fff; border-radius: 6px; padding: 12px; display: flex; flex-direction: column; gap: 14px; border: 1px solid var(--brand-rule); }
.lp-mock__nav { display: flex; align-items: center; gap: 10px; }
.lp-mock__nav b { width: 22px; height: 22px; border-radius: 6px; background: var(--brand-ink); }
.lp-mock__nav span { width: 34px; height: 6px; border-radius: 3px; background: #d8d4e2; }
.lp-mock__nav em { margin-left: auto; width: 46px; height: 18px; border-radius: 5px; background: var(--brand-violet); }
.lp-mock__hero { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; align-items: center; }
.lp-mock__copy { display: flex; flex-direction: column; gap: 8px; }
.lp-mock__sel { position: relative; height: 34px; border: 1.5px solid var(--brand-violet); border-radius: 3px; background: repeating-linear-gradient(0deg, #2a1357 0 8px, transparent 8px 14px); background-size: 70% 100%; background-repeat: no-repeat; background-position: 6px center; }
.lp-mock__sel u { position: absolute; width: 7px; height: 7px; background: #fff; border: 1.5px solid var(--brand-violet); border-radius: 2px; }
.lp-mock__sel u:nth-child(1) { left: -4px; top: -4px; } .lp-mock__sel u:nth-child(2) { right: -4px; top: -4px; }
.lp-mock__sel u:nth-child(3) { left: -4px; bottom: -4px; } .lp-mock__sel u:nth-child(4) { right: -4px; bottom: -4px; }
.lp-mock__line { height: 7px; border-radius: 3px; background: #d8d4e2; width: 70%; }
.lp-mock__line--w { width: 92%; }
.lp-mock__cta { width: 64px; height: 22px; border-radius: 6px; background: var(--brand-violet); margin-top: 4px; }
.lp-mock__hero img { width: 100%; height: 100px; object-fit: cover; border-radius: 6px; }
.lp-mock__cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.lp-mock__cards span { height: 44px; border-radius: 6px; background: var(--brand-tint); border: 1px solid var(--brand-rule); }
.lp-mock__panel { background: #faf9fc; border-left: 1px solid var(--brand-rule); padding: 16px 12px; display: flex; flex-direction: column; gap: 10px; }
.lp-mock__k { height: 6px; width: 46%; border-radius: 3px; background: #b9b3c9; }
.lp-mock__row { height: 22px; border-radius: 5px; background: #fff; border: 1px solid var(--brand-rule); }
.lp-mock__row--s { width: 60%; }
.lp-mock__sw { display: flex; gap: 6px; }
.lp-mock__sw i { width: 20px; height: 20px; border-radius: 5px; border: 1px solid var(--brand-rule); }
.lp-mock__ask { position: absolute; left: -28px; bottom: 0; max-width: 78%; display: flex; align-items: flex-start; gap: 10px; padding: 12px 16px; border-radius: 12px; background: var(--brand-violet); color: #fff; font-size: 14px; line-height: 1.45; box-shadow: 0 18px 36px -14px rgba(0, 0, 0, 0.6); }
.lp-mock__ask svg { flex-shrink: 0; margin-top: 2px; color: var(--brand-lavender); }
.lp-mock__ask span { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }

/* ── Sections ── */
.lp-section { padding: 104px 0; background: #fff; }
.lp-section--surface { background: var(--brand-surface); border-top: 1px solid var(--brand-rule); border-bottom: 1px solid var(--brand-rule); }
.lp-section--ink { background: var(--brand-ink); color: #fff; }
.lp-head { margin-bottom: 56px; }
.lp-head--tight { margin: 112px 0 64px; }

/* ── Capabilities ── */
.lp-caps { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
.lp-cap { padding: 28px; border: 1px solid var(--brand-rule); border-radius: 12px; background: #fff; transition: border-color 0.15s; }
.lp-cap:hover { border-color: var(--brand-violet-soft); }
.lp-cap__icon { display: inline-flex; width: 44px; height: 44px; align-items: center; justify-content: center; border-radius: 10px; background: var(--brand-tint); color: var(--brand-violet-deep); }
.lp-cap__title { font-family: var(--font-lyon-display); font-weight: 700; font-size: 19px; margin: 18px 0 8px; }

/* ── Feature rows ── */
.lp-feature { display: grid; grid-template-columns: 1.1fr 1fr; gap: 72px; align-items: center; }
.lp-feature + .lp-feature { margin-top: 96px; }
.lp-feature--flip .lp-feature__photo { order: 2; }
.lp-feature__photo { width: 100%; aspect-ratio: 4 / 3; object-fit: cover; border-radius: 12px; border: 1px solid var(--brand-rule); }
.lp-points { list-style: none; margin: 26px 0 0; padding: 0; display: flex; flex-direction: column; gap: 12px; }
.lp-points li { display: flex; align-items: flex-start; gap: 10px; font-size: 16px; line-height: 1.5; }
.lp-points svg { flex-shrink: 0; margin-top: 2px; color: var(--brand-violet); }

/* ── Steps ── */
.lp-steps { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(3, 1fr); gap: 0 48px; }
.lp-step { border-top: 1px solid rgba(255, 255, 255, 0.26); padding-top: 28px; }
.lp-step__num { font-family: var(--font-roboto-mono); font-size: 14px; letter-spacing: 0.1em; color: var(--brand-lavender); }
.lp-step__title { font-family: var(--font-lyon-display); font-weight: 700; font-size: 26px; margin: 14px 0 12px; color: #fff; }
.lp-step__body { font-size: 16px; line-height: 1.65; color: rgba(255, 255, 255, 0.82); margin: 0; max-width: 28em; }

/* ── Audience ── */
.lp-audience { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(3, 1fr); gap: 0 48px; }
.lp-audience__item { border-top: 2px solid var(--brand-violet); padding: 22px 0 38px; }
.lp-audience__title { font-family: var(--font-lyon-display); font-weight: 700; font-size: 20px; margin: 0 0 10px; }

/* ── Pricing / FAQ ── */
.lp-more { margin: 8px 0 0; text-align: center; }
.lp-faq { display: grid; grid-template-columns: 1fr 1.6fr; gap: 72px; align-items: start; }
.lp-faq__item { border-bottom: 1px solid var(--brand-rule); padding: 22px 0; }
.lp-faq__item:first-child { border-top: 2px solid var(--brand-violet); }
.lp-faq__item summary { font-family: var(--font-lyon-display); font-weight: 600; font-size: 18px; line-height: 1.4; cursor: pointer; list-style: none; display: flex; justify-content: space-between; gap: 16px; min-height: 28px; }
.lp-faq__item summary::-webkit-details-marker { display: none; }
.lp-faq__item summary::after { content: "+"; font-weight: 400; font-size: 24px; line-height: 1; color: var(--brand-violet-deep); }
.lp-faq__item[open] summary::after { content: "\\2212"; }
.lp-faq__item p { margin-top: 14px; }

/* ── Final CTA ── */
.lp-cta { position: relative; padding: 120px 0; background: var(--brand-ink); overflow: hidden; }
.lp-cta__photo { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.lp-cta__shade { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(36, 38, 42, 0.86), rgba(42, 19, 87, 0.9)); }
.lp-cta__body { text-align: center; display: flex; flex-direction: column; align-items: center; }
.lp-cta__body .lp-h2 { max-width: 16em; }
.lp-cta__actions { display: flex; flex-wrap: wrap; justify-content: center; gap: 12px; margin-top: 34px; }

/* ── Misc ── */
@keyframes lp-spin { to { transform: rotate(360deg); } }
.lp-spinner { width: 14px; height: 14px; border: 2px solid rgba(255, 255, 255, 0.4); border-top-color: #fff; border-radius: 50%; display: inline-block; animation: lp-spin 0.7s linear infinite; }
.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
@media (prefers-reduced-motion: reduce) { .lp * { animation: none !important; transition: none !important; } }

/* ── Responsive ── */
@media (max-width: 1024px) {
  .lp-hero__grid { grid-template-columns: 1fr; gap: 48px; }
  .lp-mock { max-width: 640px; }
  .lp-mock__ask { left: 12px; }
  .lp-caps { grid-template-columns: repeat(2, 1fr); }
  .lp-feature, .lp-faq { grid-template-columns: 1fr; gap: 32px; }
  .lp-feature--flip .lp-feature__photo { order: 0; }
  .lp-steps, .lp-audience { grid-template-columns: 1fr; }
  .lp-step { padding-bottom: 36px; }
  .lp-section { padding: 80px 0; }
  .lp-head--tight { margin: 80px 0 48px; }
}
@media (max-width: 640px) {
  .lp section[id] { scroll-margin-top: 64px; }
  .lp-container { padding: 0 16px; }
  .lp-hero { padding: 40px 0 64px; }
  .lp-hero__sub { font-size: 17px; }
  .lp-prompt__bar { flex-direction: column; align-items: stretch; }
  .lp-prompt__hint { display: none; }
  .lp-caps { grid-template-columns: 1fr; }
  .lp-mock__body { grid-template-columns: 36px minmax(0, 1fr); min-height: 260px; }
  .lp-mock__panel { display: none; }
  .lp-mock__hero { grid-template-columns: 1fr; }
  .lp-mock__hero img { height: 80px; }
  .lp-head { margin-bottom: 36px; }
  .lp-cta { padding: 80px 0; }
}
`;
