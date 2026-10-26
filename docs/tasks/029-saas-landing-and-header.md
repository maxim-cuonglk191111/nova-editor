# Task 029 — SaaS landing page and shared public header

- **Status:** Closed
- **Filed:** 2026-10-26
- **Owner:** Claude Code
- **Severity:** High (first impression; header complaints; dead "Projects" button)

## Symptom
Complaints about the landing page: the header and the AI icon. The "Dự án" button did nothing. A "Tài liệu" link led to a missing page.

## Root cause
- `PublicNav` gave the signed-in Projects link the class `on-nav-link--current`, defined as `pointer-events: none`.
- The header was a 20px mark with 12px mono uppercase links in a translucent floating bar; the AI mark was a `✦` glyph and emoji.
- No `/docs` route exists (removed in task 028 from the landing nav, still referenced in the design brief).

## Plan / done
- [x] Unify header and footer (`PublicNav`, `PublicFooter`) for landing, pricing, terms, privacy; `aria-current` instead of pointer-events.
- [x] `--brand-*` tokens from `public/logo.svg`; icon set in `components/landing/icons.tsx`.
- [x] Landing rebuilt: hero + editor picture, capabilities, feature rows, steps, audiences, pricing, FAQ, CTA.
- [x] e2e `landing-header.spec.ts`; axe gate extended to terms/privacy.

## Notes
- The hero is graphite with a drawn editor picture rather than a stock photo. Business photos remain in the feature rows and the closing CTA. If the client wants a photo hero again, only `.lp-hero` and `LandingHero` change.
- Signed-in header is tested with a stubbed `/api/auth/session`; no real account was used.
- Open: the drawn editor picture is decorative and approximate; replace with a real product screenshot when one is approved.
