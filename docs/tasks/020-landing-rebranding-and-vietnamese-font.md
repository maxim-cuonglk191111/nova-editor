# Task 020 — Landing Page Rebranding & Vietnamese Typography Refresh

- **Status:** Open
- **Filed:** 2026-10-20
- **Owner:** Antigravity / Claude Code
- **Severity:** Medium (Product Positioning & Visual Quality: Irrelevant budget cards in hero; font rendering defects with Vietnamese diacritics)

---

## 1. Problem & Root Cause (Report PDF 1 Page 1)

1. **Remove Budget/Finance Cards:**
   - **Symptom:** Hero/track section displays templates with `$1,586 SPEND THIS MONTH` and `$2,234 BUDGET`, which look like a personal finance app rather than an AI website builder.
   - **Fix:** Remove the budget/spend track cards as requested ("Bỏ phần này").

2. **Corporate & Branding Hero Imagery:**
   - **Symptom:** Hero background video/poster needs a more professional corporate/branding aesthetic.
   - **Fix:** Update hero background and promotional visuals to modern agency/enterprise branding themes.

3. **Vietnamese-Friendly Typography (Montserrat / Inter):**
   - **Symptom:** Current landing display font has awkward diacritic rendering for Vietnamese characters ("font này tiếng việt nhìn hơi khó chịu").
   - **Fix:** Update primary font family to `Montserrat` or `Inter`, ensuring complete Vietnamese unicode glyph support with harmonious accent mark positioning.

---

## 2. Solution Checklist

- [ ] Remove financial cards from `apps/nova-builder/src/app/page.tsx`.
- [ ] Configure `Montserrat` / `Inter` Google font in `layout.tsx` and `landingStyles.ts`.
- [ ] Update hero visual assets with high-taste corporate agency branding.
- [ ] Run `node scripts/i18n-audit.mjs --max=0`.
- [ ] Run `pnpm --filter @nova/builder typecheck`.
- [ ] Verify live in Chrome DevTools MCP.
