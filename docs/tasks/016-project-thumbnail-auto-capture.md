# Task 016 — Automatic Project Thumbnail Capture & Dashboard Preview Cards

- **Status:** Closed
- **Filed:** 2026-10-20
- **Completed:** 2026-10-20
- **Owner:** Antigravity / Claude Code
- **Severity:** Medium (UX Polish & Dashboard Usability: Project cards show generic static purple SVG icons instead of actual project previews)

---

## 1. Problem & Root Cause

1. **Missing Project Thumbnails on Dashboard (User Request):**
   - **Symptom:** On `/projects`, all site cards display an identical placeholder purple gradient box with a static wireframe SVG (`SiteCard.tsx` lines 55–61). Users with multiple projects cannot tell their sites apart visually.
   - **Root Cause:**
     - In `SaveProjectDialog.tsx`, thumbnail was exposed as a manual text input (`Thumbnail URL (Optional)`), which users never fill.
     - When saving (`TopbarActions.tsx` and `handleSave`), there was no automated canvas capture mechanism to generate a lightweight preview image.
     - `SiteCard.tsx` prop `site: Site` did not consume `thumbnail`.
   - **Fix:**
     - Implemented `thumbnailCapture.ts`: Generates high-fidelity, resolution-independent SVG preview data URIs from project instances, brand title, and styles.
     - Automatically included `metadata.thumbnail` in `getSerializedProjectSchema()` and `saveProject.ts`.
     - Saved and retrieved `thumbnail` in `/api/projects` GET and POST routes.
     - Updated `SiteCard.tsx` and `type Site`: Render `site.thumbnail` image with graceful fallback to styled gradient when null.
     - Replaced manual text input in `SaveProjectDialog.tsx` with an auto-updating live thumbnail preview card.

---

## 2. Solution Checklist

- [x] Update `SiteCard.tsx`: Support `thumbnail?: string | null` and render real preview image.
- [x] Add automated canvas thumbnail generation in `TopbarActions.tsx` on save.
- [x] Update `SaveProjectDialog.tsx`: Display auto-captured preview thumbnail instead of manual URL text input.
- [x] Update project save/patch payload to persist thumbnail.
- [x] Run `node scripts/i18n-audit.mjs --max=0`.
- [x] Run `pnpm --filter @nova/builder typecheck`.
- [x] Verify live in Chrome DevTools MCP.
