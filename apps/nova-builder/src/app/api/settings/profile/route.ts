// GET   /api/settings/profile — display name, email, how the user signs in.
// PATCH /api/settings/profile — { displayName }.
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

const MAX_NAME = 80;

async function userId() {
  const session = await getServerSession(authOptions);
  return (session?.user as { id?: string } | undefined)?.id ?? null;
}

export async function GET() {
  const id = await userId();
  if (!id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data } = await getSupabaseAdmin()
    .from("users")
    .select("email, display_name, provider, password_hash")
    .eq("id", id)
    .single();
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({
    email: data.email,
    displayName: data.display_name ?? "",
    provider: data.provider ?? "email",
    hasPassword: Boolean(data.password_hash),
  });
}

export async function PATCH(req: Request) {
  const id = await userId();
  if (!id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let displayName = "";
  try {
    const body = (await req.json()) as { displayName?: unknown };
    displayName = typeof body.displayName === "string" ? body.displayName.trim() : "";
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!displayName || displayName.length > MAX_NAME) {
    return NextResponse.json({ error: `Name must be 1–${MAX_NAME} characters.` }, { status: 400 });
  }
  const { error } = await getSupabaseAdmin().from("users").update({ display_name: displayName }).eq("id", id);
  if (error) return NextResponse.json({ error: "Save failed" }, { status: 500 });
  return NextResponse.json({ ok: true, displayName });
}
