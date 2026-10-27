// Shared guard for the admin API routes: the signed-in user's id when their role is "admin", else null.
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function requireAdmin(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return null;
  const { data } = await getSupabaseAdmin().from("users").select("role").eq("id", userId).single();
  if (data?.role !== "admin") return null;
  return userId;
}
