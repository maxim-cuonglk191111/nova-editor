# AI panel — chat assistant in the left sidebar (design, task 009 batch 6)

Status: **draft for the owner's review — no code until approved.** Date: 2026-10-08.

## 1. Problem

Today AI is a one-shot popup: "Generate → Replace this page". Once a page exists the owner cannot
tell how to ask AI to change it (batch 2 added a hint and a section-scoped AI Content Fill, but that
only rewrites text). Every AI tool we compared works as a **conversation next to the canvas**: you
point at something, say what you want, see what will change, and accept or reject it.

## 2. What we studied, what we copy, what we skip

| Product | What it does well | Copy | Skip (for now) |
|---|---|---|---|
| Lovable | "Select elements" (click one or more on the preview) attaches them to the chat message as references; the prompt applies only to them | Selection → context chips, multi-select later | Comments/annotations on the preview |
| v0 | Versions per prompt; pick a version in the chat and "Restore" creates a new version; Design mode edits without AI tokens | Each applied change linked to a restore point; "Restore" from the thread | Separate design mode (our builder already is one) |
| Antigravity | Agent proposes a diff; Accept / Reject per change; artifacts (plan, diff) you can comment on | Proposal card with a short change list + Apply / Discard | Parallel agents, plan artifacts with comments |
| Claude / ChatGPT / Codex | Thread list with titles, model picker, Stop / Retry, example prompts in the empty state | Thread history, model picker with plain names, Stop / Retry, starter prompts | Token streaming (see §9), file uploads |
| Cursor | `@` context chips, Apply per change, inline diff | Context chips shown above the input, removable | `@` typing syntax (chips are automatic + removable instead) |
| Webstudio AI | Prompt → operations applied to the tree | Operations JSON validated against the tree, applied as one transaction | — |

Sources: [Lovable — edit from the preview](https://docs.lovable.dev/features/preview-toolbar),
[Lovable — Visual Edits](https://lovable.dev/blog/introducing-visual-edits),
[v0 — Design mode](https://v0.app/docs/design-mode),
[Antigravity — accept/reject](https://discuss.ai.google.dev/t/purpose-of-accept-reject-in-editor-view/121145),
[Antigravity — reviewing artifacts](https://antigravity.google/docs/cli/artifacts/). Checked 2026-10-08.

## 3. Layout (left rail tab "AI", first in the rail)

```
┌ rail ┐┌──────────── AI panel (resizable, same as other tabs) ─────────────┐
│ ✦ AI ││ Make the menu warmer          ▾  (thread title → history)   ＋ New │
│ ⊞ Add││───────────────────────────────────────────────────────────────────│
│ ☰ Pg ││  You · 10:42                                                      │
│ ◫ Lay││  Make this section shorter and warmer                             │
│ ⊡ Ast││                                                                   │
│ ◈ Tpl││  ✦ Nova · Groq Llama 3.3 70B · 14 s                               │
│      ││  I shortened 6 texts in “Menu Section” and warmed up the tone.    │
│      ││  ┌ Proposed changes ──────────────────────────────────────────┐   │
│      ││  │ ✎ Rewrite 6 texts         (highlighted on the canvas)       │   │
│      ││  │ 🎨 Background → warm beige                                  │   │
│      ││  │ [ Discard ]                              [ Apply ✓ ]       │   │
│      ││  └────────────────────────────────────────────────────────────┘   │
│      ││  ✓ Applied — Ctrl+Z to undo · Restore point saved                 │
│      ││───────────────────────────────────────────────────────────────────│
│      ││ [● Menu Section ×] [Page: Home ×]                (context chips)   │
│      ││ ┌───────────────────────────────────────────────────────────────┐ │
│      ││ │ Ask AI to change this section…                                 │ │
│      ││ └───────────────────────────────────────────────────────────────┘ │
│      ││ Model: Auto ▾ (fast, free — may be busy)         [■ Stop] [Send ↵] │
└──────┘└───────────────────────────────────────────────────────────────────┘
```

- The top-bar **✦ Generate** button opens this tab (the popup goes away).
- **Empty state**: one line on what it can do + 4 starter prompts that depend on the context:
  - element selected: "Rewrite this text", "Make it bigger and bolder", "Replace this image", "Translate to Vietnamese"
  - section: "Make this section shorter", "Use warmer colours", "Add a pricing section below", "Remove this section"
  - page / nothing selected: "Translate the page to Vietnamese", "Add testimonials", "Make it look more premium", "Start over with a new page"
  - empty page: the current "Describe your page" generator (whole page).

## 4. Context chips

Set automatically from the canvas selection and shown above the input; each has ×.

| Selection | Chips | AI may change |
|---|---|---|
| an element | `● Main Heading (Tiêu đề)` + `Section: Hero` | the element; the section only if asked |
| a section | `● Menu Section` | that section; add/remove sections next to it |
| nothing | `Page: Home` | the whole page |
| chip removed | falls back to the next wider scope; "Whole site" (all pages) is offered as an extra chip | — |

Plain label + the technical type as a hint (two-level labels, batch 5).

## 5. What AI can do (v1 operations)

The edit agent returns **operations**, never a whole new page, validated against the instance ids
inside the context before anything is shown:

| Operation | Example request |
|---|---|
| `setText {id, text}` | rewrite, shorten, translate |
| `setStyle {id, property, value}` | "warmer colours", "bigger headline" |
| `setProp {id, name, value}` | link URL, image `src` (curated list), alt text, heading level |
| `insertSection {after, tree}` | "add a pricing section below" (tree = same format as the page composer) |
| `replaceSection {id, tree}` | "redo this section as 3 cards" |
| `removeSection {id}` / `move {id, after}` | "remove", "move testimonials above the menu" |
| `newPage {tree}` | "start over" — always asks for confirmation first |

Rules: one Apply = one `updateData` transaction = **one undo step**; the proposal card lists the
operations in plain words; affected elements are outlined on the canvas while the card is pending;
Discard changes nothing. Before Apply a version-history snapshot ("Before AI: <title>") is saved
and linked to the message, so "Restore" works later from the thread.

## 6. Model picker

`Auto` (default) = the current fallback chain. Then each **configured** provider, free ones first,
each with a plain description and the model id as the muted hint:

| Shown as | Hint | State today (2026-10-08) |
|---|---|---|
| Auto — tries the free models in turn | groq → mistral → google → openrouter | ✅ |
| Fast · free, may be busy | `groq/openai/gpt-oss-120b` | ✅ |
| Long pages · free, may be busy | `groq/llama-3.3-70b-versatile` | ✅ |
| Mistral · free, often busy | `mistral-medium-latest` | greyed: "busy (429)" when the last call failed |
| Gemini · free | `gemini-flash-latest` | greyed: "not available in our server region" |
| OpenRouter · prepaid | `google/gemini-2.5-flash` | greyed: "no credit" — no paid provider is enabled by this task |

Availability comes from a cheap `/api/ai/providers` (key configured + last error seen by this
Worker, no extra AI call). Each reply shows the model that answered and the time it took.

## 7. Data model (persisted shape — migration first)

Per **project and user** (a thread belongs to the site it edits; the existing tables already work
this way). Existing: `ai_conversations(id, project_id, user_id, title, created_at, updated_at)`,
`ai_messages(id, conversation_id, project_id, user_id, role, content, provider, credits_used, created_at)`.

Migration `00xx_ai_chat_panel.sql` adds to `ai_messages` (all nullable, read with defaults):

| Column | Type | Meaning |
|---|---|---|
| `kind` | text default 'text' | 'text' · 'proposal' · 'error' |
| `context` | jsonb | scope + instance ids + page id the message was about |
| `proposal` | jsonb | `{ summary: string[], ops: Op[] }` |
| `status` | text | 'pending' · 'applied' · 'discarded' |
| `snapshot_id` | uuid → project_snapshots | restore point taken before Apply |
| `model` | text | model id that answered |
| `duration_ms` | integer | for "answered in 14 s" |

No change to `schema_json`. The migration lands before the code that reads it; readers default
missing fields (`kind ?? 'text'`).

## 8. API

| Route | Purpose |
|---|---|
| `POST /api/ai/chat` | `{ projectId, conversationId?, message, context, model }` → `{ conversationId, message }` (assistant message with text and optional proposal). One AI call per message. |
| `GET /api/ai/conversations?projectId=` | thread list (title, updated_at) |
| `GET/PATCH/DELETE /api/ai/conversations/:id` | messages · rename · delete |
| `PATCH /api/ai/messages/:id` | `{ status, snapshotId }` after Apply / Discard |
| `GET /api/ai/providers` | model picker state |

`POST /api/ai` (one-shot page generation, used by the dashboard "Build with AI") stays as it is.
Credits: same rule as today (charged only after a valid answer, ADR-NB-005).

## 9. Feedback and safety

- Progress instead of token streaming in v1: "Reading the section… / Writing changes… · 12 s"
  (the free providers answer in 5–30 s and the answer is JSON operations, not prose). Streaming
  of the explanation text can come later.
- **Stop** aborts the request; **Retry** re-sends the last message; a quota hit reads
  "AI is busy (free quota) — try again in a minute" with Retry.
- Nothing is lost on reload: messages are stored; a pending proposal is restored with its card;
  the unsent draft is kept in localStorage.
- Context sent to the model is compact (component, label, text, a few key styles of the scoped
  subtree) so a request fits the free tiers (Groq 8–12k tokens per minute).

## 10. Modules (SOLID)

```
builder/ai-chat/AIChatPanel.tsx      panel shell (tab content)
builder/ai-chat/ThreadHeader.tsx     title, history menu, new chat
builder/ai-chat/MessageList.tsx      messages + ProposalCard
builder/ai-chat/ProposalCard.tsx     change list, Apply / Discard, applied state
builder/ai-chat/Composer.tsx         context chips, input, model picker, Send / Stop
builder/ai-chat/ContextChips.tsx     selection → chips
builder/ai-chat/ModelPicker.tsx      providers with plain names + hints
lib/aiChat/store.ts                  nanostores: threads, messages, pending, draft
lib/aiChat/context.ts                selection → scope + compact subtree
lib/aiChat/applyOps.ts               ops → one updateData transaction (+ canvas highlight)
app/api/ai/chat|conversations|messages|providers   routes
packages/ai/src/agents/editAgent.ts  + prompts/edit-ws.prompt.ts + utils/validateOps.ts
```

## 11. Flows to test (`e2e/builder-audit/ai-panel.spec.ts`)

New page from an empty project · change a selected section · rewrite one heading · translate the
page · Discard · Apply + Ctrl+Z · switch model · reopen a past thread after reload · restore from a
thread. Works / Ease for both audiences ≥ 8; ≥ 1 minute between AI calls.

## 12. Decisions for the owner

1. **Storage per project and user** (proposed) — threads are not shared between team members.
2. **Cost**: 1 credit per message (same as today's cheapest AI call)?
3. **Remove the popup** once the tab works (the top-bar button opens the tab)? Proposed: yes.
4. **Restore point before every Apply** (one snapshot row each) — proposed: yes, they are small and
   make "undo after reload" possible.
5. v1 scope: one selected element/section (multi-select later) — proposed.
