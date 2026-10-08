// POST /api/settings/profile/password — { currentPassword, newPassword } for email accounts.
// Google / GitHub accounts without a password set one through "Forgot password".
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { hashPassword, verifyPassword } from "@/lib/password";
import { rateLimit, clientKey } from "@/lib/rateLimit";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const id = (session?.user as { id?: string } | undefined)?.id;
  if (!id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const limit = rateLimit(clientKey(req, `change-password:${id}`), 5, 60_000);
  if (!limit.ok) {
    return NextResponse.json({ error: "Too many attempts. Please try again shortly." }, { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } });
  }

  let currentPassword = "";
  let newPassword = "";
  try {
    const body = (await req.json()) as { currentPassword?: unknown; newPassword?: unknown };
    currentPassword = typeof body.currentPassword === "string" ? body.currentPassword : "";
    newPassword = typeof body.newPassword === "string" ? body.newPassword : "";
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (newPassword.length < 8) return NextResponse.json({ error: "weak" }, { status: 400 });

  const db = getSupabaseAdmin();
  const { data } = await db.from("users").select("password_hash").eq("id", id).single();
  if (!data?.password_hash) return NextResponse.json({ error: "no-password" }, { status: 400 });
  const { valid } = await verifyPassword(currentPassword, data.password_hash);
  if (!valid) return NextResponse.json({ error: "wrong-current" }, { status: 400 });

  const { error } = await db.from("users").update({ password_hash: await hashPassword(newPassword) }).eq("id", id);
  if (error) return NextResponse.json({ error: "Save failed" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
