# Task 040 — AI chat history in the database, with restore points

- **Status:** Open — blocked on the owner's go-ahead for a migration on the production database
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

## Decision needed from the owner
Run the migration on the production Supabase project (`nhpm…`)? Storage cost is small (a few KB per message); proposals are stored without their payload once decided.
