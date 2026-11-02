// Demo accounts for seeding, each a different kind of person with a different goal and a
// site that does not look like the others: a personal blog, a one-person SaaS, a street-food
// stall, a photographer's portfolio, a podcast, a bakery and a café. Each is written in the same compact tree the
// AI composer returns, converted by the app's own validateCompositionWS and merged into a
// project document exactly as applyWSComposition does, so a seeded project has the same shape
// as one a user generated and the preview page reads it through the normal path.
//
// Photos are Vietnamese places and dishes from Wikimedia Commons. Fonts are system stacks
// so the preview, an export and a published site all draw the same.
import { validateCompositionWS } from "@studio/ai";
import { emptyProjectSchema } from "../emptyProject";
import type { Tree, SeedContext } from "./builders";
import { maiBlog } from "./sites/maiBlog";
import { tabbySaas } from "./sites/tabbySaas";
import { bepBaTu } from "./sites/bepBaTu";
import { hungPhoto } from "./sites/hungPhoto";
import { noiNham } from "./sites/noiNham";
import { vyvyBakery } from "./sites/vyvyBakery";
import { ovemoCafe } from "./sites/ovemoCafe";

export type { SeedContext } from "./builders";

export type DemoSite = {
  slug: string;
  /** Project name shown in the dashboard. */
  name: string;
  email: string;
  displayName: string;
  /** Who this person is and what the site is for (shown by the seed script). */
  purpose: string;
  tree: (ctx: SeedContext) => Tree[];
  /** Files in scripts/seed-assets/<slug>/ that the seed uploads to the "assets" bucket as seed/<slug>/<file>. */
  assets?: string[];
  /** Set when this person bought a plan (written by `seed-demo.mjs --sales`, provider "demo"). */
  purchase?: { plan: "pro" };
  /** Taken out of the demo set: skipped by the seed, removed from the database by `--retire`. */
  retired?: boolean;
};


/** Stand-in used by tests; the seed script passes the real Supabase project's URL. */
export const PLACEHOLDER_CONTEXT: SeedContext = { assetBase: "https://example.supabase.co/storage/v1/object/public/assets/seed" };

export const DEMO_SITES: DemoSite[] = [
  { slug: "mai-viet", name: "Mai viết — blog cá nhân", email: "demo.mai-viet@nova-demo.test", displayName: "Mai", purpose: "Personal blog: a nurse in Huế writing slowly about small things", tree: maiBlog },
  { slug: "tabby", name: "Tabby — to-do list that nags kindly", email: "demo.tabby@nova-demo.test", displayName: "Khoa", purpose: "One-person SaaS: product page with pricing", tree: tabbySaas, purchase: { plan: "pro" } },
  { slug: "bep-ba-tu", name: "Bếp Bà Tư — bún riêu", email: "demo.bep-ba-tu@nova-demo.test", displayName: "Bà Tư", purpose: "Small local business: a street-food stall that never had a website", tree: bepBaTu, purchase: { plan: "pro" } },
  { slug: "hung-le", name: "Hùng Lê — nhiếp ảnh", email: "demo.hung-le@nova-demo.test", displayName: "Hùng Lê", purpose: "Freelancer: a photographer's portfolio and booking page", tree: hungPhoto, retired: true },
  { slug: "noi-nham", name: "Nói nhảm lúc 2 giờ sáng — podcast", email: "demo.noi-nham@nova-demo.test", displayName: "Vy & Nam", purpose: "Creator: an indie podcast with episodes and a listener inbox", tree: noiNham, retired: true },
  { slug: "vyvy", name: "Tiệm bánh VyVy — landing page", email: "demo.vyvy@nova-demo.test", displayName: "VyVy", purpose: "Local bakery in Quy Nhơn: cakes and snacks with prices, how to order, refund policy", tree: vyvyBakery, purchase: { plan: "pro" } },
  { slug: "ovemo", name: "Ovemo — Over The Moon", email: "demo.ovemo@nova-demo.test", displayName: "Ovemo", purpose: "Coffee and tea shop in Quy Nhơn Nam: full menu with M/L prices, toppings, hours and phones", tree: ovemoCafe, assets: ["ovemo-tra-sua.jpg", "ovemo-matcha.jpg", "ovemo-cacao.jpg", "ovemo-logo.png"], purchase: { plan: "pro" } },
];

// ── tree → project document ───────────────────────────────────────────────────

type Entries = [string, unknown][];

/** The `schema_json` stored for a project: an empty 5.0 document with the composed page merged in. */
export function buildProjectSchema(site: DemoSite, now: string, ctx: SeedContext = PLACEHOLDER_CONTEXT): Record<string, unknown> {
  const doc = emptyProjectSchema(site.name, now) as { data: Record<string, unknown> } & Record<string, unknown>;
  const data = doc.data;
  const composed = validateCompositionWS({ tree: site.tree(ctx) });

  const breakpoints = data.breakpoints as [string, { id: string; maxWidth?: number }][];
  const baseBp = breakpoints[0]![0];
  const mobileBp = breakpoints.map(([, bp]) => bp).filter((bp) => bp.maxWidth !== undefined && bp.maxWidth <= 767).sort((x, y) => (y.maxWidth ?? 0) - (x.maxWidth ?? 0))[0]?.id;

  const instances = data.instances as Entries;
  const body = instances[0]![1] as { id: string; children: unknown[] };
  body.children = composed.rootIds.map((id) => ({ type: "id", value: id }));
  for (const inst of composed.instances) instances.push([inst.id, inst]);
  for (const prop of composed.props) (data.props as Entries).push([prop.id, prop]);
  for (const src of composed.styleSources) (data.styleSources as Entries).push([src.id, src]);
  for (const sel of composed.styleSourceSelections) (data.styleSourceSelections as Entries).push([sel.instanceId, sel]);
  for (const decl of composed.styles) {
    const raw = decl.breakpointId as string;
    if (raw === "mobile" && !mobileBp) continue;
    const bp = raw === "base" ? baseBp : raw === "mobile" ? mobileBp! : raw;
    (data.styles as Entries).push([`${decl.styleSourceId}:${bp}::${decl.property}`, { ...decl, breakpointId: bp }]);
  }
  return doc;
}
