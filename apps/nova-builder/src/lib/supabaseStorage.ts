// Asset storage on Supabase Storage — the default upload backend (R2 is the
// fallback), so uploads work with only the Supabase credentials every
// deployment already has. Files live in a public "assets" bucket, created on
// first use.
import { getSupabase } from "@/lib/supabase-server";

const BUCKET = "assets";

async function ensureBucket(): Promise<void> {
  const storage = getSupabase().storage;
  const { data } = await storage.getBucket(BUCKET);
  if (data) return;
  const { error } = await storage.createBucket(BUCKET, { public: true });
  if (error && !/already exists/i.test(error.message)) throw new Error(`createBucket: ${error.message}`);
}

/** Uploads and returns the file's public URL. */
export async function uploadToSupabaseStorage(key: string, data: Buffer, contentType: string): Promise<string> {
  const storage = getSupabase().storage.from(BUCKET);
  const put = () => storage.upload(key, data, { contentType, upsert: true });
  let { error } = await put();
  if (error && /bucket not found/i.test(error.message)) {
    await ensureBucket();
    ({ error } = await put());
  }
  if (error) throw new Error(`Supabase Storage upload: ${error.message}`);
  return storage.getPublicUrl(key).data.publicUrl;
}

export async function deleteFromSupabaseStorage(key: string): Promise<void> {
  const { error } = await getSupabase().storage.from(BUCKET).remove([key]);
  if (error) throw new Error(`Supabase Storage delete: ${error.message}`);
}
