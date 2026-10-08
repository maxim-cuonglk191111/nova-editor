import { NextResponse } from "next/server";
import { serveImage } from "@/lib/imageProxy";

// Image proxy for wsImageLoader URLs rewritten by next.config.mjs:
//   /cgi/image/:src* → /api/cgi/image?src=:src*  (width, quality, format, height, fit kept)
// ADR-NB-003: /canvas and shared previews are public, so this route is too (images only).

export async function GET(req: Request) {
  const url = new URL(req.url);
  let src = url.searchParams.get("src");
  if (!src) return new NextResponse("Missing src", { status: 400 });

  try {
    src = decodeURIComponent(src);
  } catch {
    // leave as-is if decoding fails
  }
  // Path normalization strips one slash: "https:/foo" → "https://foo".
  src = src.replace(/^(https?):\/([^/])/, "$1://$2");

  return serveImage(src, url.searchParams);
}
