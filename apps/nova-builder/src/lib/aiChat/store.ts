// The AI tab's threads: one list per project, kept in the browser for now. The UI talks to the
// store, the store talks to a `ChatStorage`, so a database-backed storage can replace the
// browser one without touching the panel. Persisted shape: bump STORE_VERSION when it changes;
// anything unreadable is dropped on load instead of breaking the panel.
import { atom } from "nanostores";
import { newId } from "./ids";
import { withUuidIds } from "./dbMapping";
import { databaseChatRemote, type ChatRemote } from "./remote";
import type { AssistantMessage, ChatMessage, ChatState, ChatThread, UserMessage } from "./types";

export const STORE_VERSION = 1;
export const MAX_THREADS = 30;
export const MAX_MESSAGES = 200;
const MAX_STORED_CHARS = 3_500_000;

export const EMPTY_STATE: ChatState = { activeId: null, threads: [] };

export interface ChatStorage {
  load(projectId: string): ChatState;
  save(projectId: string, state: ChatState): void;
}

const keyFor = (projectId: string) => `nova-ai-chat:v${STORE_VERSION}:${projectId}`;

function readMessage(raw: unknown): ChatMessage | null {
  if (!raw || typeof raw !== "object") return null;
  const m = raw as Partial<ChatMessage> & { text?: unknown };
  if (typeof m.id !== "string" || typeof m.text !== "string" || typeof m.at !== "number") return null;
  if (m.role === "user") return m as UserMessage;
  if (m.role === "assistant") {
    const a = m as AssistantMessage;
    return a.kind === "reply" || a.kind === "proposal" || a.kind === "error" ? a : null;
  }
  return null;
}

/** Defensive read: unknown shapes become an empty state, bad threads or messages are skipped. */
export function parseChatState(json: string | null): ChatState {
  if (!json) return EMPTY_STATE;
  try {
    const raw = JSON.parse(json) as { v?: unknown; activeId?: unknown; threads?: unknown };
    if (raw.v !== STORE_VERSION || !Array.isArray(raw.threads)) return EMPTY_STATE;
    const threads: ChatThread[] = [];
    for (const t of raw.threads) {
      if (!t || typeof t !== "object") continue;
      const th = t as Partial<ChatThread>;
      if (typeof th.id !== "string" || !Array.isArray(th.messages)) continue;
      threads.push({
        id: th.id,
        title: typeof th.title === "string" ? th.title : "",
        createdAt: typeof th.createdAt === "number" ? th.createdAt : 0,
        updatedAt: typeof th.updatedAt === "number" ? th.updatedAt : 0,
        messages: th.messages.map(readMessage).filter((m): m is ChatMessage => m !== null).slice(-MAX_MESSAGES),
      });
    }
    const activeId = typeof raw.activeId === "string" && threads.some((t) => t.id === raw.activeId) ? raw.activeId : threads[0]?.id ?? null;
    return { activeId, threads: threads.slice(0, MAX_THREADS) };
  } catch {
    return EMPTY_STATE;
  }
}

/** What goes to storage: a proposal that is no longer pending drops its payload (it can be large). */
export function serializeChatState(state: ChatState): string {
  const lean = (m: ChatMessage): ChatMessage =>
    m.role === "assistant" && m.proposal?.payload && m.status !== "pending" ? { ...m, proposal: { lines: m.proposal.lines } } : m;
  const threads = state.threads.map((t) => ({ ...t, messages: t.messages.map(lean) }));
  let json = JSON.stringify({ v: STORE_VERSION, activeId: state.activeId, threads });
  // Still too big for the browser's quota: keep only the newest thread's pending payloads.
  if (json.length > MAX_STORED_CHARS) {
    const slim = threads.map((t, i) => (i === 0 ? t : { ...t, messages: t.messages.map((m) => (m.role === "assistant" && m.proposal ? { ...m, proposal: { lines: m.proposal.lines } } : m)) }));
    json = JSON.stringify({ v: STORE_VERSION, activeId: state.activeId, threads: slim });
  }
  return json;
}

export const localStorageChatStorage: ChatStorage = {
  load(projectId) {
    try {
      return parseChatState(localStorage.getItem(keyFor(projectId)));
    } catch {
      return EMPTY_STATE;
    }
  },
  save(projectId, state) {
    try {
      localStorage.setItem(keyFor(projectId), serializeChatState(state));
    } catch {
      /* storage full or blocked: the conversation still works for this visit */
    }
  },
};

export function titleFrom(text: string): string {
  const one = text.replace(/\s+/g, " ").trim();
  return one.length > 48 ? `${one.slice(0, 47)}…` : one;
}

/** What a thread looks like in storage and on the server: a proposal no longer pending drops its payload. */
export function leanThread(t: ChatThread): ChatThread {
  const lean = (m: ChatMessage): ChatMessage =>
    m.role === "assistant" && m.proposal?.payload && m.status !== "pending" ? { ...m, proposal: { lines: m.proposal.lines } } : m;
  return { ...t, messages: t.messages.map(lean) };
}

/**
 * Last write wins per thread. A thread only on one side is kept; a thread on both sides takes the
 * side with the later `updatedAt`. `push` lists the threads the server does not have (or has an
 * older copy of): they are sent, which also imports the chats that only lived in the browser.
 */
export function mergeThreads(local: ChatState, remote: ChatThread[]): { state: ChatState; push: string[] } {
  const remoteById = new Map(remote.map((t) => [t.id, t]));
  const localIds = new Set(local.threads.map((t) => t.id));
  const push: string[] = [];
  const merged: ChatThread[] = [];
  for (const l of local.threads) {
    const r = remoteById.get(l.id);
    if (!r || l.updatedAt > r.updatedAt) {
      merged.push(l);
      if (l.messages.length > 0) push.push(l.id);
    } else {
      merged.push(r);
    }
  }
  for (const r of remote) if (!localIds.has(r.id)) merged.push(r);
  merged.sort((a, b) => b.updatedAt - a.updatedAt);
  const threads = merged.slice(0, MAX_THREADS);
  const activeId = local.activeId && threads.some((t) => t.id === local.activeId) ? local.activeId : threads[0]?.id ?? null;
  return { state: { activeId, threads }, push };
}

export const SAVE_DELAY_MS = 1000;

type Timers = { set: (fn: () => void, ms: number) => unknown; clear: (handle: unknown) => void };
const realTimers: Timers = { set: (fn, ms) => setTimeout(fn, ms), clear: (h) => clearTimeout(h as ReturnType<typeof setTimeout>) };

export function createChatStore(storage: ChatStorage, now: () => number = Date.now, remote?: ChatRemote, timers: Timers = realTimers) {
  const $chat = atom<{ projectId: string | null; state: ChatState }>({ projectId: null, state: EMPTY_STATE });
  const dirty = new Set<string>();
  let remoteOff = false;
  let timer: unknown = null;

  function commit(next: ChatState, changed: string[] = []) {
    const { projectId } = $chat.get();
    $chat.set({ projectId, state: next });
    if (projectId) storage.save(projectId, next);
    for (const id of changed) dirty.add(id);
    if (changed.length > 0) schedule();
  }

  const update = (fn: (s: ChatState) => ChatState, changed: string[] = []) => commit(fn($chat.get().state), changed);

  function schedule() {
    if (!remote || remoteOff || timer !== null) return;
    timer = timers.set(() => { timer = null; void flush(); }, SAVE_DELAY_MS);
  }

  /** Sends every changed thread now. A failure keeps the thread marked, so the next change (or load) tries again. */
  async function flush(): Promise<void> {
    const { projectId } = $chat.get();
    if (!remote || remoteOff || !projectId) return;
    if (timer !== null) { timers.clear(timer); timer = null; }
    for (const id of [...dirty]) {
      const thread = $chat.get().state.threads.find((t) => t.id === id);
      dirty.delete(id);
      if (!thread || thread.messages.length === 0) continue;
      const ok = await remote.save(projectId, leanThread(thread));
      if (!ok) dirty.add(id);
    }
  }

  async function syncFromRemote(projectId: string) {
    if (!remote) return;
    const threads = await remote.load(projectId);
    if (threads === null) { remoteOff = true; return; }
    if ($chat.get().projectId !== projectId) return; // another project was opened meanwhile
    const { state, push } = mergeThreads($chat.get().state, threads);
    commit(state);
    for (const id of push) dirty.add(id);
    await flush();
  }

  return {
    $chat,
    flush,

    /** Loads the project's threads from the browser at once, then merges in the server's (once per project). */
    open(projectId: string) {
      if ($chat.get().projectId === projectId) return;
      dirty.clear();
      remoteOff = false;
      if (timer !== null) { timers.clear(timer); timer = null; }
      const local = storage.load(projectId);
      // chats kept before the database had them have non-UUID ids: give them UUIDs now
      const threads = local.threads.map(withUuidIds);
      const activeIndex = local.threads.findIndex((t) => t.id === local.activeId);
      $chat.set({ projectId, state: { activeId: activeIndex >= 0 ? threads[activeIndex]!.id : threads[0]?.id ?? null, threads } });
      if (threads.some((t, i) => t.id !== local.threads[i]!.id)) storage.save(projectId, $chat.get().state);
      void syncFromRemote(projectId);
    },

    /** A new empty thread, made the active one. */
    newThread(title = ""): string {
      const id = newId();
      const t = now();
      update((s) => ({ activeId: id, threads: [{ id, title, createdAt: t, updatedAt: t, messages: [] }, ...s.threads].slice(0, MAX_THREADS) }));
      return id;
    },

    selectThread(id: string) {
      update((s) => (s.threads.some((t) => t.id === id) ? { ...s, activeId: id } : s));
    },

    renameThread(id: string, title: string) {
      update((s) => ({ ...s, threads: s.threads.map((t) => (t.id === id ? { ...t, title: titleFrom(title), updatedAt: now() } : t)) }), [id]);
    },

    deleteThread(id: string) {
      dirty.delete(id);
      update((s) => {
        const threads = s.threads.filter((t) => t.id !== id);
        return { threads, activeId: s.activeId === id ? threads[0]?.id ?? null : s.activeId };
      });
      if (remote && !remoteOff) void remote.remove(id);
    },

    append(threadId: string, message: ChatMessage) {
      update((s) => ({
        ...s,
        threads: s.threads.map((t) => (t.id === threadId
          ? { ...t, updatedAt: now(), title: t.title || (message.role === "user" ? titleFrom(message.text) : t.title), messages: [...t.messages, message].slice(-MAX_MESSAGES) }
          : t)),
      }), [threadId]);
    },

    patch(threadId: string, messageId: string, change: Partial<AssistantMessage>) {
      update((s) => ({
        ...s,
        threads: s.threads.map((t) => (t.id === threadId
          ? { ...t, updatedAt: now(), messages: t.messages.map((m) => (m.id === messageId && m.role === "assistant" ? { ...m, ...change } : m)) }
          : t)),
      }), [threadId]);
    },

    removeMessage(threadId: string, messageId: string) {
      update((s) => ({ ...s, threads: s.threads.map((t) => (t.id === threadId ? { ...t, updatedAt: now(), messages: t.messages.filter((m) => m.id !== messageId) } : t)) }), [threadId]);
    },

    active(): ChatThread | null {
      const { state } = $chat.get();
      return state.threads.find((t) => t.id === state.activeId) ?? null;
    },
  };
}

export const chatStore = createChatStore(localStorageChatStorage, Date.now, databaseChatRemote);
