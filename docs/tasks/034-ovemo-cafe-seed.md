# Task 034 — Ovemo (Over The Moon) café account and site, with the shop's own photos

- **Status:** Closed
- **Filed:** 2026-10-27
- **Owner:** Claude Code

## Request
Second brand: Ovemo, a coffee and tea shop at 03 Ngô Đức Đệ, Quy Nhơn Nam, Gia Lai. Inputs: menu image (M/L prices), three cup photos, logo, slogan, two phone numbers. Same rules as VyVy: natural Vietnamese, hand-made look.

## What was done
- Seed gained a per-site asset path: `DemoSite.assets` lists files in `scripts/seed-assets/<slug>/`; `seed-demo.mjs --apply` uploads them to the Supabase `assets` bucket (the one the editor's own uploads use) as `seed/<slug>/<file>`, before writing any project. `tree(ctx)` gets the bucket's public base, so the page points at real uploaded files. Dry run fails if a declared file is missing.
- Site `ovemo` (`demo.ovemo@nova-demo.test`): cobalt blue from the logo, checkerboard strips, black cats built from boxes, lower-case serif headings with a full stop like "ovemo.". Hero is the slogan, then the full menu in five cards (phê phin, trà sữa, matcha, cacao, trà trái cây), toppings at 5K, visit block with hours, both phones (tel links) and the logo.
- Menu transcribed from the image, keeping the shop's own spellings (Olong, Yuzuuu, Phê, Bạc xỉu). One-size items (Lục trà sữa xoài, Sơn trà ba tiêu) show "L 30K".
- Test: own assets must be declared and exist on disk; every image is either Commons or the site's own uploaded asset.

## Not reproduced, ask the owner
- The small black cat next to some drinks on the menu: its meaning is not in the brief (signature? best seller?), so no drink is marked.
- Photos are not captioned with drink names: the brief does not say which drink is in which cup.
- The menu image shows "Bưởi Yuzuuu" and "Phê/Bạc xỉu" spellings; kept as written. The slogan's comma was kept, split over two lines (h1 + line below).
- No social links in the brief.

## Verified
38 seed tests; typecheck and eslint clean; live preview captured at 1440px and 390px: no horizontal overflow, no broken images, diacritics correct, prices aligned on mobile after making menu rows non-wrapping.
