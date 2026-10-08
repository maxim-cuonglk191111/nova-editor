import { NextResponse } from "next/server";
import { serveImage } from "@/lib/imageProxy";

// Catch-all route for wsImageLoader-generated URLs:
//   /cgi/image/<encodePathFragment(src)>?width=800&quality=80&format=auto
// encodePathFragment = encodeURIComponent(src).replace(/%2F/g, "/"), so
// "https://host/a.png" becomes "https%3A//host/a.png", which path normalization
// turns into "https%3A/host/a.png". Next.js passes the decoded segments in params.slug.

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const { slug } = await params;
  if (!slug || slug.length === 0) {
    return new NextResponse("Missing src", { status: 400 });
  }

  // slug = ["https:", "host", "path", "file.png"] — rebuild "https://host/path/file.png".
  let src: string;
  const first = slug[0];
  if (first === "https:" || first === "http:") {
    src = first + "//" + slug.slice(1).join("/");
  } else if (first.startsWith("https%3A") || first.startsWith("http%3A")) {
    src = decodeURIComponent(first) + "//" + slug.slice(1).join("/");
  } else {
    src = slug.join("/");
    if (!src.startsWith("/")) src = "/" + src;
  }

  return serveImage(src, new URL(req.url).searchParams);
}
