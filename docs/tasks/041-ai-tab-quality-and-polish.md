# Task 041 — AI tab: answer quality, reliability and polish backlog

- **Status:** Open
- **Filed:** 2026-11-02
- **Owner:** Claude Code
- **Severity:** Medium (nothing here blocks use; each item is something seen while testing task 037)
- **Follows:** task 037; evidence in task 039

## What testing showed
Production, real providers (Groq answered every edit): an edit, a section-wide restyle and a new section each came back in 9–21 s and applied correctly; whole-page generation succeeded in ~2 minutes once and answered `502 "temporarily unavailable"` after 132 s once, when the free quota was busy (Retry works). The items below are what is left.

## Items, in order of value
1. ~~**"Applied" stays after an undo.**~~ **Done 2026-11-02:** Apply keeps a few small checks (`lib/aiChat/appliedChecks.ts`: text, style, prop, gone, present); the card re-reads the document and says "Undone. Press Ctrl+Shift+Z to redo." when none holds, "Applied" again after a redo, and the state survives a reload because it is derived from the page. Tests: `ai-chat-applied.test.ts` (5) and the edit flow in `ai-panel-flows.spec.ts`.
2. **Route tests for `POST /api/ai/chat`** (done in this task's first commit): gate denials pass through, credits are charged once and only after a valid answer (ADR-NB-005), nothing is charged on failure, at most two new sections are composed per message.
3. **Quality set for the edit agent.** 12 requests × 3 scopes × English and Vietnamese (rewrite, shorten, translate, restyle, add / remove / redo a section, a question). Record: share of answers with at least one valid operation, share of dropped operations, seconds, provider. Tune `prompts/edit.prompt.ts` against it, store the table in `doc/AI-PROVIDERS.md`. Acceptance: ≥ 90% usable answers on Groq with the default chain; every failure mode named.
4. **Whole-page generation reliability.** `/api/ai` can run past 100 s on the free providers (Cloudflare's edge may cut it) and ends in one 502. Options to measure and pick from: per-provider timeout (≈ 40 s) before falling through, racing two providers, a clearer progress line ("trying the next model…"), keeping the partial page when the JSON is cut. Acceptance: P90 under 90 s on the free chain and no silent hang.
5. ~~**Plain labels for the new-section line.**~~ **Done 2026-11-02:** the full brief is the line's tooltip (new and replaced sections); the line itself stays short.
6. **Top-bar button name.** It still reads "✦ Generate" although it opens the AI tab; rename to "✦ AI" (en) / "✦ AI" (vi) and update `top-bar.spec.ts`, `ai-panel.spec.ts`, the coach mark. Owner's call on the wording.
7. **Multi-select context** (design §12.5 listed it as later) and **streaming of the reply text** (design §9).
8. **Dedupe the credit gate.** `POST /api/ai` still has the auth / credit / rate-limit steps inline; move it onto `lib/aiGate.ts` (shared with the chat route) once item 2's tests exist.
9. **Dark theme and narrow top bar** are covered by task 038 (the new look), not here.

## Acceptance criteria
Per item above; the whole task closes when items 3–4 are done and 6–8 are decided or filed (items 1, 2 and 5 are done).
