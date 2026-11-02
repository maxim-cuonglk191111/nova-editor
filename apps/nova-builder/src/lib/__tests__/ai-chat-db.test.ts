import { describe, it, expect } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { fromRow, threadFromRows, toRow, withUuidIds } from "../aiChat/dbMapping";
import { newId, UUID } from "../aiChat/ids";
import { ChatDbError, listThreads, readThreadInput, removeThread, saveThread, type ThreadInput } from "../aiChatDb";
import type { AssistantMessage, ChatMessage, ChatThread, UserMessage } from "../aiChat/types";

const OWNER = { conversationId: newId(), projectId: newId(), userId: newId() };

const user = (text: string, extra: Partial<UserMessage> = {}): UserMessage => ({ id: newId(), role: "user", at: 1_700_000_000_000, text, ...extra });
const applied = (extra: Partial<AssistantMessage> = {}): AssistantMessage => ({
  id: newId(), role: "assistant", at: 1_700_000_001_000, kind: "proposal", text: "Ready", provider: "groq", ms: 1234.6,
  status: "applied", result: { applied: 2, skipped: 1 }, checks: [], proposal: { lines: [{ kind: "text", count: 1, label: "Title", ids: ["h1"] }] },
  ...extra,
});

describe("message rows", () => {
  it("round-trips a user message with its context chip and the generate flag", () => {
    const ref = { scope: "section" as const, pageId: "p1", pageName: "Home", sectionId: "s1", sectionLabel: "Hero" };
    const m = user("Make it warmer", { ref, generate: true });
    const row = toRow(m, OWNER);
    expect(row).toMatchObject({ role: "user", kind: "text", content: "Make it warmer", context: ref, meta: { generate: true } });
    expect(fromRow(row)).toEqual(m);
  });

  it("round-trips an applied proposal: status, result, provider, time and the restore point", () => {
    const snapshotId = newId();
    const m = applied({ snapshotId });
    const row = toRow(m, OWNER);
    expect(row).toMatchObject({ role: "assistant", kind: "proposal", status: "applied", snapshot_id: snapshotId, duration_ms: 1235, meta: { result: { applied: 2, skipped: 1 } } });
    expect(fromRow(row)).toEqual({ ...m, ms: 1235 });
  });

  it("stores a plain answer as kind 'text' and reads it back as a reply", () => {
    const reply: AssistantMessage = { id: newId(), role: "assistant", at: 1_700_000_002_000, kind: "reply", text: "Sure" };
    const row = toRow(reply, OWNER);
    expect(row.kind).toBe("text");
    expect(fromRow(row)?.role === "assistant" && fromRow(row)).toMatchObject({ kind: "reply", text: "Sure" });
  });

  it("reads rows written before the migration (kind 'text', nothing else) without throwing", () => {
    const legacy = { id: newId(), role: "assistant", content: "Composed 12 instance(s)", created_at: "2026-01-01T00:00:00Z" };
    expect(fromRow(legacy)).toMatchObject({ kind: "reply", text: "Composed 12 instance(s)" });
    expect(fromRow({ ...legacy, created_at: "not a date" })).toBeNull();
    expect(fromRow({ ...legacy, role: "system" })).toBeNull();
  });

  it("threadFromRows orders by time and ignores broken rows", () => {
    const rows = [applied({ at: 3000 }), user("first", { at: 1000 })].map((m) => toRow(m, OWNER));
    const conv = { id: OWNER.conversationId, project_id: OWNER.projectId, user_id: OWNER.userId, title: "T", created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-02T00:00:00Z" };
    const t = threadFromRows(conv, [...rows, { ...rows[0]!, id: newId(), created_at: "bad" }]);
    expect(t.messages.map((m) => m.role)).toEqual(["user", "assistant"]);
    expect(t.updatedAt).toBe(Date.parse("2026-01-02T00:00:00Z"));
  });

  it("withUuidIds gives threads kept before the database real UUIDs and leaves UUIDs alone", () => {
    const keep = newId();
    const legacy: ChatThread = { id: "thread_1", title: "x", createdAt: 1, updatedAt: 2, messages: [{ id: "msg_a", role: "user", at: 1, text: "a" }, { id: keep, role: "user", at: 2, text: "b" }] };
    const fixed = withUuidIds(legacy);
    expect(UUID.test(fixed.id)).toBe(true);
    expect(fixed.messages.every((m) => UUID.test(m.id))).toBe(true);
    expect(fixed.messages[1]!.id).toBe(keep);
    expect(withUuidIds(fixed)).toEqual(fixed);
  });
});

// ── a small in-memory stand-in for the Supabase client ────────────────────────────────────────
type Row = Record<string, unknown>;
function fakeDb(seed: Record<string, Row[]> = {}) {
  const tables: Record<string, Row[]> = { projects: [], ai_conversations: [], ai_messages: [], project_snapshots: [], ...seed };
  class Query implements PromiseLike<{ data: unknown; error: null }> {
    private filters: ((r: Row) => boolean)[] = [];
    private mode: "select" | "delete" = "select";
    private orderBy: { col: string; asc: boolean } | null = null;
    private max = Infinity;
    constructor(private table: string, private pendingUpsert?: { rows: Row[] }) {}
    select() { return this; }
    delete() { this.mode = "delete"; return this; }
    eq(col: string, v: unknown) { this.filters.push((r) => r[col] === v); return this; }
    neq(col: string, v: unknown) { this.filters.push((r) => r[col] !== v); return this; }
    in(col: string, vs: unknown[]) { this.filters.push((r) => vs.includes(r[col])); return this; }
    order(col: string, o: { ascending: boolean }) { this.orderBy = { col, asc: o.ascending }; return this; }
    limit(n: number) { this.max = n; return this; }
    maybeSingle() { return Promise.resolve({ data: this.run()[0] ?? null, error: null }); }
    private run(): Row[] {
      let rows = tables[this.table]!.filter((r) => this.filters.every((f) => f(r)));
      if (this.mode === "delete") {
        tables[this.table] = tables[this.table]!.filter((r) => !rows.includes(r));
        // a conversation takes its messages with it
        if (this.table === "ai_conversations") {
          const gone = new Set(rows.map((r) => r.id));
          tables.ai_messages = tables.ai_messages!.filter((m) => !gone.has(m.conversation_id));
        }
        return [];
      }
      if (this.orderBy) {
        const { col, asc } = this.orderBy;
        rows = [...rows].sort((a, b) => (String(a[col]) < String(b[col]) ? -1 : 1) * (asc ? 1 : -1));
      }
      return rows.slice(0, this.max);
    }
    then<T1, T2>(ok?: (v: { data: unknown; error: null }) => T1 | PromiseLike<T1>, no?: (e: unknown) => T2 | PromiseLike<T2>) {
      if (this.pendingUpsert) {
        for (const row of this.pendingUpsert.rows) {
          const i = tables[this.table]!.findIndex((r) => r.id === row.id);
          if (i >= 0) tables[this.table]![i] = { ...tables[this.table]![i], ...row }; else tables[this.table]!.push({ ...row });
        }
        return Promise.resolve({ data: null, error: null }).then(ok, no);
      }
      return Promise.resolve({ data: this.run(), error: null }).then(ok, no);
    }
  }
  const db = {
    from: (table: string) => ({
      select: () => new Query(table),
      delete: () => new Query(table).delete(),
      upsert: (rows: Row | Row[]) => new Query(table, { rows: Array.isArray(rows) ? rows : [rows] }),
    }),
  } as unknown as SupabaseClient;
  return { db, tables };
}

const input = (projectId: string, messages: ChatMessage[], extra: Partial<ThreadInput> = {}): ThreadInput =>
  ({ id: newId(), projectId, title: "Chat", createdAt: 1_700_000_000_000, updatedAt: 1_700_000_005_000, messages, ...extra });

describe("readThreadInput", () => {
  const body = (over: Record<string, unknown> = {}) => ({ projectId: newId(), title: "  Hello   world ", createdAt: 1, updatedAt: 2, messages: [user("hi")], ...over });

  it("accepts a well-formed chat and tidies the title", () => {
    const t = readThreadInput(newId(), body());
    expect(t.title).toBe("Hello world");
    expect(t.messages).toHaveLength(1);
  });

  it.each([
    ["a thread id that is not a UUID", () => readThreadInput("thread_1", body())],
    ["a missing project id", () => readThreadInput(newId(), body({ projectId: "p1" }))],
    ["a message id that is not a UUID", () => readThreadInput(newId(), body({ messages: [{ ...user("x"), id: "m1" }] }))],
    ["an unknown assistant kind", () => readThreadInput(newId(), body({ messages: [{ ...applied(), kind: "weird" }] }))],
    ["more messages than allowed", () => readThreadInput(newId(), body({ messages: Array.from({ length: 201 }, () => user("x")) }))],
  ])("rejects %s with a 400", (_name, run) => {
    expect(run).toThrowError(ChatDbError);
    try { run(); } catch (e) { expect((e as ChatDbError).status).toBe(400); }
  });
});

describe("saveThread / listThreads / removeThread", () => {
  const userA = newId();
  const userB = newId();
  const projectA = newId();

  const seeded = () => fakeDb({ projects: [{ id: projectA, user_id: userA }] });

  it("saves a whole chat and lists it back, newest first, with messages in order", async () => {
    const { db } = seeded();
    const older = input(projectA, [user("older")], { updatedAt: 1_700_000_001_000 });
    const newer = input(projectA, [user("newer"), applied()], { updatedAt: 1_700_000_009_000 });
    await saveThread(db, userA, older);
    await saveThread(db, userA, newer);
    const list = await listThreads(db, userA, projectA);
    expect(list.map((t) => t.id)).toEqual([newer.id, older.id]);
    expect(list[0]!.messages.map((m) => m.role)).toEqual(["user", "assistant"]);
  });

  it("saving again replaces the same messages instead of duplicating them (last write wins)", async () => {
    const { db, tables } = seeded();
    const m = user("hello");
    await saveThread(db, userA, input(projectA, [m], { id: "11111111-1111-4111-8111-111111111111" }));
    await saveThread(db, userA, input(projectA, [{ ...m, text: "hello edited" }, applied()], { id: "11111111-1111-4111-8111-111111111111" }));
    expect(tables.ai_messages).toHaveLength(2);
    expect(tables.ai_conversations).toHaveLength(1);
    expect(tables.ai_messages!.find((r) => r.id === m.id)!.content).toBe("hello edited");
  });

  it("404 for a project that is not the user's; nothing is written", async () => {
    const { db, tables } = seeded();
    await expect(saveThread(db, userB, input(projectA, [user("x")]))).rejects.toMatchObject({ status: 404 });
    expect(tables.ai_conversations).toHaveLength(0);
  });

  it("403 when the conversation id already belongs to someone else", async () => {
    const { db } = seeded();
    const t = input(projectA, [user("mine")]);
    await saveThread(db, userA, t);
    const projectB = newId();
    const other = fakeDb({ projects: [{ id: projectA, user_id: userA }, { id: projectB, user_id: userB }], ai_conversations: [{ id: t.id, project_id: projectA, user_id: userA }] });
    await expect(saveThread(other.db, userB, { ...t, projectId: projectB })).rejects.toMatchObject({ status: 403 });
  });

  it("409 when a message id already belongs to another user, and the row is untouched", async () => {
    const stolen = user("not yours");
    const { db, tables } = fakeDb({
      projects: [{ id: projectA, user_id: userA }],
      ai_messages: [{ id: stolen.id, user_id: userB, content: "theirs", conversation_id: newId() }],
    });
    await expect(saveThread(db, userA, input(projectA, [stolen]))).rejects.toMatchObject({ status: 409 });
    expect(tables.ai_messages![0]!.content).toBe("theirs");
  });

  it("keeps a restore point only when the snapshot is one of this project's", async () => {
    const mine = newId();
    const foreign = newId();
    const { db, tables } = fakeDb({
      projects: [{ id: projectA, user_id: userA }],
      project_snapshots: [{ id: mine, project_id: projectA }, { id: foreign, project_id: newId() }],
    });
    const a = applied({ snapshotId: mine });
    const b = applied({ snapshotId: foreign });
    await saveThread(db, userA, input(projectA, [a, b]));
    expect(tables.ai_messages!.find((r) => r.id === a.id)!.snapshot_id).toBe(mine);
    expect(tables.ai_messages!.find((r) => r.id === b.id)!.snapshot_id).toBeNull();
  });

  it("lists only the signed-in user's chats", async () => {
    const { db } = fakeDb({ projects: [{ id: projectA, user_id: userA }] });
    await saveThread(db, userA, input(projectA, [user("secret")]));
    expect(await listThreads(db, userB, projectA)).toEqual([]);
  });

  it("removes only the user's own chat, taking its messages along", async () => {
    const { db, tables } = seeded();
    const t = input(projectA, [user("bye")]);
    await saveThread(db, userA, t);
    await removeThread(db, userB, t.id);
    expect(tables.ai_conversations).toHaveLength(1);
    await removeThread(db, userA, t.id);
    expect(tables.ai_conversations).toHaveLength(0);
    expect(tables.ai_messages).toHaveLength(0);
    await expect(removeThread(db, userA, "nope")).rejects.toMatchObject({ status: 400 });
  });
});
