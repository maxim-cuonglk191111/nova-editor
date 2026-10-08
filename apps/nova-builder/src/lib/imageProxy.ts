// Serves an image for wsImageLoader URLs (/cgi/image/<src>?width=…). Shared by
// app/cgi/image/[...slug] and app/api/cgi/image. Public: visitors of a shared
// preview are not signed in, so it must never serve anything but images.
import { NextResponse } from "next/server";

type Fit = "cover" | "contain" | "fill";

// Hosts that resize on their own: redirect instead of proxying (no Worker CPU or bandwidth).
const UNSPLASH = /^https:\/\/(images|plus)\.unsplash\.com\//;

export async function serveImage(src: string, params: URLSearchParams): Promise<Response> {
  const width = params.get("width") ?? params.get("w");
  const height = params.get("height") ?? params.get("h");
  const quality = params.get("quality") ?? "80";
  const format = params.get("format") ?? "auto";
  const fit = (params.get("fit") ?? "cover") as Fit;

  const assetBase = process.env.NEXT_PUBLIC_ASSET_BASE_URL ?? "";
  const isTrusted =
    src.startsWith("/") ||
    (assetBase !== "" && src.startsWith(assetBase)) ||
    src.startsWith("https://imagedelivery.net/") ||
    src.startsWith("https://ik.imagekit.io/") ||
    src.startsWith("https://uploadthing.com/") ||
    src.startsWith("https://pub-") || // Cloudflare R2 public bucket pattern
    UNSPLASH.test(src) ||
    (assetBase === "" && src.startsWith("https://"));
  if (!isTrusted) {
    console.warn("[cgi/image] Blocked untrusted src:", src.slice(0, 100));
    return new NextResponse("Untrusted image source", { status: 403 });
  }

  if (UNSPLASH.test(src)) {
    try {
      const u = new URL(src);
      if (width) u.searchParams.set("w", width);
      if (height) u.searchParams.set("h", height);
      if (quality !== "auto") u.searchParams.set("q", quality);
      u.searchParams.set("auto", "format");
      return NextResponse.redirect(u.toString(), { status: 302, headers: { "cache-control": "public, max-age=86400" } });
    } catch { /* malformed — fall through to the passthrough */ }
  }

  if (src.startsWith("https://ik.imagekit.io/")) {
    try {
      const ikUrl = new URL(src);
      const transforms: string[] = [];
      if (width) transforms.push(`w-${width}`);
      if (height) transforms.push(`h-${height}`);
      if (quality && quality !== "auto") transforms.push(`q-${quality}`);
      if (format && format !== "auto" && format !== "webp") transforms.push(`f-${format}`);
      if (fit === "contain") transforms.push("cm-pad_resize");
      else if (fit === "fill") transforms.push("cm-fill");
      if (transforms.length > 0) ikUrl.searchParams.set("tr", transforms.join(","));
      return NextResponse.redirect(ikUrl.toString(), { status: 302, headers: { "cache-control": "public, max-age=86400" } });
    } catch { /* malformed — fall through to the passthrough */ }
  }

  const cfAccountHash = process.env.CF_IMAGES_ACCOUNT_HASH;
  if (cfAccountHash && assetBase && src.startsWith(assetBase)) {
    const objectKey = src.slice(assetBase.length).replace(/^\//, "");
    const cfUrl = `https://imagedelivery.net/${cfAccountHash}/${encodeURIComponent(objectKey)}/w=${width ?? ""},h=${height ?? ""},fit=${fit},f=auto`;
    return NextResponse.redirect(cfUrl, { status: 302 });
  }

  // Passthrough (no resize). Only images are forwarded — never an open proxy for other content.
  try {
    const upstream = await fetch(src, { headers: { "User-Agent": "nova-builder/image-proxy" } });
    if (!upstream.ok) {
      console.error("[cgi/image] upstream error", upstream.status, src.slice(0, 80));
      return new NextResponse(`Upstream error: ${upstream.status}`, { status: upstream.status });
    }
    const contentType = upstream.headers.get("content-type") ?? "";
    if (!contentType.startsWith("image/")) return new NextResponse("Not an image", { status: 415 });
    if (!upstream.body) return new NextResponse("Empty upstream", { status: 502 });
    return new NextResponse(upstream.body, {
      status: 200,
      headers: { "content-type": contentType, "cache-control": "public, max-age=31536000, immutable" },
    });
  } catch (err) {
    console.error("[cgi/image] fetch failed:", src.slice(0, 80), err);
    return new NextResponse("Failed to fetch image", { status: 502 });
  }
}
