# Task 040 — AI chat history in the database, with restore points

- **Status:** Done locally 2026-11-02 (migration 0024 applied to production by the owner's go-ahead); verified on production (worker version e60354a3)
- **Filed:** 2026-11-02
- **Owner:** Claude Code
- **Severity:** Medium
- **Follows:** task 037 (AI chat tab), `doc/AI-PANEL.md` §7

## Symptom
The AI tab keeps its chats in the browser (`localStorage`, key `nova-ai-chat:v1:<projectId>`). Open the same site on another device or another browser, or clear site data, and the history is gone; a team member sees none of it. An applied change can only be undone with Ctrl+Z in the session that applied it: after a reload there is no way back to the page as it was before the AI changed it.

## Root cause
Not a defect: task 037 shipped the conversation first. The persisted-shape rule of `CLAUDE.md` says the migration lands before the code that reads it, and a migration on the production database needs the owner's decision, so v1 stores threads behind the `ChatStorage` interface (`lib/aiChat/store.ts`) with the browser as its only implementation.

## Plan
1. **Migration first** `supabase/migrations/00xx_ai_chat_panel.sql` (idempotent, additive, all new columns nullable or defaulted): on `ai_messages` add `kind text default 'text'`, `context jsonb`, `proposal jsonb`, `status text`, `snapshot_id uuid references project_snapshots`, `model text`, `duration_ms integer`; check how `ai_conversations` / `ai_messages` rows are written today by `POST /api/ai` so the two writers agree. No change to `schema_json`.
2. **Routes**: `GET /api/ai/conversations?projectId=`, `GET|PATCH|DELETE /api/ai/conversations/:id`, `PATCH /api/ai/messages/:id` (status, snapshot). Same auth as the project (owner or team member), RLS unchanged (service role only).
3. **Storage**: `databaseChatStorage` implementing `ChatStorage`; the panel keeps working offline from the browser copy and syncs. One-time import of the existing local threads on first load (never delete the local copy until the import is confirmed).
4. **Restore points**: before Apply, take a version-history snapshot ("Before AI: <title>") and link it to the message; "Restore" on an applied message restores that snapshot (as a new version, like v0).
5. **Read defensively** (`kind ?? 'text'`), bump `STORE_VERSION`, keep the pending-proposal payload size bounded.

## Acceptance criteria
- Open the site on a second browser: the chats and the applied/discarded state are there; a pending proposal is there with its Apply button.
- Apply on one device, "Restore" from the thread on another: the page is back as before the change, and that is itself undoable.
- The migration runs twice without error; old rows without the new columns still render.
- Unit tests for the storage adapter (merge, conflict by `updatedAt`, import), a route test per method, an e2e step in `ai-panel.spec.ts` (reload on a clean browser context).
- `doc/AI-PANEL.md` §7 updated from "planned" to "built"; task 037's "browser storage" deviation closed.

## Decision (owner, 2026-11-02)
"task 40 oke": migration run on production. Storage cost is small (a few KB per message); proposals are stored without their payload once decided.

## What was built
- Migration `0024_ai_chat_panel.sql` (applied twice, idempotent). Columns differ slightly from the plan: `meta jsonb` holds `result` / `checks` / flags, the provider stays in the existing `provider` column (no `model`).
- Routes: `GET /api/ai/conversations?projectId=`, `PUT|DELETE /api/ai/conversations/:id`. One whole thread per `PUT` replaced the planned per-message `PATCH` routes: simpler, and last-write-wins by `updatedAt` needs no per-field merge.
- Store: `ChatRemote` (`lib/aiChat/remote.ts`) behind `createChatStore`; load once per project, merge by `updatedAt` (`mergeThreads`), debounced save (1 s), failed saves retry on the next change, local-only threads imported on first load, old non-UUID ids converted.
- Restore points: `lib/snapshots.ts` (`takeSnapshot` flushes queued edits first, `restoreSnapshot` shared with the History panel); Apply saves "Before AI: …" (4 s cap, skipped silently when it cannot be made); "Restore the page from before" on applied cards.
- `POST /api/ai` takes `skipLog` (the chat's own generations are not logged twice).

## Verification
- Unit: `ai-chat-db` (row round trip, ownership 404/403/409, snapshot ids of other projects dropped), `ai-chat-sync` (merge, debounce, import, retry, late answer for another project), `ai-conversations-route` (401/400/413/404/403/409, no internal message leaks). `pnpm test`, `tsc`, lint, i18n audit (0), SOLID audit (0 blocking) pass; 20 local AI-panel e2e specs still pass.
- E2E (`ai-history-live.spec.ts`, throwaway account): Apply saves the chat with status applied and a snapshot id; a second browser context with empty local storage shows the chat and the applied card; Restore (confirm, reload) brings the heading back; DELETE removes it. Passed against the local dev server in 51 s and against the deployed site (worker version `e60354a3`) in 25 s.
