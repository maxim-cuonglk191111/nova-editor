// Styles for the public landing page (app/page.tsx). The look is pinned-up and hand-made on
// purpose: warm paper with a little grain, hard 2px ink outlines with offset shadows that
// press down on click, a lime highlighter next to the violet from the logo, slightly tilted
// photos and stickers. Display type is Bricolage Grotesque, the voice accent is Fraunces
// italic, body is Inter. Nothing here uses a soft drop shadow, a glass blur or a gradient wash.
const GRAIN =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 .14 0 0 0 0 .14 0 0 0 0 .16 0 0 0 .08 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")";

export const LANDING_CSS = `
.lp {
  --paper: var(--brand-paper); --paper-2: var(--brand-paper-2); --ink: var(--brand-ink);
  --violet: var(--brand-violet); --lime: var(--brand-lime); --lav: var(--brand-lavender);
  --display: var(--font-bricolage), var(--font-lyon-display), sans-serif;
  --serif: var(--font-fraunces), Georgia, serif;
  background-color: var(--paper); background-image: ${GRAIN};
  color: var(--ink); font-family: var(--font-suisse-intl); overflow-x: hidden;
}
.lp img { display: block; max-width: 100%; }
.lp section[id] { scroll-margin-top: 88px; }
.lp :focus-visible { outline: 3px solid var(--violet); outline-offset: 3px; }
.lp ::selection { background: var(--lime); color: var(--ink); }
.lp-container { max-width: 1240px; margin: 0 auto; padding: 0 28px; position: relative; }

/* ── Type ── */
.lp-eyebrow { display: inline-flex; align-items: center; gap: 12px; font-family: var(--font-roboto-mono); font-size: 13px; font-weight: 500; letter-spacing: 0.12em; text-transform: uppercase; color: var(--brand-violet-deep); margin: 0 0 18px; }
.lp-eyebrow::before { content: ""; width: 30px; height: 12px; background: var(--lime); border: 2px solid var(--ink); border-radius: 3px; transform: rotate(-4deg); }
.lp-eyebrow--light { color: var(--lav); }
.lp-eyebrow--light::before { border-color: var(--lav); }
.lp-h2 { font-family: var(--display); font-weight: 800; font-size: clamp(32px, 4.4vw, 58px); line-height: 1.04; letter-spacing: -0.035em; margin: 0; max-width: 17em; text-wrap: balance; }
.lp-h2--light { color: var(--paper); }
.lp-h3 { font-family: var(--display); font-weight: 800; font-size: clamp(26px, 2.8vw, 36px); line-height: 1.1; letter-spacing: -0.025em; margin: 0 0 16px; }
.lp-lead { font-size: 19px; line-height: 1.6; color: var(--brand-muted); margin: 20px 0 0; max-width: 38em; }
.lp-lead--light { color: rgba(243, 239, 230, 0.9); }
.lp-body { font-size: 16px; line-height: 1.65; color: var(--brand-muted); margin: 0; max-width: 34em; }

/* ── Buttons: outlined, with a hard shadow that presses in ── */
.lp-btn { display: inline-flex; align-items: center; justify-content: center; gap: 10px; min-height: 52px; padding: 0 26px; border-radius: 12px; border: 2px solid var(--ink); font-family: var(--display); font-size: 16px; font-weight: 700; text-decoration: none; cursor: pointer; white-space: nowrap; box-shadow: 3px 3px 0 var(--ink); transition: transform 0.12s, box-shadow 0.12s, background-color 0.12s; }
.lp-btn:hover:not(:disabled) { transform: translate(-2px, -2px); box-shadow: 5px 5px 0 var(--ink); }
.lp-btn:active:not(:disabled) { transform: translate(3px, 3px); box-shadow: 0 0 0 var(--ink); }
.lp-btn--primary { background: var(--violet); color: #fff; }
.lp-btn--lime { background: var(--lime); color: var(--ink); }
.lp-btn--paper { background: var(--paper); color: var(--ink); }
.lp-btn:disabled { opacity: 0.65; cursor: wait; }
.lp-link { display: inline-flex; align-items: center; gap: 8px; color: var(--ink); font-family: var(--display); font-weight: 700; text-decoration: underline; text-decoration-thickness: 3px; text-decoration-color: var(--lime); text-underline-offset: 5px; }
.lp-link:hover { text-decoration-color: var(--violet); }

/* ── Hero ── */
.lp-hero { padding: 64px 0 88px; position: relative; }
.lp-hero__grid { display: grid; grid-template-columns: minmax(0, 1.18fr) minmax(0, 1fr); gap: 48px; align-items: center; }
.lp-badge { display: inline-flex; align-items: center; gap: 8px; padding: 7px 16px 7px 12px; border: 2px solid var(--ink); border-radius: 999px; background: var(--lime); color: var(--ink); font-size: 14px; font-weight: 600; transform: rotate(-1.5deg); }
.lp-hero__title { font-family: var(--display); font-weight: 800; font-size: clamp(38px, 4.7vw, 70px); line-height: 1.04; letter-spacing: -0.04em; margin: 22px 0 0; text-wrap: balance; }
.lp-hero__hand { position: relative; display: inline; font-family: var(--serif); font-style: italic; font-weight: 500; letter-spacing: -0.03em; color: var(--brand-violet-deep); }
.lp-hero__squiggle { position: absolute; left: 0; right: 0; bottom: -0.2em; width: 100%; height: 0.24em; color: var(--lime); filter: drop-shadow(0 1.5px 0 var(--ink)); }
.lp-hero__sub { font-size: 19px; line-height: 1.6; color: var(--brand-muted); margin: 30px 0 0; max-width: 34em; }
.lp-prompt-wrap { position: relative; margin-top: 58px; max-width: 620px; }
.lp-note { position: absolute; right: 6%; top: -60px; display: flex; align-items: flex-start; gap: 4px; font-family: var(--serif); font-style: italic; font-size: 24px; color: var(--brand-violet-deep); transform: rotate(-5deg); pointer-events: none; }
.lp-note__arrow { width: 52px; height: 48px; margin-top: 6px; transform: rotate(18deg) scaleX(-1); }
.lp-prompt { background: #fff; border: 2px solid var(--ink); border-radius: 16px; padding: 16px 16px 14px 20px; box-shadow: 7px 7px 0 var(--violet); transform: rotate(-0.6deg); }
.lp-prompt__input { width: 100%; border: 0; outline: 0; resize: none; background: transparent; color: var(--ink); font-family: var(--font-suisse-intl); font-size: 17px; line-height: 1.5; padding: 2px 0; }
.lp-prompt__input::placeholder { color: #5d6069; }
.lp-prompt__bar { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding-top: 12px; border-top: 2px dashed var(--ink); margin-top: 6px; }
.lp-prompt__hint { font-family: var(--font-roboto-mono); font-size: 12px; color: #4b4e57; }
.lp-chips { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; margin-top: 26px; max-width: 620px; }
.lp-chips__label { font-family: var(--font-roboto-mono); font-size: 13px; color: var(--brand-muted); margin-right: 2px; }
.lp-chip { min-height: 38px; padding: 0 16px; border-radius: 999px; border: 2px solid var(--ink); background: var(--paper); color: var(--ink); font-size: 14px; font-weight: 600; font-family: inherit; cursor: pointer; transition: background-color 0.12s, transform 0.12s; }
.lp-chip:hover { background: var(--lime); transform: rotate(-2deg); }
.lp-trust { list-style: none; margin: 30px 0 0; padding: 0; display: flex; flex-wrap: wrap; gap: 8px 26px; }
.lp-trust li { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 500; }
.lp-trust svg { color: var(--violet); }

/* ── Hero collage ── */
.lp-collage { position: relative; min-height: 560px; }
.lp-win { position: absolute; left: 2%; top: 20px; width: 92%; background: #fff; border: 2px solid var(--ink); border-radius: 16px; overflow: hidden; box-shadow: 12px 12px 0 var(--violet); transform: rotate(2.2deg); }
.lp-win__bar { display: flex; align-items: center; gap: 7px; padding: 11px 14px; background: var(--lav); border-bottom: 2px solid var(--ink); }
.lp-win__bar i { width: 11px; height: 11px; border-radius: 50%; border: 2px solid var(--ink); background: var(--paper); }
.lp-win__bar span { flex: 1; height: 18px; margin-left: 10px; max-width: 58%; border: 2px solid var(--ink); border-radius: 9px; background: #fff; }
.lp-win__body { padding: 18px; display: flex; flex-direction: column; gap: 18px; background: var(--paper); }
.lp-win__nav { display: flex; align-items: center; gap: 10px; }
.lp-win__nav b { width: 24px; height: 24px; border-radius: 7px; background: var(--ink); }
.lp-win__nav span { width: 36px; height: 7px; border-radius: 4px; background: #c9c1b0; }
.lp-win__nav em { margin-left: auto; width: 54px; height: 22px; border-radius: 7px; background: var(--violet); border: 2px solid var(--ink); }
.lp-win__hero { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; align-items: center; }
.lp-win__copy { display: flex; flex-direction: column; gap: 9px; }
.lp-win__h { height: 16px; border-radius: 4px; background: var(--ink); width: 92%; }
.lp-win__h--short { width: 60%; }
.lp-win__p { height: 8px; border-radius: 4px; background: #c9c1b0; width: 96%; }
.lp-win__p--short { width: 70%; }
.lp-win__btn { width: 74px; height: 26px; margin-top: 4px; border-radius: 8px; border: 2px solid var(--ink); background: var(--lime); }
.lp-win__sel { position: relative; border: 2px dashed var(--violet); padding: 5px; border-radius: 4px; }
.lp-win__sel img { width: 100%; height: 118px; object-fit: cover; border-radius: 2px; }
.lp-win__sel u { position: absolute; width: 10px; height: 10px; background: #fff; border: 2px solid var(--violet); border-radius: 2px; }
.lp-win__sel u:nth-of-type(1) { left: -7px; top: -7px; } .lp-win__sel u:nth-of-type(2) { right: -7px; top: -7px; }
.lp-win__sel u:nth-of-type(3) { left: -7px; bottom: -7px; } .lp-win__sel u:nth-of-type(4) { right: -7px; bottom: -7px; }
.lp-win__row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
.lp-win__row span { height: 50px; border-radius: 8px; border: 2px solid var(--ink); background: #fff; }
.lp-win__row span:nth-child(2) { background: var(--lav); }
.lp-polaroid { position: relative; margin: 0; background: #fff; border: 2px solid var(--ink); padding: 12px 12px 44px; box-shadow: 6px 6px 0 var(--ink); }
.lp-polaroid img { width: 100%; aspect-ratio: 4 / 3; object-fit: cover; border: 2px solid var(--ink); }
.lp-polaroid .lp-tape { position: absolute; top: -17px; left: 50%; width: 96px; height: 30px; margin-left: -48px; color: rgba(217, 242, 94, 0.92); transform: rotate(-3deg); }
.lp-polaroid--hero { position: absolute; right: -2%; bottom: 74px; width: 46%; transform: rotate(-7deg); }
.lp-polaroid--hero img { aspect-ratio: 3 / 2; }
.lp-cursor { position: absolute; left: 30%; top: 50%; display: flex; align-items: flex-start; gap: 2px; color: var(--violet); filter: drop-shadow(2px 2px 0 var(--ink)); }
.lp-cursor svg { stroke: var(--ink); }
.lp-cursor span { margin-top: 20px; padding: 2px 10px; border-radius: 6px; background: var(--violet); border: 2px solid var(--ink); color: #fff; font-family: var(--font-roboto-mono); font-size: 12px; }
.lp-sticker { position: absolute; width: 124px; height: 124px; display: grid; place-items: center; text-align: center; transform: rotate(13deg); }
.lp-sticker__bg { position: absolute; inset: 0; width: 100%; height: 100%; color: var(--lime); stroke: var(--ink); }
.lp-sticker span { position: relative; padding: 0 22px; font-family: var(--display); font-weight: 800; font-size: 13px; line-height: 1.1; text-transform: uppercase; letter-spacing: 0.02em; color: var(--ink); }
.lp-collage .lp-sticker { top: -14px; right: 0; }
.lp-ask { position: absolute; left: 0; bottom: 0; max-width: 64%; display: flex; align-items: flex-start; gap: 10px; padding: 14px 18px; border-radius: 18px 18px 18px 4px; border: 2px solid var(--ink); background: var(--ink); color: var(--lav); font-size: 14px; line-height: 1.45; box-shadow: 5px 5px 0 var(--lime); transform: rotate(-1.8deg); }
.lp-ask svg { flex-shrink: 0; margin-top: 2px; color: var(--lime); }
.lp-ask span { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }

/* ── Ticker ── */
.lp-ticker { background: var(--lime); border-block: 2px solid var(--ink); transform: rotate(-1.1deg); margin: 0 -3% 0; padding: 16px 0; overflow: hidden; position: relative; z-index: 2; }
.lp-ticker__track { display: flex; width: max-content; margin: 0; padding: 0; list-style: none; animation: lp-marquee 42s linear infinite; }
.lp-ticker:hover .lp-ticker__track { animation-play-state: paused; }
.lp-ticker__track li { display: flex; align-items: center; gap: 14px; padding-right: 44px; font-family: var(--display); font-weight: 800; font-size: 26px; letter-spacing: -0.02em; white-space: nowrap; }
.lp-ticker__track svg { color: var(--violet); flex-shrink: 0; }
@keyframes lp-marquee { to { transform: translateX(-50%); } }

/* ── Sections ── */
.lp-section { padding: 120px 0; position: relative; }
.lp-section--ink { background: var(--ink); color: var(--paper); }
.lp-section--paper2 { background: var(--paper-2); border-block: 2px solid var(--ink); }
.lp-head { margin-bottom: 64px; }
.lp-head--tight { margin: 128px 0 72px; }

/* ── Index of what is built in ── */
.lp-index { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(2, 1fr); gap: 0 56px; }
.lp-index__item { display: grid; grid-template-columns: 56px 1fr; column-gap: 8px; padding: 26px 18px 30px; border-top: 2px solid var(--ink); transition: background-color 0.15s; }
.lp-index__item:hover { background: var(--lime); }
.lp-index__num { grid-row: span 2; font-family: var(--font-roboto-mono); font-size: 14px; padding-top: 8px; color: var(--brand-violet-deep); }
.lp-index__title { margin: 0 0 8px; font-family: var(--display); font-weight: 800; font-size: 26px; letter-spacing: -0.025em; }
.lp-index__item:hover .lp-body, .lp-index__item:hover .lp-index__num { color: var(--ink); }

/* ── Feature rows with taped photos ── */
.lp-feature { display: grid; grid-template-columns: 1.05fr 1fr; gap: 88px; align-items: center; }
.lp-feature + .lp-feature { margin-top: 112px; }
.lp-feature--flip .lp-polaroid { order: 2; }
.lp-polaroid--a { transform: rotate(-2.2deg); }
.lp-polaroid--b { transform: rotate(1.8deg); }
.lp-feature__num { display: block; font-family: var(--display); font-weight: 800; font-size: 104px; line-height: 0.8; color: transparent; -webkit-text-stroke: 2px var(--violet); margin-bottom: 18px; }
.lp-points { list-style: none; margin: 28px 0 0; padding: 0; display: flex; flex-direction: column; gap: 12px; }
.lp-points li { display: flex; align-items: flex-start; gap: 10px; font-size: 16px; line-height: 1.5; font-weight: 500; }
.lp-points svg { flex-shrink: 0; margin-top: 2px; color: var(--violet); }

/* ── Steps ── */
.lp-steps { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(3, 1fr); gap: 0 56px; }
.lp-step { border-top: 2px solid var(--lav); padding-top: 22px; }
.lp-step__num { display: block; font-family: var(--display); font-weight: 800; font-size: clamp(110px, 13vw, 190px); line-height: 0.82; color: transparent; -webkit-text-stroke: 2px var(--lav); }
.lp-step__title { font-family: var(--display); font-weight: 800; font-size: 32px; letter-spacing: -0.025em; margin: 22px 0 12px; color: var(--lime); }
.lp-step__body { font-size: 17px; line-height: 1.65; color: rgba(243, 239, 230, 0.88); margin: 0; max-width: 24em; }

/* ── Audiences: loose tilted cards ── */
.lp-audience { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(3, 1fr); gap: 28px; }
.lp-audience__item { background: #fff; border: 2px solid var(--ink); border-radius: 16px; padding: 26px 26px 30px; box-shadow: 6px 6px 0 var(--ink); transition: transform 0.15s, background-color 0.15s; }
.lp-audience__item:nth-child(odd) { transform: rotate(-0.8deg); }
.lp-audience__item:nth-child(even) { transform: rotate(0.7deg); }
.lp-audience__item:hover { transform: rotate(0) translateY(-3px); background: var(--lime); }
.lp-audience__item:hover .lp-body { color: var(--ink); }
.lp-audience__title { font-family: var(--display); font-weight: 800; font-size: 24px; letter-spacing: -0.02em; margin: 0 0 10px; }

/* ── Pricing / FAQ ── */
.lp-more { margin: 14px 0 0; text-align: center; }
.lp-faq { display: grid; grid-template-columns: 1fr 1.7fr; gap: 80px; align-items: start; }
.lp-faq__item { border-bottom: 2px solid var(--ink); padding: 24px 0; }
.lp-faq__item:first-child { border-top: 2px solid var(--ink); }
.lp-faq__item summary { font-family: var(--display); font-weight: 700; font-size: 22px; line-height: 1.3; letter-spacing: -0.015em; cursor: pointer; list-style: none; display: flex; justify-content: space-between; align-items: center; gap: 20px; min-height: 36px; }
.lp-faq__item summary::-webkit-details-marker { display: none; }
.lp-faq__item summary::after { content: "+"; flex-shrink: 0; width: 38px; height: 38px; display: grid; place-items: center; border: 2px solid var(--ink); border-radius: 50%; font-family: var(--font-roboto-mono); font-size: 22px; line-height: 1; background: var(--paper); transition: background-color 0.15s, transform 0.2s; }
.lp-faq__item summary:hover::after { background: var(--lime); }
.lp-faq__item[open] summary::after { content: "\\2212"; background: var(--lime); transform: rotate(180deg); }
.lp-faq__item p { margin-top: 16px; }

/* ── Final CTA ── */
.lp-cta { background: var(--violet); color: var(--paper); padding: 128px 0; border-top: 2px solid var(--ink); position: relative; overflow: hidden; }
.lp-cta__grid { display: grid; grid-template-columns: 1.25fr 1fr; gap: 72px; align-items: center; }
.lp-cta__title { font-family: var(--display); font-weight: 800; font-size: clamp(44px, 6.4vw, 96px); line-height: 0.98; letter-spacing: -0.045em; margin: 0; color: var(--paper); text-wrap: balance; }
.lp-cta .lp-lead { color: rgba(243, 239, 230, 0.94); }
.lp-cta__actions { display: flex; flex-wrap: wrap; gap: 16px; margin-top: 38px; }
.lp-polaroid--cta { transform: rotate(3deg); }
.lp-polaroid--cta img { aspect-ratio: 16 / 11; }
.lp-sticker--cta { top: -34px; right: -26px; }
.lp-cta .lp-btn:focus-visible { outline-color: #fff; }

/* ── Misc ── */
@keyframes lp-spin { to { transform: rotate(360deg); } }
.lp-spinner { width: 16px; height: 16px; border: 2px solid rgba(255, 255, 255, 0.45); border-top-color: #fff; border-radius: 50%; display: inline-block; animation: lp-spin 0.7s linear infinite; }
.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
@media (prefers-reduced-motion: reduce) {
  .lp * { animation: none !important; transition: none !important; }
  .lp-ticker__track { width: auto; flex-wrap: wrap; justify-content: center; row-gap: 8px; }
  .lp-ticker__track li[aria-hidden="true"] { display: none; }
}

/* ── Responsive ── */
@media (max-width: 1080px) {
  .lp-hero__grid { grid-template-columns: 1fr; gap: 72px; }
  .lp-collage { max-width: 640px; min-height: 540px; }
  .lp-index { grid-template-columns: 1fr; }
  .lp-feature, .lp-faq, .lp-cta__grid { grid-template-columns: 1fr; gap: 56px; }
  .lp-feature--flip .lp-polaroid { order: 0; }
  .lp-steps { grid-template-columns: 1fr; row-gap: 12px; }
  .lp-step { padding-bottom: 36px; }
  .lp-audience { grid-template-columns: repeat(2, 1fr); }
  .lp-section { padding: 88px 0; }
  .lp-head--tight { margin: 88px 0 56px; }
  .lp-cta { padding: 88px 0; }
  .lp-polaroid--cta { max-width: 520px; }
}
@media (max-width: 640px) {
  .lp section[id] { scroll-margin-top: 72px; }
  .lp-container { padding: 0 18px; }
  .lp-hero { padding: 40px 0 64px; }
  .lp-hero__sub { font-size: 17px; }
  .lp-prompt-wrap { margin-top: 56px; }
  .lp-note { right: 2%; top: -52px; font-size: 21px; }
  .lp-prompt__bar { flex-direction: column; align-items: stretch; }
  .lp-prompt__hint { display: none; }
  .lp-collage { min-height: 420px; }
  .lp-win { width: 96%; left: 0; }
  .lp-win__row { display: none; }
  .lp-win__sel img { height: 84px; }
  .lp-polaroid--hero { width: 50%; bottom: 62px; right: -3%; }
  .lp-collage .lp-sticker { width: 96px; height: 96px; }
  .lp-collage .lp-sticker span { font-size: 11px; padding: 0 16px; }
  .lp-ask { max-width: 80%; font-size: 13px; }
  .lp-ticker__track li { font-size: 20px; }
  .lp-audience { grid-template-columns: 1fr; }
  .lp-head { margin-bottom: 40px; }
  .lp-feature__num { font-size: 76px; }
  .lp-faq__item summary { font-size: 19px; }
  .lp-sticker--cta { right: -8px; top: -28px; }
}
`;
