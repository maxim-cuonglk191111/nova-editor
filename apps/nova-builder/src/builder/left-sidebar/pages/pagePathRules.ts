// Pure validation for a page URL path — shared by the "+ Page" form and inline rename
// so both apply the same rules (SOLID S/D: no React, no atoms).

export type PathIssue = "required" | "reserved" | "collision";

type PathOwner = { id: string; path: string };

/** "about" -> "/about", "" -> "" (an empty path stays empty so it can be flagged). */
export function normalizePagePath(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

/** Why `raw` cannot be used as the path of page `selfId` (or of a new page), or null. */
export function pathIssue(raw: string, pages: PathOwner[], selfId?: string): PathIssue | null {
  const path = normalizePagePath(raw);
  if (!path) return "required";
  const taken = pages.some((p) => p.id !== selfId && p.path === path);
  if (!taken) return null;
  return path === "/" ? "reserved" : "collision";
}
