import { describe, it, expect, vi, beforeEach } from "vitest";

// /api/ai/conversations with the session and the database layer replaced: what is checked is the
// routes' own rules (who may call, what is validated, which status each failure maps to).

const getServerSession = vi.fn();
const listThreads = vi.fn();
const saveThread = vi.fn();
const removeThread = vi.fn();

vi.mock("next-auth", () => ({ getServerSession: (...a: unknown[]) => getServerSession(...a) }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("@/lib/supabaseAdmin", () => ({ getSupabaseAdmin: () => ({}) }));
vi.mock("@/lib/aiChatDb", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/aiChatDb")>();
  return { ...actual, listThreads: (...a: unknown[]) => listThreads(...a), saveThread: (...a: unknown[]) => saveThread(...a), removeThread: (...a: unknown[]) => removeThread(...a) };
});

const { GET } = await import("@/app/api/ai/conversations/route");
const { PUT, DELETE } = await import("@/app/api/ai/conversations/[id]/route");
const { ChatDbError } = await import("@/lib/aiChatDb");

const ID = "11111111-1111-4111-8111-111111111111";
const PROJECT = "22222222-2222-4222-8222-222222222222";
const MSG = "33333333-3333-4333-8333-333333333333";
const ctx = { params: Promise.resolve({ id: ID }) };
const body = { projectId: PROJECT, title: "Chat", createdAt: 1, updatedAt: 2, messages: [{ id: MSG, role: "user", at: 1, text: "hi" }] };
const put = (b: unknown) => PUT(new Request(`http://localhost/api/ai/conversations/${ID}`, { method: "PUT", body: typeof b === "string" ? b : JSON.stringify(b) }), ctx);

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
  getServerSession.mockResolvedValue({ user: { id: "u1" } });
});

describe("GET /api/ai/conversations", () => {
  const get = (q: string) => GET(new Request(`http://localhost/api/ai/conversations${q}`));

  it("401 for a guest, 400 without a project id", async () => {
    getServerSession.mockResolvedValue(null);
    expect((await get(`?projectId=${PROJECT}`)).status).toBe(401);
    getServerSession.mockResolvedValue({ user: { id: "u1" } });
    expect((await get("")).status).toBe(400);
    expect((await get("?projectId=not-a-uuid")).status).toBe(400);
    expect(listThreads).not.toHaveBeenCalled();
  });

  it("lists the signed-in user's threads of the project, uncached", async () => {
    listThreads.mockResolvedValue([{ id: ID, title: "T", createdAt: 1, updatedAt: 2, messages: [] }]);
    const res = await get(`?projectId=${PROJECT}`);
    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toBe("no-store");
    expect(listThreads).toHaveBeenCalledWith(expect.anything(), "u1", PROJECT);
    expect((await res.json()).conversations).toHaveLength(1);
  });
});

describe("PUT /api/ai/conversations/:id", () => {
  it("401 for a guest and nothing is saved", async () => {
    getServerSession.mockResolvedValue(null);
    expect((await put(body)).status).toBe(401);
    expect(saveThread).not.toHaveBeenCalled();
  });

  it("saves a valid chat as the signed-in user", async () => {
    saveThread.mockResolvedValue(undefined);
    expect((await put(body)).status).toBe(200);
    expect(saveThread).toHaveBeenCalledWith(expect.anything(), "u1", expect.objectContaining({ id: ID, projectId: PROJECT }));
  });

  it("400 for broken JSON or a chat that fails validation; 413 for an oversized body", async () => {
    expect((await put("{nope")).status).toBe(400);
    expect((await put({ ...body, projectId: "x" })).status).toBe(400);
    expect((await put({ ...body, messages: [{ ...body.messages[0], id: "m1" }] })).status).toBe(400);
    expect((await put(JSON.stringify({ ...body, pad: "x".repeat(2_000_001) }))).status).toBe(413);
    expect(saveThread).not.toHaveBeenCalled();
  });

  it("passes the database layer's status through (404, 403, 409) and hides anything else behind a 500", async () => {
    for (const status of [404, 403, 409]) {
      saveThread.mockRejectedValueOnce(new ChatDbError(status, "nope"));
      expect((await put(body)).status).toBe(status);
    }
    saveThread.mockRejectedValueOnce(new Error("connection string leaked"));
    const res = await put(body);
    expect(res.status).toBe(500);
    expect(JSON.stringify(await res.json())).not.toContain("connection string");
  });
});

describe("DELETE /api/ai/conversations/:id", () => {
  const del = () => DELETE(new Request(`http://localhost/api/ai/conversations/${ID}`, { method: "DELETE" }), ctx);

  it("401 for a guest; deletes as the signed-in user otherwise", async () => {
    getServerSession.mockResolvedValue(null);
    expect((await del()).status).toBe(401);
    getServerSession.mockResolvedValue({ user: { id: "u1" } });
    removeThread.mockResolvedValue(undefined);
    expect((await del()).status).toBe(200);
    expect(removeThread).toHaveBeenCalledWith(expect.anything(), "u1", ID);
  });
});
