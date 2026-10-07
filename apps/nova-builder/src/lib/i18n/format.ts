/** Replaces `{name}` placeholders in a dictionary string with the given values. */
export function fmt(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in vars ? String(vars[key]) : match,
  );
}

/** Number in the locale's grouping: "500.000" (vi) / "500,000" (en). */
export function formatNumber(n: number, locale: string): string {
  return n.toLocaleString(locale === "vi" ? "vi-VN" : "en-US");
}

/** Relative "x minutes ago" label using the active locale's time strings. */
export function formatTimeAgo(
  iso: string,
  d: { justNow: string; minutesAgo: string; hoursAgo: string; daysAgo: string },
): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return d.justNow;
  if (mins < 60) return fmt(d.minutesAgo, { n: mins });
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return fmt(d.hoursAgo, { n: hrs });
  return fmt(d.daysAgo, { n: Math.floor(hrs / 24) });
}
