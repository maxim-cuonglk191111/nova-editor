import { describe, it, expect } from "vitest";
import { createChatStore, mergeThreads, leanThread, SAVE_DELAY_MS, serializeChatState, type ChatStorage } from "../aiChat/store";
import type { ChatRemote } from "../aiChat/remote";
import { newId, UUID } from "../aiChat/ids";
import type { AssistantMessage, ChatState, ChatThread, UserMessage } from "../aiChat/types";

let clock = 1000;
const now = () => ++clock;
const user = (text: string): UserMessage => ({ id: newId(), role: "user", at: now(), text });
const thread = (updatedAt: number, messages: ChatThread["messages"] = [user("hi")]): ChatThread => ({ id: newId(), title: "T", createdAt: 1, updatedAt, messages });

function memoryStorage(initial: Record<string, ChatState> = {}) {
  const data = new Map<string, ChatState>(Object.entries(initial));
  const storage: ChatStorage = {
    load: (id) => data.get(id) ?? { activeId: null, threads: [] },
    save: (id, s) => { data.set(id, JSON.parse(serializeChatState(s)) as ChatState); },
  };
  return { storage, data };
}

/** Timers the test fires by hand, so "after one second" needs no waiting. */
function manualTimers() {
  let fn: (() => void) | null = null;
  let delay = 0;
  return {
    timers: { set: (f: () => void, ms: number) => { fn = f; delay = ms; return 1; }, clear: () => { fn = null; } },
    pending: () => fn !== null,
    delay: () => delay,
    fire: () => { const f = fn; fn = null; f?.(); },
  };
}

function fakeRemote(server: ChatThread[] | null) {
  const saved: ChatThread[] = [];
  const removed: string[] = [];
  const state = { ok: true, server };
  const remote: ChatRemote = {
    load: async () => state.server,
    save: async (_p, t) => { if (!state.ok) return false; saved.push(t); return true; },
    remove: async (id) => { removed.push(id); },
  };
  return { remote, saved, removed, state };
}

const settle = () => new Promise((r) => setTimeout(r, 0));

describe("mergeThreads", () => {
  it("keeps threads from both sides, newest first", () => {
    const l = thread(10);
    const r = thread(20);
    const { state, push } = mergeThreads({ activeId: l.id, threads: [l] }, [r]);
    expect(state.threads.map((t) => t.id)).toEqual([r.id, l.id]);
    expect(state.activeId).toBe(l.id);
    expect(push).toEqual([l.id]); // only in the browser: goes to the server
  });

  it("takes the side with the later updatedAt for the same thread", () => {
    const base = thread(10);
    const newerOnServer = { ...base, updatedAt: 30, messages: [user("server")] };
    expect(mergeThreads({ activeId: null, threads: [base] }, [newerOnServer]).state.threads[0]!.messages[0]).toMatchObject({ text: "server" });
    const newerLocal = { ...base, updatedAt: 50, messages: [user("local")] };
    const merged = mergeThreads({ activeId: null, threads: [newerLocal] }, [{ ...base, updatedAt: 30 }]);
    expect(merged.state.threads[0]!.messages[0]).toMatchObject({ text: "local" });
    expect(merged.push).toEqual([base.id]);
  });

  it("does not push empty threads or ones the server already has up to date", () => {
    const empty = thread(10, []);
    const same = thread(10);
    expect(mergeThreads({ activeId: null, threads: [empty, same] }, [same]).push).toEqual([]);
  });

  it("falls back to the first thread when the active one is gone", () => {
    const r = thread(20);
    expect(mergeThreads({ activeId: "gone", threads: [] }, [r]).state.activeId).toBe(r.id);
  });
});

describe("leanThread", () => {
  it("drops the payload of a decided proposal but keeps a pending one's", () => {
    const mk = (status: AssistantMessage["status"]): AssistantMessage => ({
      id: newId(), role: "assistant", at: 1, kind: "proposal", text: "x", status,
      proposal: { lines: [], payload: { type: "ops", ops: [{ op: "remove", id: "a" }] } },
    });
    const t = leanThread({ ...thread(1, [mk("pending"), mk("applied")]) });
    expect((t.messages[0] as AssistantMessage).proposal?.payload).toBeTruthy();
    expect((t.messages[1] as AssistantMessage).proposal?.payload).toBeUndefined();
  });
});

describe("chat store with a database", () => {
  it("sends a changed thread once, one second after the last change", async () => {
    const { storage } = memoryStorage();
    const { remote, saved } = fakeRemote([]);
    const tm = manualTimers();
    const s = createChatStore(storage, now, remote, tm.timers);
    s.open("proj");
    await settle();
    const id = s.newThread();
    s.append(id, user("one"));
    s.append(id, user("two"));
    expect(tm.pending()).toBe(true);
    expect(tm.delay()).toBe(SAVE_DELAY_MS);
    expect(saved).toHaveLength(0);
    tm.fire();
    await settle();
    expect(saved).toHaveLength(1);
    expect(saved[0]!.messages.map((m) => (m as UserMessage).text)).toEqual(["one", "two"]);
  });

  it("shows the server's chats on a fresh browser", async () => {
    const { storage } = memoryStorage();
    const onServer = thread(500, [user("from another device")]);
    const { remote } = fakeRemote([onServer]);
    const s = createChatStore(storage, now, remote, manualTimers().timers);
    s.open("proj");
    await settle();
    expect(s.active()?.id).toBe(onServer.id);
    expect(s.active()?.messages).toHaveLength(1);
  });

  it("imports a chat that only lived in the browser", async () => {
    const local = thread(100, [user("kept locally")]);
    const { storage } = memoryStorage({ proj: { activeId: local.id, threads: [local] } });
    const { remote, saved } = fakeRemote([]);
    const s = createChatStore(storage, now, remote, manualTimers().timers);
    s.open("proj");
    await settle();
    expect(saved.map((t) => t.id)).toEqual([local.id]);
  });

  it("converts chats kept before the database (non-UUID ids) and stores the new ids", async () => {
    const legacy: ChatThread = { id: "thread_x", title: "old", createdAt: 1, updatedAt: 2, messages: [{ id: "msg_1", role: "user", at: 1, text: "old" }] };
    const { storage, data } = memoryStorage({ proj: { activeId: "thread_x", threads: [legacy] } });
    const { remote, saved } = fakeRemote([]);
    const s = createChatStore(storage, now, remote, manualTimers().timers);
    s.open("proj");
    expect(UUID.test(s.active()!.id)).toBe(true);
    expect(UUID.test(data.get("proj")!.threads[0]!.messages[0]!.id)).toBe(true);
    await settle();
    expect(saved).toHaveLength(1);
  });

  it("works from the browser copy alone when the server cannot be used (guest, offline)", async () => {
    const { storage } = memoryStorage();
    const { remote, saved } = fakeRemote(null);
    const tm = manualTimers();
    const s = createChatStore(storage, now, remote, tm.timers);
    s.open("proj");
    await settle();
    s.append(s.newThread(), user("local only"));
    expect(tm.pending()).toBe(false);
    await s.flush();
    expect(saved).toHaveLength(0);
    expect(s.active()?.messages).toHaveLength(1);
  });

  it("keeps a thread that failed to send and sends it with the next change", async () => {
    const { storage } = memoryStorage();
    const f = fakeRemote([]);
    const tm = manualTimers();
    const s = createChatStore(storage, now, f.remote, tm.timers);
    s.open("proj");
    await settle();
    const id = s.newThread();
    f.state.ok = false;
    s.append(id, user("first"));
    await s.flush();
    expect(f.saved).toHaveLength(0);
    f.state.ok = true;
    s.append(id, user("second"));
    await s.flush();
    expect(f.saved).toHaveLength(1);
    expect(f.saved[0]!.messages).toHaveLength(2);
  });

  it("deleting a thread removes it on the server too and never sends it again", async () => {
    const { storage } = memoryStorage();
    const f = fakeRemote([]);
    const s = createChatStore(storage, now, f.remote, manualTimers().timers);
    s.open("proj");
    await settle();
    const id = s.newThread();
    s.append(id, user("x"));
    s.deleteThread(id);
    await s.flush();
    expect(f.removed).toEqual([id]);
    expect(f.saved).toHaveLength(0);
  });

  it("does not mix a late server answer into another project", async () => {
    const { storage } = memoryStorage();
    let release: (t: ChatThread[]) => void = () => {};
    const remote: ChatRemote = {
      load: (p) => (p === "a" ? new Promise((r) => { release = r; }) : Promise.resolve([])),
      save: async () => true,
      remove: async () => {},
    };
    const s = createChatStore(storage, now, remote, manualTimers().timers);
    s.open("a");
    s.open("b");
    release([thread(5)]);
    await settle();
    expect(s.$chat.get().projectId).toBe("b");
    expect(s.$chat.get().state.threads).toHaveLength(0);
  });
});
