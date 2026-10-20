# Task 020 — Landing Page Rebranding & Vietnamese Typography Refresh

- **Status:** Closed
- **Filed:** 2026-10-20
- **Completed:** 2026-10-20
- **Owner:** Antigravity / Claude Code
- **Severity:** Medium (Product Positioning & Visual Quality: Irrelevant budget cards in hero; font rendering defects with Vietnamese diacritics)

---

## 1. Problem & Root Cause (Report PDF 1 Page 1)

1. **Remove Budget/Finance Cards:**
   - **Symptom:** Hero track section displayed templates with `$1,586 SPEND THIS MONTH` and `$2,234 BUDGET`, confusing users with personal finance imagery.
   - **Fix:** Removed the obsolete finance/spend track grid from `apps/nova-builder/src/app/page.tsx`.

2. **Corporate & Branding Hero Imagery:**
   - **Symptom:** Hero background needed a more professional corporate/agency branding atmosphere.
   - **Fix:** Updated hero overlay in `landingStyles.ts` to a deep radial mesh gradient (`rgba(124, 58, 237, 0.22)`) over sleek dark tones (`#05050a`), evoking high-end enterprise software.

3. **Vietnamese-Friendly Typography (Montserrat / Inter):**
   - **Symptom:** Previous `DM_Serif_Display` font lacked the Vietnamese unicode subset, producing awkward diacritic rendering on landing page headings.
   - **Fix:** Integrated Google font `Montserrat` with full `["latin", "vietnamese"]` unicode subset in `layout.tsx` and mapped `--font-lyon-display` to `var(--font-montserrat), var(--font-inter), sans-serif` in `globals.css`.

---

## 2. Solution Checklist

- [x] Remove financial cards from `apps/nova-builder/src/app/page.tsx`.
- [x] Configure `Montserrat` / `Inter` Google font in `layout.tsx` and `landingStyles.ts`.
- [x] Update hero visual assets with high-taste corporate agency branding.
- [x] Run `node scripts/i18n-audit.mjs --max=0`.
- [x] Run `pnpm --filter @nova/builder typecheck`.
- [x] Verify live in Chrome DevTools MCP.
