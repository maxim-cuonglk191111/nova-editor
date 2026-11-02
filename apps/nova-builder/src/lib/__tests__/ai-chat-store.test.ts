import { describe, it, expect } from "vitest";
import { createChatStore, parseChatState, serializeChatState, titleFrom, MAX_THREADS, STORE_VERSION, type ChatStorage } from "../aiChat/store";
import type { AssistantMessage, ChatState, UserMessage } from "../aiChat/types";

function memoryStorage() {
  const data = new Map<string, ChatState>();
  const saves: string[] = [];
  const storage: ChatStorage = {
    load: (id) => data.get(id) ?? { activeId: null, threads: [] },
    save: (id, s) => { saves.push(id); data.set(id, JSON.parse(serializeChatState(s)) as ChatState); },
  };
  return { storage, data, saves };
}

let clock = 1000;
const now = () => ++clock;
const user = (id: string, text: string): UserMessage => ({ id, role: "user", at: now(), text });
const proposal = (id: string, status: AssistantMessage["status"], withPayload = true): AssistantMessage => ({
  id, role: "assistant", at: now(), kind: "proposal", text: "Done", status,
  proposal: { lines: [{ kind: "text", count: 1, label: "Title", ids: ["h1"] }], ...(withPayload ? { payload: { type: "ops" as const, ops: [{ op: "remove" as const, id: "x" }] } } : {}) },
});

describe("chat store", () => {
  it("starts a thread, titles it from the first user message and persists every change", () => {
    const { storage, saves } = memoryStorage();
    const s = createChatStore(storage, now);
    s.open("proj");
    const id = s.newThread();
    s.append(id, user("m1", "Make this section shorter and warmer please, the hero is too long for a phone screen"));
    const t = s.active()!;
    expect(t.id).toBe(id);
    expect(t.title).toBe(titleFrom("Make this section shorter and warmer please, the hero is too long for a phone screen"));
    expect(t.title.length).toBeLessThanOrEqual(48);
    expect(saves.length).toBeGreaterThanOrEqual(2);
  });

  it("a reload (a new store on the same storage) gets the thread and a pending proposal back with its payload", () => {
    const { storage } = memoryStorage();
    const a = createChatStore(storage, now);
    a.open("proj");
    const id = a.newThread();
    a.append(id, user("m1", "hi"));
    a.append(id, proposal("m2", "pending"));
    const b = createChatStore(storage, now);
    b.open("proj");
    const msgs = b.active()!.messages;
    expect(msgs.map((m) => m.id)).toEqual(["m1", "m2"]);
    expect((msgs[1] as AssistantMessage).proposal?.payload).toBeTruthy();
  });

  it("an applied or discarded proposal is stored without its payload", () => {
    const { storage } = memoryStorage();
    const s = createChatStore(storage, now);
    s.open("proj");
    const id = s.newThread();
    s.append(id, proposal("m1", "pending"));
    s.patch(id, "m1", { status: "applied" });
    const reloaded = createChatStore(storage, now);
    reloaded.open("proj");
    const m = reloaded.active()!.messages[0] as AssistantMessage;
    expect(m.status).toBe("applied");
    expect(m.proposal?.payload).toBeUndefined();
    expect(m.proposal?.lines).toHaveLength(1);
  });

  it("keeps projects apart", () => {
    const { storage } = memoryStorage();
    const s = createChatStore(storage, now);
    s.open("a");
    s.append(s.newThread(), user("m1", "in a"));
    s.open("b");
    expect(s.active()).toBeNull();
    s.open("a");
    expect(s.active()?.messages).toHaveLength(1);
  });

  it("selects, renames and deletes threads; deleting the active one falls back to another", () => {
    const { storage } = memoryStorage();
    const s = createChatStore(storage, now);
    s.open("p");
    const one = s.newThread("one");
    const two = s.newThread("two");
    expect(s.active()?.id).toBe(two);
    s.selectThread(one);
    s.renameThread(one, "  first   chat ");
    expect(s.active()?.title).toBe("first chat");
    s.deleteThread(one);
    expect(s.active()?.id).toBe(two);
    s.deleteThread(two);
    expect(s.active()).toBeNull();
  });

  it("caps the number of threads, dropping the oldest", () => {
    const { storage } = memoryStorage();
    const s = createChatStore(storage, now);
    s.open("p");
    for (let i = 0; i < MAX_THREADS + 5; i++) s.newThread(`t${i}`);
    const { threads } = s.$chat.get().state;
    expect(threads).toHaveLength(MAX_THREADS);
    expect(threads[0]!.title).toBe(`t${MAX_THREADS + 4}`);
  });
});

describe("parseChatState", () => {
  it("is defensive: junk, other versions and half-valid data never throw", () => {
    expect(parseChatState(null).threads).toEqual([]);
    expect(parseChatState("{not json").threads).toEqual([]);
    expect(parseChatState(JSON.stringify({ v: STORE_VERSION + 1, threads: [] })).threads).toEqual([]);
    const half = parseChatState(JSON.stringify({
      v: STORE_VERSION, activeId: "missing",
      threads: [
        { id: "a", title: 5, messages: [{ id: "1", role: "user", text: "hi", at: 1 }, { id: "2", role: "robot", text: "x", at: 2 }, null, { id: "3", role: "assistant", kind: "reply", text: "yo", at: 3 }] },
        { nope: true },
      ],
    }));
    expect(half.threads).toHaveLength(1);
    expect(half.threads[0]!.messages.map((m) => m.id)).toEqual(["1", "3"]);
    expect(half.activeId).toBe("a");
  });
});
