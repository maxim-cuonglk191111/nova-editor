// Shapes of the AI tab's conversation. Threads are stored per project in the browser (see
// store.ts), so these are persisted shapes: change them together with STORE_VERSION.
import type { EditOp } from "@studio/ai";
import type { WSCompositionResult } from "@studio/ai";
import type { SiteResult } from "@/lib/generateSite";

export type ChatScope = "element" | "section" | "page";

/** What the message was about: shown as chips above the input and stored with the message. */
export type ChatContextRef = {
  scope: ChatScope;
  pageId: string;
  pageName: string;
  targetId?: string;
  targetLabel?: string;
  sectionId?: string;
  sectionLabel?: string;
};

export type ProposalKind = "text" | "style" | "prop" | "remove" | "insert" | "replace" | "page" | "site";

/** One line of a proposal card, in words the owner can read; the card translates `kind`. */
export type ProposalLine = {
  kind: ProposalKind;
  /** How many operations of this kind were merged into the line. */
  count: number;
  /** Name of the element (or the page / the new section's brief). */
  label: string;
  /** Instance ids this line touches: hovering the line outlines them on the canvas. */
  ids: string[];
  detail?: string;
};

/** What Apply does. Dropped once the proposal is applied or discarded (it can be large). */
export type ProposalPayload =
  | { type: "ops"; ops: EditOp[] }
  | { type: "page"; composition: WSCompositionResult }
  | { type: "site"; results: SiteResult[] };

export type Proposal = { lines: ProposalLine[]; payload?: ProposalPayload };

export type ProposalStatus = "pending" | "applied" | "discarded";

export type UserMessage = { id: string; role: "user"; at: number; text: string; ref?: ChatContextRef; /** Asked for a whole new page (start over): Retry repeats that. */ generate?: boolean };

export type AssistantMessage = {
  id: string;
  role: "assistant";
  at: number;
  kind: "reply" | "proposal" | "error";
  text: string;
  /** Which provider answered and how long it took. */
  provider?: string;
  ms?: number;
  proposal?: Proposal;
  status?: ProposalStatus;
  /** For an error: the user has to sign in, or retrying is pointless. */
  needsAccount?: boolean;
  /** Set when the proposal was applied: how many operations went through. */
  result?: { applied: number; skipped: number };
};

export type ChatMessage = UserMessage | AssistantMessage;

export type ChatThread = { id: string; title: string; createdAt: number; updatedAt: number; messages: ChatMessage[] };

export type ChatState = { activeId: string | null; threads: ChatThread[] };
