# Task 031 — Landing page: make it feel hand-made, not template-made

- **Status:** Closed
- **Filed:** 2026-10-27
- **Owner:** Claude Code

## Feedback
Task 029 met the brief but read as "normie": a dark hero with a purple glow and a grid of icon cards is what every AI-generated SaaS page looks like. Brief for this pass: it should look like it was made by a person, a very good designer with a relaxed head, not by a model.

## Direction
- **Paper, not screen.** Warm paper with a little grain instead of white and gradients; graphite (the logo tile) for ink; the logo violet as the voice; one unexpected accent, a lime highlighter, for emphasis. No soft shadows, no glass, no gradient washes.
- **Things you could cut out.** 2px ink outlines, hard offset shadows that press down on click, taped polaroid photos at slight angles, stickers, a multiplayer-style cursor, a ticker band.
- **Hand-drawn marks** (`landing/doodles.tsx`): squiggle under the key phrase, a curly arrow and a handwritten "start here" pointing at the prompt box. Fraunces italic carries the "human voice"; Bricolage Grotesque carries the headlines.
- **Plain speech.** "Your business deserves a website that doesn't look like everyone's." "Three steps. No meetings." "Pick a plan. Or don't, free is real." (vi written separately, not translated word for word.)
- **Structure with a point of view.** Editorial numbered index instead of icon tiles, loose tilted audience cards, outlined step numerals, giant outlined wordmark in the footer.

## Constraints kept
- Fonts: Bricolage Grotesque and Fraunces both ship a Vietnamese subset (checked against the Google Fonts CSS). Caveat was rejected: no Vietnamese. Montserrat remains the app's heading font.
- No emoji or glyph icons; decorative art is `aria-hidden`; every control is ≥ 44px; `prefers-reduced-motion` stops the ticker (it wraps instead).
- Contrast is checked by the axe gate (`e2e/a11y.spec.ts`).

## Checklist
- [x] fonts, tokens (`--brand-paper`, `--brand-lime`)
- [x] doodles, collage hero, ticker, index, taped photos, steps, CTA, footer wordmark
- [x] header/footer restyled (shared by pricing, terms, privacy)
- [x] PricingGrid restyled to match
- [x] axe + header spec green on this branch (23 of 24; the one failure was a stale background-colour assertion, fixed)
- [x] screenshots reviewed: vi 1440 (hero, index) and en 390 (hero). **Not re-reviewed:** 768 and 1024, vi 390, the lower sections on phones.
