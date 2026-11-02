// PUT /api/ai/conversations/:id — save one whole AI chat (conversation row + its messages), last
// write wins. DELETE /api/ai/conversations/:id — remove it (its messages go with it).
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { ChatDbError, MAX_BODY_CHARS, readThreadInput, removeThread, saveThread } from "@/lib/aiChatDb";

type Ctx = { params: Promise<{ id: string }> };

async function userOf(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return (session?.user as { id?: string } | undefined)?.id ?? null;
}

// Only the messages ChatDbError carries are written for the browser; anything else stays in the log.
const fail = (err: unknown) => {
  if (err instanceof ChatDbError) return NextResponse.json({ error: err.message }, { status: err.status });
  console.error("[ai/conversations]", err);
  return NextResponse.json({ error: "Failed" }, { status: 500 });
};

export async function PUT(req: Request, { params }: Ctx) {
  const userId = await userOf();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  try {
    const text = await req.text();
    if (text.length > MAX_BODY_CHARS) throw new ChatDbError(413, "Chat too large");
    const input = readThreadInput(id, JSON.parse(text || "null"));
    await saveThread(getSupabaseAdmin(), userId, input);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return err instanceof SyntaxError ? NextResponse.json({ error: "Invalid JSON" }, { status: 400 }) : fail(err);
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const userId = await userOf();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  try {
    await removeThread(getSupabaseAdmin(), userId, id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return fail(err);
  }
}
