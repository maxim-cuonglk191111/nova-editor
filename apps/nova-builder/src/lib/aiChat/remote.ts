// The database side of the chat store: three calls to /api/ai/conversations. A guest (401), a
// project that is not saved yet (404) or a network failure makes the store fall back to the
// browser copy only; nothing here throws.
import type { ChatThread } from "./types";

export interface ChatRemote {
  /** The user's threads of the project, or null when the server cannot be used for this (guest, unsaved project, offline). */
  load(projectId: string): Promise<ChatThread[] | null>;
  /** One whole thread. False when it did not go through (the store keeps it and tries again). */
  save(projectId: string, thread: ChatThread): Promise<boolean>;
  remove(threadId: string): Promise<void>;
}

export const databaseChatRemote: ChatRemote = {
  async load(projectId) {
    try {
      const res = await fetch(`/api/ai/conversations?projectId=${encodeURIComponent(projectId)}`, { cache: "no-store" });
      if (!res.ok) return null;
      const json = (await res.json()) as { conversations?: ChatThread[] };
      return Array.isArray(json.conversations) ? json.conversations : null;
    } catch {
      return null;
    }
  },

  async save(projectId, thread) {
    try {
      const res = await fetch(`/api/ai/conversations/${thread.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        // keepalive lets the last save go out while the tab is closing
        keepalive: JSON.stringify(thread).length < 60_000,
        body: JSON.stringify({ projectId, title: thread.title, createdAt: thread.createdAt, updatedAt: thread.updatedAt, messages: thread.messages }),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async remove(threadId) {
    try {
      await fetch(`/api/ai/conversations/${threadId}`, { method: "DELETE" });
    } catch {
      /* the local copy is already gone; a later load shows the thread again if this failed */
    }
  },
};
