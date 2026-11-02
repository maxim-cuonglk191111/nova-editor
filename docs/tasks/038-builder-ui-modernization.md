# Task 038 — Builder UI modernization (reference: Siteai), adapted to Nova's content and flow

- **Status:** In progress — P0–P3 built on branch `feat/ui-modernization`, waiting for the owner's sign-off on the P2/P3 screenshots before P4–P6
- **Filed:** 2026-11-02
- **Owner:** Claude Code
- **Severity:** Major (touches every panel of the builder; must not change behaviour)
- **Depends on:** task 037 (AI tab) lands first, because the AI tab is a new left-rail panel the new look must include.

## Request
The reviewers want the builder to look like the reference screenshot (Siteai, `images/4.png` of the session of 2026-11-02): "much more modern". The owner agrees. Requirements from the owner: adapt it to **our** content and flow, and **do not break anything**. Read `CLAUDE.md` and the screenshot first.

## What the reference does (read from the screenshot)
| Area | Reference | Nova today |
|---|---|---|
| Top bar | Project name with a caret, a **centred segmented switch** (Sitemap / Wireframe / Website), a few round icon buttons (comment, share, play, settings), one dark-green **Publish** button | Dense bar: breakpoints, zoom, export, tools menu, ✦ Generate, save, many small buttons |
| Left | A narrow **search box**, then **grouped lists** (Basics: Pages, Sections, Navigations; CMS; Elements: Media, Forms, Icons, Interactive, Social, Utility) as full-width rows with an icon tile, a label and a chevron; picking one opens a **second column with large preview thumbnails** | Icon rail with 5 tabs; the panel is a list or tree |
| Canvas | Light grey stage, the page as a card with a soft shadow, a **floating pill toolbar** at the bottom (AI wand, add, zoom in/out, Upgrade plan) | Canvas with zoom controls in the top bar |
| Right | **Collapsible groups** (Link, Position, Size, Layout, Effects, Overlays, Cursor, Styles, Transition, Fill) with a `+` or `–`; choices as **segmented pills** (Stack / Grid, Wrap Yes / No, direction arrows); alignment icons on top | Style inspector with many row editors (already grouped, denser, mostly dark) |
| Look | White surfaces, 12–16px radii, hairline borders, large type for labels, generous spacing, one accent colour, soft shadows | Dark theme, 1px borders, small type (12–13px), purple accent |

## Principles for adapting it (not copying it)
1. **Same features, same order of work.** Nothing is removed, renamed or moved to another place in the flow. A Playwright journey that worked before works after, with the same clicks.
2. **Tokens first.** Every colour, radius, spacing and shadow comes from `lib/uiTheme.ts` (`UI_VARS`). The new look is a new token set plus layout changes in shell components; panels that already use tokens change for free. No hard-coded colours added.
3. **Light and dark both** (the reference is light; Nova supports both): the new look is designed light-first, dark must stay readable and pass the same contrast checks.
4. **ADR-NB-022** (no `isDemo` JSX branching) and **ADR-NB-001/003** untouched. The `/canvas` iframe route and its sync are not modified.
5. **Elder-first and a11y gates stay**: touch targets ≥ 44px for primary actions, body text ≥ 14px in panels, contrast AA, keyboard focus visible, `aria-*` kept.
6. **Our content, not Siteai's**: the left groups are Nova's own (Add / Pages / Layers / Assets / Templates / **AI**), the top switch is Nova's own (see below), the right groups are the existing style groups.

## Scope, in order (each step ships alone and is verified before the next)
1. **P0 — Baseline.** Screenshots of every builder surface today (top bar, each left tab, canvas, each inspector group, the dialogs) at 1440 and 1024 wide, light and dark; list of selectors the e2e specs use so they can be kept. Stored in `doc/screenshots/.temp/ui-baseline/`.
2. **P1 — Tokens.** New `UI_VARS` values (surfaces, borders, radii, shadows, type scale, one accent), light default. Check: every existing screen still readable in both themes.
3. **P2 — Shell and top bar.** Project name + caret; centred segmented switch for the **work modes Nova really has** (Design / Preview, and Code if it exists; nothing invented like "Wireframe"); breakpoints as a compact pill group; secondary actions into a menu; one primary **Publish/Export** button; the ✦ Generate button becomes the AI tab (task 037).
4. **P3 — Left rail and panels.** Search box on top; grouped rows with icon tiles and chevrons for **Add** (components), larger preview thumbnails in a second column for Templates and Sections; Pages / Layers / Assets keep their trees with the new row style. AI tab = chat (task 037).
5. **P4 — Canvas.** Soft stage and page card; a floating pill toolbar at the bottom (AI, add, zoom −/+, fit) taking over the zoom controls (the old ones stay until the floating one passes the e2e specs).
6. **P5 — Inspector.** Segmented pills for binary and small enum choices (Stack/Grid, Wrap yes/no, direction, text align), collapsible groups with `+`/`–`, alignment bar at the top, same values written to the same atoms.
7. **P6 — Pass over dialogs, menus, empty states, toasts** so no old-looking island remains; then the visual audit (Tier 3) across all surfaces.

## Non-regression plan
- Before P1: run and record the green baseline: `pnpm test`, `pnpm --filter @nova/builder typecheck lint`, `pnpm solid:audit`, and the Playwright specs `editor`, `demo-parity`, `canvas-styles`, `builder-canvas-sync`, `a11y`, `i18n`, `builder-audit/*`, `tier-b/*`, `golden-path` (those that were green on 2026-11-02; the known unrelated reds — `feature-smoke` hang, `canvas-selection` on live data — stay as they are).
- Each step: the same set must stay green; selectors that change get updated in the same commit with a note why.
- Visual: Tier 1 capture of the changed surface per step; Tier 3 audit at the end (all surfaces, 1440 / 1024 / 390 where the builder supports it).
- No change to persisted shapes (the look is not stored). If a preference is stored (e.g. theme), it is read defensively.

## Out of scope
New features from the reference (sitemap/wireframe stages, CMS, overlays, cursor styles), a new component library, marketing pages, the `/canvas` content styling (what the visitor sees is not changed by a builder skin).

## Acceptance criteria
- Owner signs off the design (screenshots of P2 and P3 before the rest is built).
- All baseline specs still pass; the new look has no hard-coded colours (grep gate).
- Light and dark both pass the a11y spec; touch targets and text size rules hold.
- Self-score ≥ 9/10 on the rubric with the Tier 3 audit attached to `doc/VERIFIED.md`.

## Owner decisions (2026-11-02)
1. Light by default (it already is: `$builderTheme` starts as "light"; there is no theme switch in the builder today, so "dark kept" means the DARK/ELDER palettes stay in `uiTheme.ts`). 2. Centred switch: Design · Preview. 3. The floating toolbar may replace the top-bar zoom once it works.

## Progress
- **P0** `scripts/ui-baseline.mjs` captures the demo builder (1440/1024) into `doc/screenshots/.temp/ui-baseline/` (before) and `ui-p3/` (after).
- **P1** `lib/uiTheme.ts`: `primary`/`primaryHover`/`onPrimary`, `shadowSoft`/`shadowPop` in all three palettes (+ `UI_VARS`, CSS vars) and `UI_SHAPE` (radii 8/12/16, control 36/44, top bar 56).
- **P2** Top bar 56px on a white surface: back + logo + project name; centred **Design | Preview ↗** switch (Preview still opens the tab, now via `topbar/usePreview.ts`); breakpoints as one pill group; zoom; Export/Tools (one **More** menu below 1280px); **Save** is the single filled primary button (dark green, white text AA); Generate = outline. Width classes `nb-hide-mid` (<1680) and `nb-hide-narrow` (<1280) in `globals.css`. Fixes the clipped Generate button at 1024px. Floating panels moved from top 52 to 64.
- **P3** Rail 68px with a rounded active tile and readable labels (the "TEMPLATES" clip is gone); shared `PanelHeader` for Pages/Layers/Templates, same title style in Add; page rows as rounded cards; default panel width 260.
- **Deviations**: no project-name caret (nothing to open from it yet, so no false affordance); Add keeps its category list with preview cards (it already has search and thumbnails) instead of the Siteai row list; the zoom group is hidden below 1280px until the floating toolbar (P4) takes over.
- **Selector note**: the breakpoint ⚙ keeps its accessible name; `builder-canvas-sync.spec.ts` looked for `input[type=number]`, which task 018 turned into text inputs, so the spec was already red; it now uses `input[inputmode=decimal]`.

## Open questions for the owner (answered above)
1. Light as the default theme (as the reference) with dark kept, or dark stays the default?
2. The centred switch: which modes should it show? (Proposed: Design · Preview.)
3. Is the bottom floating toolbar allowed to replace the zoom controls in the top bar once it works?
