# Tasks

One line per task. Numbers are never reused. Working principle for every task:
**a feature we keep must be driven end-to-end on production by an automated spec,
screenshotted, reviewed and scored /10; a feature we cannot make work is hidden
(cut), not left half-working.** See `doc/TEST-ROADMAP.md`.

| # | Task | Status |
|---|------|--------|
| [001](001-finish-i18n-conversion.md) | Finish i18n conversion (branch `qa/i18n`) incl. billing UI | Merged #13 (v25.5.0); prod check pending |
| [002](002-sepay-go-live.md) | SePay VietQR go-live: real account, webhook, wallet scans | Blocked (owner input) |
| [003](003-google-pay-lemon-squeezy.md) | Cards / Google Pay / Apple Pay via Lemon Squeezy | Blocked (owner input) |
| [004](004-ship-pending-commits.md) | Merge and verify pending `qa/ai-template` commits | Done |
| [005](005-tier-b-feature-tests.md) | Tier B feature specs (B1–B14): test, screenshot, score or cut | Done — all 14 at >= 8/10 |
| [006](006-cut-tier-c-code.md) | Remove Tier C code that stays hidden | Open |
| [007](007-builder-feature-audit.md) | Builder feature audit: works + ease of use, every feature >= 8/10 | Done — 5 areas, v25.8.0–25.11.0 |
| [008](008-solid-warnings.md) | Resolve the 21 SOLID audit warnings | Open |
| [009](009-post-audit-coverage.md) | Close the gaps after the builder audit: regression, VI UI, outside-builder ease, visitor output, presets + two-level labels, AI chat panel in the left sidebar, AI provider research, process | In progress — batches 1–3, 5, 9 done (v25.12.1–25.16.4) |
| [010](010-demo-product-parity-locks.md) | Demo & Product 100% UI Parity with Capability Gate / Lock System | Closed |
| [011](011-visual-interactive-mcp-verification.md) | Visual & Interactive State Verification via Chrome DevTools MCP | Closed |
| [012](012-pages-slug-autogen-and-routing-validation.md) | Pages Slug Auto-Generation, Route Collision Validation & Inline Edit Fix | Closed |
| [013](013-desktop-canvas-artboard-framing.md) | Desktop Canvas Artboard Framing & Viewport Squeeze Prevention | Closed |
| [014](014-auth-nav-and-deploy-cache-invalidation.md) | Auth Navigation Loop, Deploy Cache Invalidation & Post-Login Return Flow | Closed |
| [015](015-canvas-height-expansion-and-center-zoom.md) | Canvas Artboard Full-Height Expansion, Center Zoom & Canvas Deselect | Closed |
| [016](016-project-thumbnail-auto-capture.md) | Automatic Project Thumbnail Capture & Dashboard Preview Cards | Closed |
| [017](017-topbar-action-state-and-contextual-toolbar.md) | Topbar Action State Management & Contextual Toolbar | Closed |
| [018](018-inspector-numeric-bounds-and-dialog-contrast.md) | Inspector Numeric Bounds Clamping, Decimal Formatting & High-Contrast Dialog Buttons | Closed |
| [019](019-empty-text-placeholder-and-export-cleaner.md) | Empty Text Element Canvas Placeholder & Clean HTML Export | Closed |
| [020](020-landing-rebranding-and-vietnamese-font.md) | Landing Page Rebranding & Vietnamese Typography Refresh | Closed (hero imagery still missing: see 028) |
| [021](021-interactive-draggable-image-crop.md) | Interactive Draggable Image Crop Area | Closed |
| [022](022-pages-panel-inline-form-and-path-editing.md) | Pages Panel UX: Inline Form Placement, Blur Validation & Dual Inline Edit (Name + Path) | Closed |
| [023](023-canvas-drag-reparent-smoothness-and-snapping.md) | Canvas Drag & Drop Reparenting Target Snapping & Smooth Nesting | Closed |
| [024](024-multi-page-generation-and-prompt-structure.md) | Multi-Page Website Generation & Page Structure from Prompt | Closed (AI output unverified) |
| [025](025-pre-generate-auth-guard-and-instruction-sync.md) | Pre-Generate Auth Guard & Dialog Instruction Sync | Closed |
| [026](026-builder-error-boundary-and-crash-protection.md) | Builder Error Boundary & React Void-Element Crash (#137) | Closed (not reproduced live) |
| [027](027-vietqr-real-payment-info-configuration.md) | VietQR Real Payment Account Configuration | Open |
| [028](028-business-landing-renovation.md) | Business Landing Page Renovation & Dead-Link Removal | Closed |
