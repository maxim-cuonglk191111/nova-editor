// Reading and writing the AI tab's threads in `ai_conversations` / `ai_messages`. The routes only
// authenticate and validate; the queries are here, taking the client as an argument so the tests
// can run them against a small in-memory stand-in. Every query is scoped to the signed-in user.
import type { SupabaseClient } from "@supabase/supabase-js";
import { MAX_THREAD_MESSAGES, threadFromRows, toRow, type ConversationRow, type MessageRow } from "@/lib/aiChat/dbMapping";
import { UUID } from "@/lib/aiChat/ids";
import type { ChatMessage, ChatThread } from "@/lib/aiChat/types";

export const MAX_THREADS = 30;
export const MAX_BODY_CHARS = 2_000_000;
const MAX_TEXT = 20_000;
const MAX_TITLE = 120;

export type ThreadInput = { id: string; projectId: string; title: string; createdAt: number; updatedAt: number; messages: ChatMessage[] };

export class ChatDbError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

/** Shape check of what the browser sends; throws a 400 naming the problem. */
export function readThreadInput(id: string, raw: unknown): ThreadInput {
  const bad = (why: string) => new ChatDbError(400, `Invalid thread: ${why}`);
  if (!UUID.test(id)) throw bad("id");
  if (!raw || typeof raw !== "object") throw bad("body");
  const b = raw as Record<string, unknown>;
  if (typeof b.projectId !== "string" || !UUID.test(b.projectId)) throw bad("projectId");
  if (!Array.isArray(b.messages) || b.messages.length > MAX_THREAD_MESSAGES) throw bad("messages");
  const messages: ChatMessage[] = [];
  for (const m of b.messages) {
    const x = m as Partial<ChatMessage> & { text?: unknown };
    if (!x || typeof x.id !== "string" || !UUID.test(x.id) || typeof x.text !== "string" || x.text.length > MAX_TEXT || typeof x.at !== "number") throw bad("message");
    if (x.role !== "user" && !(x.role === "assistant" && (x.kind === "reply" || x.kind === "proposal" || x.kind === "error"))) throw bad("message role");
    messages.push(m as ChatMessage);
  }
  const title = typeof b.title === "string" ? b.title.replace(/\s+/g, " ").trim().slice(0, MAX_TITLE) : "";
  const now = Date.now();
  const stamp = (v: unknown) => (typeof v === "number" && Number.isFinite(v) && v > 0 && v < now + 86_400_000 ? v : now);
  return { id, projectId: b.projectId, title: title || "New chat", createdAt: stamp(b.createdAt), updatedAt: stamp(b.updatedAt), messages };
}

export async function listThreads(db: SupabaseClient, userId: string, projectId: string): Promise<ChatThread[]> {
  const { data: convs, error } = await db
    .from("ai_conversations")
    .select("id, project_id, user_id, title, created_at, updated_at")
    .eq("project_id", projectId)
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(MAX_THREADS);
  if (error) throw new ChatDbError(500, "Query failed");
  const list = (convs ?? []) as ConversationRow[];
  if (list.length === 0) return [];

  const { data: rows, error: rowsError } = await db
    .from("ai_messages")
    .select("id, conversation_id, project_id, user_id, role, content, provider, kind, context, proposal, status, snapshot_id, duration_ms, meta, created_at")
    .in("conversation_id", list.map((c) => c.id))
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(MAX_THREADS * MAX_THREAD_MESSAGES);
  if (rowsError) throw new ChatDbError(500, "Query failed");
  const byConversation = new Map<string, MessageRow[]>();
  for (const r of (rows ?? []) as MessageRow[]) byConversation.set(r.conversation_id, [...(byConversation.get(r.conversation_id) ?? []), r]);
  return list.map((c) => threadFromRows(c, byConversation.get(c.id) ?? []));
}

/** Writes one whole thread (last write wins): the conversation row, then its messages. */
export async function saveThread(db: SupabaseClient, userId: string, t: ThreadInput): Promise<void> {
  const { data: project } = await db.from("projects").select("id").eq("id", t.projectId).eq("user_id", userId).maybeSingle();
  if (!project) throw new ChatDbError(404, "Project not found");

  const { data: existing } = await db.from("ai_conversations").select("id, user_id, project_id").eq("id", t.id).maybeSingle();
  const ex = existing as { user_id: string; project_id: string } | null;
  if (ex && (ex.user_id !== userId || ex.project_id !== t.projectId)) throw new ChatDbError(403, "Forbidden");

  const { error: convError } = await db.from("ai_conversations").upsert({
    id: t.id, project_id: t.projectId, user_id: userId, title: t.title,
    created_at: new Date(t.createdAt).toISOString(), updated_at: new Date(t.updatedAt).toISOString(),
  }, { onConflict: "id" });
  if (convError) throw new ChatDbError(500, "Save failed");
  if (t.messages.length === 0) return;

  // A message id that already belongs to somebody else is never overwritten.
  const ids = t.messages.map((m) => m.id);
  const { data: foreign } = await db.from("ai_messages").select("id").in("id", ids).neq("user_id", userId);
  if ((foreign ?? []).length > 0) throw new ChatDbError(409, "Message id conflict");

  // A snapshot link only stays when the snapshot is really one of this project's.
  const wanted = [...new Set(t.messages.flatMap((m) => (m.role === "assistant" && m.snapshotId ? [m.snapshotId] : [])))];
  let valid = new Set<string>();
  if (wanted.length > 0) {
    const { data: snaps } = await db.from("project_snapshots").select("id").in("id", wanted).eq("project_id", t.projectId);
    valid = new Set(((snaps ?? []) as { id: string }[]).map((s) => s.id));
  }
  const owner = { conversationId: t.id, projectId: t.projectId, userId };
  const rows = t.messages.map((m) => {
    const row = toRow(m, owner);
    return row.snapshot_id && !valid.has(row.snapshot_id) ? { ...row, snapshot_id: null } : row;
  });
  const { error: msgError } = await db.from("ai_messages").upsert(rows, { onConflict: "id" });
  if (msgError) throw new ChatDbError(500, "Save failed");
}

export async function removeThread(db: SupabaseClient, userId: string, id: string): Promise<void> {
  if (!UUID.test(id)) throw new ChatDbError(400, "Invalid id");
  const { error } = await db.from("ai_conversations").delete().eq("id", id).eq("user_id", userId);
  if (error) throw new ChatDbError(500, "Delete failed");
}
