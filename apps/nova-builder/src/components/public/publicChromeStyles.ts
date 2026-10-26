// Styles for the shared public header and footer (landing, pricing, terms, privacy).
export const PUBLIC_CHROME_CSS = `
.pn {
  position: sticky; top: 0; z-index: 60;
  background: rgba(255, 255, 255, 0.94);
  -webkit-backdrop-filter: saturate(1.4) blur(14px); backdrop-filter: saturate(1.4) blur(14px);
  border-bottom: 1px solid var(--brand-rule);
  font-family: var(--font-suisse-intl);
}
.pn__inner { max-width: 1200px; margin: 0 auto; height: 72px; padding: 0 24px; display: flex; align-items: center; gap: 32px; }
.pn__brand { display: inline-flex; align-items: center; gap: 10px; text-decoration: none; color: var(--brand-ink); flex-shrink: 0; border-radius: 8px; }
.pn__brand span { font-family: var(--font-lyon-display); font-weight: 800; font-size: 21px; letter-spacing: -0.02em; }
.pn__links { display: flex; align-items: center; gap: 4px; margin: 0; padding: 0; list-style: none; flex: 1; }
.pn__link {
  display: inline-flex; align-items: center; min-height: 44px; padding: 0 14px; border-radius: 8px;
  font-size: 15px; font-weight: 500; color: var(--brand-ink); text-decoration: none; transition: background-color 0.15s, color 0.15s;
}
.pn__link:hover { background: var(--brand-tint); color: var(--brand-violet-deep); }
.pn__link[aria-current="page"] { color: var(--brand-violet-deep); background: var(--brand-tint); font-weight: 600; }
.pn__actions { display: flex; align-items: center; gap: 8px; margin-left: auto; flex-shrink: 0; min-width: 120px; justify-content: flex-end; }
.pn__btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-height: 44px; padding: 0 20px; border-radius: 8px;
  font-family: var(--font-lyon-display); font-size: 15px; font-weight: 600; text-decoration: none; white-space: nowrap;
  border: 1px solid transparent; cursor: pointer; transition: background-color 0.15s, border-color 0.15s;
}
.pn__btn--primary { background: var(--brand-violet); color: #fff; }
.pn__btn--primary:hover { background: var(--brand-violet-deep); }
.pn__btn--ghost { color: var(--brand-ink); background: transparent; }
.pn__btn--ghost:hover { background: var(--brand-tint); }
.pn__btn--outline { color: var(--brand-violet-deep); border-color: var(--brand-violet); background: #fff; }
.pn__btn--outline:hover { background: var(--brand-tint); }
.pn :focus-visible, .pf :focus-visible { outline: 2px solid var(--brand-violet); outline-offset: 2px; }
.pn__toggle { display: none; width: 44px; height: 44px; align-items: center; justify-content: center; border: 1px solid var(--brand-rule); border-radius: 8px; background: #fff; color: var(--brand-ink); cursor: pointer; margin-left: auto; }
.pn__panel { display: none; }
.pn__avatar { display: none; }

@media (max-width: 960px) {
  .pn__inner { gap: 12px; padding: 0 16px; height: 64px; }
  .pn__links, .pn__actions { display: none; }
  .pn__toggle { display: inline-flex; margin-left: auto; }
  .pn__avatar { display: flex; margin-left: auto; }
  .pn__avatar + .pn__toggle { margin-left: 0; }
  .pn__panel {
    display: flex; flex-direction: column; gap: 4px; position: absolute; left: 0; right: 0; top: 100%;
    padding: 12px 16px 20px; background: #fff; border-bottom: 1px solid var(--brand-rule);
    box-shadow: 0 18px 30px -18px rgba(36, 38, 42, 0.35); max-height: calc(100vh - 64px); overflow-y: auto;
  }
  .pn__panel .pn__link { min-height: 52px; font-size: 17px; padding: 0 12px; }
  .pn__panel .pn__btn { min-height: 52px; width: 100%; margin-top: 8px; }
}

/* ── Footer ── */
.pf { background: var(--brand-ink); color: rgba(255, 255, 255, 0.78); font-family: var(--font-suisse-intl); }
.pf__inner { max-width: 1200px; margin: 0 auto; padding: 64px 24px 28px; }
.pf__grid { display: grid; grid-template-columns: 1.5fr repeat(3, 1fr); gap: 40px; }
.pf__brand { display: inline-flex; align-items: center; gap: 10px; color: #fff; text-decoration: none; font-family: var(--font-lyon-display); font-weight: 800; font-size: 21px; letter-spacing: -0.02em; border-radius: 8px; }
.pf__tag { margin: 16px 0 0; font-size: 15px; line-height: 1.6; max-width: 26em; }
.pf__h { margin: 0 0 14px; font-family: var(--font-roboto-mono); font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--brand-lavender); font-weight: 500; }
.pf__list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 4px; }
.pf__link { display: inline-flex; align-items: center; min-height: 36px; font-size: 15px; color: rgba(255, 255, 255, 0.78); text-decoration: none; }
.pf__link:hover { color: #fff; text-decoration: underline; text-underline-offset: 4px; }
.pf :focus-visible { outline-color: var(--brand-lavender); }
.pf__bar { margin-top: 48px; padding-top: 24px; border-top: 1px solid rgba(255, 255, 255, 0.14); font-size: 14px; }
@media (max-width: 860px) { .pf__grid { grid-template-columns: 1fr 1fr; } .pf__grid > :first-child { grid-column: 1 / -1; } }
@media (max-width: 480px) { .pf__inner { padding: 48px 16px 24px; } .pf__grid { grid-template-columns: 1fr; gap: 28px; } }
`;
