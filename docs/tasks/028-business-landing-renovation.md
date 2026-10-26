# Task 028 — Business Landing Page Renovation & Dead-Link Removal

- **Status:** Closed
- **Filed:** 2026-10-26
- **Completed:** 2026-10-26
- **Owner:** Claude Code
- **Severity:** Medium (first impression; dead nav link)

---

## 1. Problem & Root Cause

1. **Dead link:** `PublicNav` linked "Docs" to `/docs`; no such route exists (`app/` has pricing, privacy, terms, projects only).
2. **Does not read as a business site:** hero was a hot-linked Webflow cloud video (third-party asset) over a dark gradient. Request PDF page 1 asked for business/branding imagery; task 020 only changed a gradient, so that part was never delivered.
3. **Invented content:** three fake testimonials and "Nova connects with Figma, GitHub, Vercel and hundreds more" with a CTA that just went to signup.

## 2. Solution Checklist

- [x] Replace `/docs` with `/#features`, `/#faq` anchors (desktop + mobile menu); drop `nav.docs`, add `nav.faq`.
- [x] Self-host five business photos in `public/images/landing/`.
- [x] Rebuild `app/page.tsx`: hero + prompt, features, steps, audience, pricing (`PricingGrid`), FAQ, CTA.
- [x] Remove testimonials, integrations section, typing animation; trim `site.*` keys.
- [x] vi + en copy; Vietnamese checked with Montserrat.
- [x] Empty-prompt CTA focuses the textarea instead of looking disabled.

## 3. Verification

- Link audit: all 8 hrefs 200 / anchors present; `mailto:support@nova.build` unverifiable.
- Playwright + system Chrome at 1440 / 1024 / 390, en + vi: h-overflow 0, console clean.
- typecheck, lint (0 errors), `i18n-audit --max=0`, `pnpm test`, `solid:audit` (0 blocking) pass.
- `next build` and `build:cf` fail on this machine for environment reasons (see report), not verified.
