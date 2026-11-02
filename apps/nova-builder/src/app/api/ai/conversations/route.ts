// GET /api/ai/conversations?projectId=… — the signed-in user's AI chats of one project, newest first,
// each with its messages (task 040). The panel reads this once when a project opens.
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { ChatDbError, listThreads } from "@/lib/aiChatDb";
import { UUID } from "@/lib/aiChat/ids";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const projectId = new URL(req.url).searchParams.get("projectId") ?? "";
  if (!UUID.test(projectId)) return NextResponse.json({ error: "projectId required" }, { status: 400 });

  try {
    const threads = await listThreads(getSupabaseAdmin(), userId, projectId);
    return NextResponse.json({ conversations: threads }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    if (err instanceof ChatDbError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("[ai/conversations]", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
