# Task 032 — Seed five demo accounts with finished sites and public preview links

- **Status:** Closed
- **Filed:** 2026-10-27
- **Owner:** Claude Code

## Request
Five accounts, each with a project reachable by a public preview link, compatible with the real app so they can be used in a demo. Treat them as five individual people with different goals (a business, a SaaS, a personal blog…), each site made "as if by a very cool human designer, not by AI".

## What was built
- `src/lib/seed/demoProjects.ts`: five sites written in the AI composer's tree and converted by the app's own `validateCompositionWS`, then merged into a 5.0 project document the way `applyWSComposition` does. Same shape as a generated project.
  - Mai viết: personal blog (paper, serif, tilted post cards, wavy underline)
  - Tabby: one-person SaaS (terminal, lime on black, pricing)
  - Bếp Bà Tư: street-food stall (poster, Impact, hard shadows)
  - Hùng Lê: photographer portfolio (dark, asymmetric grid)
  - Nói nhảm lúc 2 giờ sáng: podcast (indigo and pink, blob, episode cards)
- `scripts/seed-demo.mjs` (`pnpm seed:demo`): dry run by default (builds and validates through `migrateToLatest` + `serializeWebstudioData`, the exact `/api/preview` path); `--apply` writes; `--cleanup --apply` removes the five accounts (projects cascade); `--out dir` exports the preview payloads for offline testing. Idempotent. Passwords are random and written only to `apps/nova-builder/.seed-demo-output.json` (gitignored).
- Accounts use the real signup shape: provider `email`, PBKDF2 hash from `lib/password.ts`, tier `free`, 200 initial credits, `email_verified` true.

## Verified
- 21 unit tests: every site round-trips the preview path, is a valid tree (no cycles, one parent each), has exactly one h1, every nav anchor has a target, only public https images.
- Rendered through the real `/preview` page (data served through a stubbed route) before writing, then again from the live Cloudflare host after writing.
- Logged into the live Cloudflare site with a seeded account: `/projects` lists the project.
- Found by checking: the Vercel alias `nova-editor-chi.vercel.app` serves a **different database** (preview of a seeded id returns 404) while `nova-editor.maximi.workers.dev` reads the seeded one. Treat the Cloudflare URL as production.

## Caught on the way
- Georgia has no Vietnamese glyphs (ế, ắ, ố render as a letter plus a stray accent). The serif stack is now Palatino Linotype / Palatino / Book Antiqua / Times New Roman. Impact and Consolas were fine.

## Open
- Photos are the composer's curated Unsplash list; "Plated food" stands in for a bowl of bún riêu. Replace with real photos when the owners have them.
- The accounts exist in whichever database `SUPABASE_URL` pointed at (host `nhpm…supabase.co`). Remove with `node scripts/seed-demo.mjs --cleanup --apply`.
