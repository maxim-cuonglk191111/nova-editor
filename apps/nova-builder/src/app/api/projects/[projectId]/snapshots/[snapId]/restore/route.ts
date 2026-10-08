// POST /api/projects/:id/snapshots/:snapId/restore
// Copies schema_json from snapshot back to the project (1-click rollback).

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";


export async function POST(
  _req: Request,
  context: { params: Promise<{ projectId: string; snapId: string }> }
) {
  const { projectId, snapId } = await context.params;
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Fetch the snapshot (ownership via user_id)
  const { data: snap, error: snapErr } = await getSupabaseAdmin()
    .from("project_snapshots")
    .select("schema_json")
    .eq("id", snapId)
    .eq("project_id", projectId)
    .eq("user_id", userId)
    .single();

  if (snapErr || !snap) {
    return NextResponse.json({ error: "Snapshot not found" }, { status: 404 });
  }

  const { data: current } = await getSupabaseAdmin()
    .from("projects")
    .select("schema_json, version")
    .eq("id", projectId)
    .eq("user_id", userId)
    .single();
  if (!current) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  // Save a "before restore" snapshot so the user can undo the rollback
  try {
    await getSupabaseAdmin().from("project_snapshots").insert({
      project_id: projectId,
      user_id: userId,
      label: "Before restore",
      schema_json: current.schema_json,
    });
  } catch {/* non-fatal — checkpoint failure should not block restore */}

  // Bump the version so every tab still holding the pre-restore document gets
  // 409 on its next save instead of writing its edits over the restored page.
  const baseVersion = current.version as number | null;
  const version = (baseVersion ?? 0) + 1;
  let query = getSupabaseAdmin()
    .from("projects")
    .update({ schema_json: snap.schema_json, version, updated_at: new Date().toISOString() })
    .eq("id", projectId)
    .eq("user_id", userId);
  if (typeof baseVersion === "number") query = query.eq("version", baseVersion);
  const { data: updated, error: updateErr } = await query.select("version");

  if (updateErr) return NextResponse.json({ error: "Restore failed" }, { status: 500 });
  if (!updated || updated.length === 0) return NextResponse.json({ error: "Version conflict" }, { status: 409 });
  return NextResponse.json({ ok: true, version });
}
