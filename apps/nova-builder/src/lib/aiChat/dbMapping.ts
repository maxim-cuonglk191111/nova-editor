// Chat messages as rows of `ai_messages` (migration 0024) and back. Pure and shared: the routes
// use it to write and read, the tests use it to prove the round trip. Reading is defensive: rows
// written before the migration (the plain log of POST /api/ai) have kind 'text' and nothing else.
import { UUID, newId } from "./ids";
import type { AssistantMessage, ChatContextRef, ChatMessage, ChatThread, Proposal, ProposalStatus } from "./types";

export const MAX_THREAD_MESSAGES = 200;

export type MessageRow = {
  id: string;
  conversation_id: string;
  project_id: string;
  user_id: string;
  role: "user" | "assistant";
  content: string;
  provider: string | null;
  kind: "text" | "proposal" | "error";
  context: ChatContextRef | null;
  proposal: Proposal | null;
  status: ProposalStatus | null;
  snapshot_id: string | null;
  duration_ms: number | null;
  meta: Record<string, unknown> | null;
  created_at: string;
};

export type ConversationRow = { id: string; project_id: string; user_id: string; title: string; created_at: string; updated_at: string };

export type RowOwner = { conversationId: string; projectId: string; userId: string };

/** Anything that is not a UUID gets a new one (threads kept in the browser before the database had them). */
export function withUuidIds(thread: ChatThread): ChatThread {
  const remap = new Map<string, string>();
  const fix = (id: string) => (UUID.test(id) ? id : remap.get(id) ?? (remap.set(id, newId()), remap.get(id)!));
  return { ...thread, id: fix(thread.id), messages: thread.messages.map((m) => ({ ...m, id: fix(m.id) })) };
}

export function toRow(m: ChatMessage, owner: RowOwner): MessageRow {
  const base = {
    id: m.id, conversation_id: owner.conversationId, project_id: owner.projectId, user_id: owner.userId,
    content: m.text, created_at: new Date(m.at).toISOString(),
  };
  if (m.role === "user") {
    return { ...base, role: "user", provider: null, kind: "text", context: m.ref ?? null, proposal: null, status: null, snapshot_id: null, duration_ms: null, meta: m.generate ? { generate: true } : null };
  }
  const meta: Record<string, unknown> = {};
  if (m.needsAccount) meta.needsAccount = true;
  if (m.result) meta.result = m.result;
  if (m.checks) meta.checks = m.checks;
  return {
    ...base, role: "assistant", provider: m.provider ?? null, kind: m.kind === "reply" ? "text" : m.kind, context: null,
    proposal: m.proposal ?? null, status: m.status ?? null, snapshot_id: m.snapshotId ?? null,
    duration_ms: typeof m.ms === "number" ? Math.round(m.ms) : null, meta: Object.keys(meta).length ? meta : null,
  };
}

export function fromRow(r: Partial<Omit<MessageRow, "role">> & { id: string; role: string; content: string; created_at: string }): ChatMessage | null {
  const at = Date.parse(r.created_at);
  if (!Number.isFinite(at)) return null;
  if (r.role === "user") {
    const meta = (r.meta ?? {}) as { generate?: boolean };
    return { id: r.id, role: "user", at, text: r.content, ...(r.context ? { ref: r.context } : {}), ...(meta.generate ? { generate: true } : {}) };
  }
  if (r.role !== "assistant") return null;
  const meta = (r.meta ?? {}) as Partial<Pick<AssistantMessage, "needsAccount" | "result" | "checks">>;
  const kind = r.kind === "proposal" || r.kind === "error" ? r.kind : "reply";
  return {
    id: r.id, role: "assistant", at, kind, text: r.content,
    ...(r.provider ? { provider: r.provider } : {}),
    ...(typeof r.duration_ms === "number" ? { ms: r.duration_ms } : {}),
    ...(r.proposal && Array.isArray(r.proposal.lines) ? { proposal: r.proposal } : {}),
    ...(r.status ? { status: r.status } : {}),
    ...(r.snapshot_id ? { snapshotId: r.snapshot_id } : {}),
    ...(meta.needsAccount ? { needsAccount: true } : {}),
    ...(meta.result ? { result: meta.result } : {}),
    ...(meta.checks ? { checks: meta.checks } : {}),
  };
}

export function threadFromRows(c: ConversationRow, rows: MessageRow[]): ChatThread {
  const messages = rows
    .map((r) => fromRow(r))
    .filter((m): m is ChatMessage => m !== null)
    .sort((a, b) => a.at - b.at)
    .slice(-MAX_THREAD_MESSAGES);
  return { id: c.id, title: c.title, createdAt: Date.parse(c.created_at) || 0, updatedAt: Date.parse(c.updated_at) || 0, messages };
}
