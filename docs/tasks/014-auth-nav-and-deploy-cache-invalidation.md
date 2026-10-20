# Task 014 — Auth Navigation Loop, Deploy Cache Invalidation & Post-Login Return Flow

- **Status:** Closed
- **Filed:** 2026-10-20
- **Owner:** Antigravity / Claude Code
- **Severity:** Critical (Blocks access to projects for logged-in users and causes stale build caching across client machines)

---

## 1. Problem & Root Cause

1. **Stale Cache & Cookie Retention After Deploy:**
   - **Symptom:** After pushing and deploying to production (Cloudflare Workers / OpenNext), users on other machines must clear cookies and browser cache to see the latest changes.
   - **Root Cause:** Next.js static asset and dynamic routes lack explicit deployment-aware cache-control headers. Cloudflare edge cache (`enableCacheInterception: true` in `open-next.config.ts`) and browser HTTP caches serve stale HTML/RSC payloads without revalidation. Session cookies lack deployment invalidation or clear max-age policies.
   - **Fix:** Inject `Cache-Control: private, no-cache, no-store, must-revalidate` for dynamic document/RSC/auth requests; append build-hash or deployment timestamp query parameters to asset bundles; ensure auth session tokens validate freshness against active deployment or clear gracefully on 401.

2. **Auth Loop on Landing Page (`Get Started Free` & `/signup`):**
   - **Symptom:** User has already logged in, but clicking `Get Started Free` on the home page still navigates to `/signup` or `/login`, and user cannot enter their projects from home.
   - **Root Cause:**
     - In `apps/nova-builder/src/app/page.tsx` (lines 88, 144), CTA buttons `<Link href="/signup">` are hardcoded strings, completely ignoring the active user session (`session` from `useSession`).
     - In `apps/nova-builder/src/middleware.ts` (lines 126–131), when an authenticated user visits `/signup` or `/login`, middleware redirects them back to `/`:
       ```typescript
       if (AUTH_PAGES.has(pathname)) {
         const token = await getSessionToken(req);
         if (token) return NextResponse.redirect(new URL("/", getAppUrl(req)));
       }
       ```
     - This creates an inescapable loop: `/` $\rightarrow$ click "Get started free" $\rightarrow$ `/signup` $\rightarrow$ middleware redirects to `/` $\rightarrow$ user never reaches `/projects`!
   - **Fix:**
     - Update `middleware.ts`: Authenticated users visiting `AUTH_PAGES` must redirect to `/projects`, NOT `/`!
     - In `apps/nova-builder/src/app/page.tsx`: If `session` is authenticated, render `href="/projects"` and localized label `{t.nav.projects}` or "Go to Dashboard" on CTAs.
     - In `PublicNav.tsx`: Ensure "Get started free" CTA in mobile menu and desktop navbar points to `/projects` when authenticated.

3. **Demo Save $\rightarrow$ Login Redirect & Post-Login State Return (Report 19/10 Page 4):**
   - **Symptom:** Saving demo project opens login page, but after login (or cancel), user is sent to `/` rather than returning to `/builder/demo` with their draft restored.
   - **Fix:** Pass `callbackUrl=/builder/demo` (or preserve `redirectUrl`). Login and Cancel buttons must return to `callbackUrl`. On return to demo, local draft in `localStorage` is loaded seamlessly.

4. **Topbar Logo Navigation (Report PDF 1 Page 4):**
   - **Symptom:** In builder topbar, clicking the Nova logo does nothing or does not navigate back to `/projects` (or `/`).
   - **Fix:** Wrap topbar logo in a `<Link href={isDemo ? "/" : "/projects"}>` with accessible label and tooltip.

---

## 2. Solution Checklist

- [x] Update `apps/nova-builder/src/middleware.ts`: Redirect authenticated users from `AUTH_PAGES` to `/projects`.
- [x] Add `Cache-Control` header interceptor in `middleware.ts` for dynamic document & API routes (`no-cache, must-revalidate`).
- [x] Update `apps/nova-builder/src/app/page.tsx`: Dynamically toggle CTAs between `/projects` (authenticated) and `/signup` (unauthenticated).
- [x] Update `apps/nova-builder/src/components/public/PublicNav.tsx` and `PublicFooter.tsx`: Ensure authenticated state links to `/projects`.
- [x] Handle `callbackUrl` in login/signup flows so saving in Demo returns to `/builder/demo` with local draft.
- [x] Update Topbar Logo in `apps/nova-builder/src/builder/Topbar.tsx` to link to `/projects` (or `/` in demo).
- [x] Run `node scripts/i18n-audit.mjs --max=0`.
- [x] Run `pnpm --filter @nova/builder typecheck`.
- [x] Verify live in Chrome DevTools MCP.
