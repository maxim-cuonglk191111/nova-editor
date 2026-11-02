// The AI tab's threads: one list per project, kept in the browser for now. The UI talks to the
// store, the store talks to a `ChatStorage`, so a database-backed storage can replace the
// browser one without touching the panel. Persisted shape: bump STORE_VERSION when it changes;
// anything unreadable is dropped on load instead of breaking the panel.
import { atom } from "nanostores";
import { uid } from "@/lib/uid";
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

export function createChatStore(storage: ChatStorage, now: () => number = Date.now) {
  const $chat = atom<{ projectId: string | null; state: ChatState }>({ projectId: null, state: EMPTY_STATE });

  function commit(next: ChatState) {
    const { projectId } = $chat.get();
    $chat.set({ projectId, state: next });
    if (projectId) storage.save(projectId, next);
  }

  const update = (fn: (s: ChatState) => ChatState) => commit(fn($chat.get().state));

  return {
    $chat,

    /** Loads the project's threads (once per project). */
    open(projectId: string) {
      if ($chat.get().projectId === projectId) return;
      $chat.set({ projectId, state: storage.load(projectId) });
    },

    /** A new empty thread, made the active one. */
    newThread(title = ""): string {
      const id = uid("thr_");
      const t = now();
      update((s) => ({ activeId: id, threads: [{ id, title, createdAt: t, updatedAt: t, messages: [] }, ...s.threads].slice(0, MAX_THREADS) }));
      return id;
    },

    selectThread(id: string) {
      update((s) => (s.threads.some((t) => t.id === id) ? { ...s, activeId: id } : s));
    },

    renameThread(id: string, title: string) {
      update((s) => ({ ...s, threads: s.threads.map((t) => (t.id === id ? { ...t, title: titleFrom(title) } : t)) }));
    },

    deleteThread(id: string) {
      update((s) => {
        const threads = s.threads.filter((t) => t.id !== id);
        return { threads, activeId: s.activeId === id ? threads[0]?.id ?? null : s.activeId };
      });
    },

    append(threadId: string, message: ChatMessage) {
      update((s) => ({
        ...s,
        threads: s.threads.map((t) => (t.id === threadId
          ? { ...t, updatedAt: now(), title: t.title || (message.role === "user" ? titleFrom(message.text) : t.title), messages: [...t.messages, message].slice(-MAX_MESSAGES) }
          : t)),
      }));
    },

    patch(threadId: string, messageId: string, change: Partial<AssistantMessage>) {
      update((s) => ({
        ...s,
        threads: s.threads.map((t) => (t.id === threadId
          ? { ...t, messages: t.messages.map((m) => (m.id === messageId && m.role === "assistant" ? { ...m, ...change } : m)) }
          : t)),
      }));
    },

    removeMessage(threadId: string, messageId: string) {
      update((s) => ({ ...s, threads: s.threads.map((t) => (t.id === threadId ? { ...t, messages: t.messages.filter((m) => m.id !== messageId) } : t)) }));
    },

    active(): ChatThread | null {
      const { state } = $chat.get();
      return state.threads.find((t) => t.id === state.activeId) ?? null;
    },
  };
}

export const chatStore = createChatStore(localStorageChatStorage);
