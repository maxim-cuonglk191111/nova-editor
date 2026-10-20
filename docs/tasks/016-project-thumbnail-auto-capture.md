# Task 016 — Automatic Project Thumbnail Capture & Dashboard Preview Cards

- **Status:** Open
- **Filed:** 2026-10-20
- **Owner:** Antigravity / Claude Code
- **Severity:** Medium (UX Polish & Dashboard Usability: Project cards show generic static purple SVG icons instead of actual project previews)

---

## 1. Problem & Root Cause

1. **Missing Project Thumbnails on Dashboard (User Request):**
   - **Symptom:** On `/projects`, all site cards display an identical placeholder purple gradient box with a static wireframe SVG (`SiteCard.tsx` lines 55–61). Users with multiple projects cannot tell their sites apart visually.
   - **Root Cause:**
     - In `SaveProjectDialog.tsx`, thumbnail is exposed as a manual text input (`Thumbnail URL (Optional)`), which users never fill.
     - When saving (`TopbarActions.tsx` and `handleSave`), there is no automated canvas capture mechanism to generate a lightweight preview image (WebP or compressed JPEG data URL/storage URL).
     - `SiteCard.tsx` prop `site: Site` does not consume `thumbnail`, even if stored in the database.
   - **Fix:**
     - Implement client-side canvas preview snapshotting: In `TopbarActions.tsx`, before saving/updating a project, capture the canvas iframe using `html2canvas` or SVG foreignObject snapshotting (or render first section/heading text as an SVG card if raster capture is restricted).
     - Save the generated thumbnail URL / data URL into `projects.thumbnail` column.
     - Update `SiteCard.tsx` and `type Site`: Render `site.thumbnail` image with graceful fallback to styled gradient when null.
     - Remove obsolete manual text input in `SaveProjectDialog.tsx`, replacing it with an auto-updating live thumbnail preview card.

---

## 2. Solution Checklist

- [ ] Update `SiteCard.tsx`: Support `thumbnail?: string | null` and render real preview image.
- [ ] Add automated canvas thumbnail generation in `TopbarActions.tsx` on save.
- [ ] Update `SaveProjectDialog.tsx`: Display auto-captured preview thumbnail instead of manual URL text input.
- [ ] Update project save/patch payload to persist thumbnail.
- [ ] Run `node scripts/i18n-audit.mjs --max=0`.
- [ ] Run `pnpm --filter @nova/builder typecheck`.
- [ ] Verify live in Chrome DevTools MCP.
