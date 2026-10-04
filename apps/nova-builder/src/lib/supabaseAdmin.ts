// Single canonical server-side Supabase admin client.
// All API routes import getSupabaseAdmin() from here — never define a local copy.
// Delegates to supabase-server's getSupabase(), which accepts both env spellings
// (SUPABASE_URL / NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_KEY /
// SUPABASE_SERVICE_ROLE_KEY). The Worker only defines the SUPABASE_* pair, so
// reading NEXT_PUBLIC_SUPABASE_URL alone crashed every route using this helper.
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabase } from "@/lib/supabase-server";

export function getSupabaseAdmin(): SupabaseClient {
  return getSupabase();
}
