// R2 via its S3-compatible API, signed with aws4fetch (a few KB) instead of
// @aws-sdk/client-s3 (~3 MB in the Worker bundle for two calls).
import { AwsClient } from "aws4fetch";

export type NovaAsset = {
  id: string;
  name: string;
  type: "image" | "font" | "file";
  format: string;
  size: number;
  url: string;
  key: string;           // R2 key OR ImageKit fileId (stored for deletion)
  createdAt: string;
  // image dimensions
  width?: number;
  height?: number;
  // font metadata (populated when type === "font")
  fontFamily?: string;
  fontWeight?: number;
  fontStyle?: "normal" | "italic" | "oblique";
  // folder system (optional — assets without folderId appear at root)
  folderId?: string | null;
  // ImageKit-specific: kept so DELETE route can call deleteFromImageKit(imagekitFileId)
  imagekitFileId?: string;
};

function getR2(): { client: AwsClient; objectUrl: (key: string) => string } {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET_NAME;
  if (!accountId || !accessKeyId || !secretAccessKey || !bucket) {
    throw new Error(
      "R2 not configured — set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME"
    );
  }
  return {
    client: new AwsClient({ accessKeyId, secretAccessKey, service: "s3", region: "auto" }),
    objectUrl: (key) =>
      `https://${accountId}.r2.cloudflarestorage.com/${bucket}/${key.split("/").map(encodeURIComponent).join("/")}`,
  };
}

async function r2Request(method: "PUT" | "DELETE", key: string, init?: { body: Buffer; contentType: string }): Promise<void> {
  const { client, objectUrl } = getR2();
  const res = await client.fetch(objectUrl(key), {
    method,
    ...(init ? { body: init.body, headers: { "Content-Type": init.contentType } } : {}),
  });
  if (!res.ok) throw new Error(`R2 ${method} ${res.status}: ${(await res.text()).slice(0, 200)}`);
}

export function makeAssetKey(projectId: string, assetId: string, filename: string): string {
  return `assets/${projectId}/${assetId}/${filename}`;
}

export function assetPublicUrl(key: string): string {
  const base = process.env.NEXT_PUBLIC_ASSET_BASE_URL?.replace(/\/$/, "") ?? "";
  return `${base}/${key}`;
}

export async function uploadToR2(key: string, data: Buffer, contentType: string): Promise<void> {
  await r2Request("PUT", key, { body: data, contentType });
}

export async function deleteFromR2(key: string): Promise<void> {
  await r2Request("DELETE", key);
}
