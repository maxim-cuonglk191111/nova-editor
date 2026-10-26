// Styles for the shared public header and footer (landing, pricing, terms, privacy).
// Same hand-made language as the landing page: paper, 2px ink rules, a lime highlighter on
// hover, buttons with a hard shadow. Colors come from the --brand-* tokens in globals.css.
export const PUBLIC_CHROME_CSS = `
.pn { position: sticky; top: 0; z-index: 60; background: var(--brand-paper); border-bottom: 2px solid var(--brand-ink); font-family: var(--font-suisse-intl); }
.pn__inner { max-width: 1240px; margin: 0 auto; height: 76px; padding: 0 28px; display: flex; align-items: center; gap: 32px; }
.pn__brand { display: inline-flex; align-items: center; gap: 10px; text-decoration: none; color: var(--brand-ink); flex-shrink: 0; border-radius: 10px; transition: transform 0.15s; }
.pn__brand:hover { transform: rotate(-3deg); }
.pn__brand span { font-family: var(--font-bricolage), var(--font-lyon-display), sans-serif; font-weight: 800; font-size: 26px; letter-spacing: -0.04em; }
.pn__links { display: flex; align-items: center; gap: 4px; margin: 0; padding: 0; flex: 1; }
.pn__link { display: inline-flex; align-items: center; min-height: 44px; padding: 0 14px; border-radius: 10px; font-size: 16px; font-weight: 600; color: var(--brand-ink); text-decoration: none; transition: background-color 0.12s, transform 0.12s; }
.pn__link:hover { background: var(--brand-lime); transform: rotate(-1.5deg); }
.pn__link[aria-current="page"] { background: var(--brand-lime); }
.pn__actions { display: flex; align-items: center; gap: 12px; margin-left: auto; flex-shrink: 0; min-width: 120px; justify-content: flex-end; }
.pn__btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-height: 46px; padding: 0 20px; border-radius: 10px; border: 2px solid var(--brand-ink); font-family: var(--font-bricolage), var(--font-lyon-display), sans-serif; font-size: 16px; font-weight: 700; text-decoration: none; white-space: nowrap; cursor: pointer; transition: transform 0.12s, box-shadow 0.12s, background-color 0.12s; }
.pn__btn--primary { background: var(--brand-violet); color: #fff; box-shadow: 3px 3px 0 var(--brand-ink); }
.pn__btn--primary:hover { transform: translate(-2px, -2px); box-shadow: 5px 5px 0 var(--brand-ink); }
.pn__btn--primary:active { transform: translate(3px, 3px); box-shadow: 0 0 0 var(--brand-ink); }
.pn__btn--ghost { border-color: transparent; background: transparent; color: var(--brand-ink); }
.pn__btn--ghost:hover { background: var(--brand-lime); border-color: var(--brand-ink); }
.pn__btn--outline { background: var(--brand-paper); color: var(--brand-ink); box-shadow: 3px 3px 0 var(--brand-ink); }
.pn :focus-visible, .pf :focus-visible { outline: 3px solid var(--brand-violet); outline-offset: 3px; }
.pn__toggle { display: none; width: 46px; height: 46px; align-items: center; justify-content: center; border: 2px solid var(--brand-ink); border-radius: 10px; background: var(--brand-lime); color: var(--brand-ink); cursor: pointer; margin-left: auto; box-shadow: 3px 3px 0 var(--brand-ink); }
.pn__toggle:active { transform: translate(3px, 3px); box-shadow: 0 0 0 var(--brand-ink); }
.pn__panel { display: none; }
.pn__avatar { display: none; }

@media (max-width: 960px) {
  .pn__inner { gap: 12px; padding: 0 16px; height: 68px; }
  .pn__links, .pn__actions { display: none; }
  .pn__toggle { display: inline-flex; margin-left: auto; }
  .pn__avatar { display: flex; margin-left: auto; }
  .pn__avatar + .pn__toggle { margin-left: 0; }
  .pn__panel { display: flex; flex-direction: column; gap: 6px; position: absolute; left: 0; right: 0; top: 100%; padding: 14px 16px 22px; background: var(--brand-paper); border-bottom: 2px solid var(--brand-ink); max-height: calc(100vh - 68px); overflow-y: auto; }
  .pn__panel .pn__link { min-height: 54px; font-size: 20px; font-family: var(--font-bricolage), var(--font-lyon-display), sans-serif; font-weight: 800; padding: 0 12px; }
  .pn__panel .pn__btn { min-height: 54px; width: 100%; margin-top: 8px; }
}

/* ── Footer ── */
.pf { background: var(--brand-ink); color: rgba(243, 239, 230, 0.82); font-family: var(--font-suisse-intl); position: relative; overflow: hidden; }
.pf__inner { max-width: 1240px; margin: 0 auto; padding: 72px 28px 28px; position: relative; z-index: 1; }
.pf__grid { display: grid; grid-template-columns: 1.5fr repeat(3, 1fr); gap: 40px; }
.pf__brand { display: inline-flex; align-items: center; gap: 10px; color: var(--brand-paper); text-decoration: none; font-family: var(--font-bricolage), var(--font-lyon-display), sans-serif; font-weight: 800; font-size: 26px; letter-spacing: -0.04em; border-radius: 10px; }
.pf__tag { margin: 18px 0 0; font-size: 16px; line-height: 1.6; max-width: 24em; }
.pf__h { margin: 0 0 14px; font-family: var(--font-roboto-mono); font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--brand-lime); font-weight: 500; }
.pf__list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 4px; }
.pf__link { display: inline-flex; align-items: center; min-height: 38px; font-size: 16px; color: rgba(243, 239, 230, 0.82); text-decoration: none; }
.pf__link:hover { color: var(--brand-lime); text-decoration: underline; text-decoration-thickness: 2px; text-underline-offset: 5px; }
.pf :focus-visible { outline-color: var(--brand-lime); }
.pf__bar { margin-top: 56px; padding-top: 24px; border-top: 2px solid rgba(243, 239, 230, 0.2); font-size: 14px; }
.pf__giant { position: relative; z-index: 0; margin: -28px 0 -0.19em; text-align: center; font-family: var(--font-bricolage), var(--font-lyon-display), sans-serif; font-weight: 800; font-size: clamp(120px, 27vw, 420px); line-height: 0.9; letter-spacing: -0.06em; color: transparent; -webkit-text-stroke: 2px rgba(218, 199, 250, 0.35); user-select: none; pointer-events: none; }
@media (max-width: 860px) { .pf__grid { grid-template-columns: 1fr 1fr; } .pf__grid > :first-child { grid-column: 1 / -1; } }
@media (max-width: 480px) { .pf__inner { padding: 56px 18px 24px; } .pf__grid { grid-template-columns: 1fr; gap: 30px; } }
`;
