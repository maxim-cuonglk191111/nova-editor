# Task 037 — AI as a chat tab in the left sidebar (finishes task 009, item 6)

- **Status:** Closed locally (production run with a real provider and account pending the deploy)
- **Filed:** 2026-11-02
- **Owner:** Claude Code
- **Severity:** Major

## Request
This is the work record for **task 009 item 6** (the umbrella task keeps the list; this file holds the plan, deviations and acceptance for the build).

Today AI is a popup with one "Generate" button that replaces the page. After a page exists the owner cannot tell how to ask AI to change it. Task 009 item 6 asked for an **AI tab in the left rail that works like the assistants in Antigravity, Claude and Codex**: a conversation, with context chips, proposals the owner applies or discards, a model picker and history. The design is in `doc/AI-PANEL.md` (drafted 2026-10-08, decisions pending). The owner asked on 2026-11-02 to finish it; the draft's proposed answers are taken as approved (see Decisions).

## Decisions taken (the draft's proposals)
1. One thread list per project and user. 2. One credit per message, charged after a valid answer (ADR-NB-005). 3. The popup goes away; the top-bar ✦ button, the ⌘⇧A command and the landing-page prompt open the tab. 4. A restore point before every Apply. 5. v1 scope: one selected element or section.

## Deviations from the draft, on purpose
- **Thread storage is the browser (versioned `localStorage` key per project) in v1**, behind a small storage interface; the database tables `ai_conversations` / `ai_messages` keep receiving the server-side log as today. Reason: the persisted-shape rule says the migration lands before the code that reads it, and a migration on the production database needs the owner's go-ahead; the interface lets the database implementation replace it without touching the UI. Cost: history does not follow the account across devices yet.
- **Restore point = one undo step (Ctrl+Z)** in v1, because Apply is a single `updateData` transaction. A version-history snapshot linked to the message needs the same migration and comes with it.
- **New sections are built by a second AI call** from a short brief the edit agent writes, using the existing composer (curated images, vetted vocabulary), instead of putting the whole component vocabulary into the edit prompt (free tiers allow ~8k tokens/minute).

## Plan (modules as in the draft, SOLID)
- `packages/ai`: `utils/validateOps.ts` (shapes, id and CSS/link checks), `prompts/edit.prompt.ts`, `agents/editAgent.ts` (`editWithFallback`), `utils/extractJson.ts` shared with the composer.
- `app/api/ai/chat` (auth, credits, rate limit like `/api/ai`; edit call; optional section composition), `/api/ai/providers?light=1` for the model picker. `POST /api/ai` stays for whole-page generation.
- `lib/aiChat`: types, thread store, `context.ts` (selection → compact subtree), `applyOps.ts` (ops → one `updateData` transaction), `useAIChat` (send / stop / retry / apply / discard, whole-page and multi-page generation from task 024).
- `builder/ai-chat`: panel shell, thread header, message list, proposal card, composer, context chips, model picker, starter prompts. i18n en + vi.
- Left sidebar gets the **AI** tab (first in the rail); `$aiPanelOpen` now means "the AI tab is the active tab".

## Acceptance criteria
- Empty page: the first message generates a page (single or multi-page as today) and shows Apply / Discard; Apply is one undo step.
- Page exists, element/section selected: "make this shorter", "use warmer colours", "translate to Vietnamese", "add a pricing section below", "remove this section" produce a proposal card listing the changes in plain words; hovering a line outlines the element on the canvas; Apply = one undo step with "Ctrl+Z to undo"; Discard changes nothing.
- Context chips follow the canvas selection and can be removed; model picker lists configured providers (Auto default) and greys out the rest with a reason; each answer shows the model and time.
- Stop aborts; Retry re-sends; a quota hit reads "AI is busy — try again in a minute"; a reload keeps the thread and a pending proposal; the draft survives closing the panel.
- Nothing breaks: ADR-NB-005 (no credit on invalid or failed answers), ADR-NB-022 (no `isDemo` branching: a guest gets the same 401 message as before), `/api/ai`, AI Content Fill, a11y and i18n audits, existing e2e specs.
- Unit tests for `validateEditReply`, `applyOps`, context building, thread store; e2e `builder-audit/ai-panel.spec.ts` with the chat route answered by the test (no AI quota), plus one manual run on a real provider.

## Not in this task
Multi-select context, streaming of the explanation text, database-backed threads and snapshot links (follow-up with the migration), paid providers.
