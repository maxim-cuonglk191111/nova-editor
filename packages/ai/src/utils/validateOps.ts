// The edit agent answers with operations on the page the user is looking at, never with a whole
// new page. This file holds the shapes of that conversation and the checks every answer goes
// through before it reaches the user: unknown ids, odd CSS and unsafe links are dropped, the
// rest becomes a list the user can apply or discard.
import type { WSCompositionResult } from "./validateCompositionWS.js";

// ─── What the client tells the model about the page ───────────────────────────────────────

export type ContextNode = {
  id: string;
  component: string;
  label?: string;
  /** Visible text of a leaf element. */
  text?: string;
  /** A few props worth knowing: href, src, alt, tag. */
  props?: Record<string, string>;
  /** A few CSS values worth knowing (colour, background, size, spacing). */
  styles?: Record<string, string>;
  children?: string[];
};

export type EditContext = {
  scope: "element" | "section" | "page";
  pageName: string;
  /** The page root: it can never be removed. */
  rootId: string;
  /** The top-level sections of the page, in order: where a new section can go. */
  sections: { id: string; label: string }[];
  /** The element or section the user pointed at, when there is one. */
  targetId?: string;
  nodes: ContextNode[];
};

// ─── What the model may do ────────────────────────────────────────────────────────────────

export type StyleMap = Record<string, string>;

export type EditOp =
  | { op: "setText"; id: string; text: string }
  | { op: "setStyle"; id: string; styles: StyleMap }
  | { op: "setProp"; id: string; name: string; value: string }
  | { op: "remove"; id: string }
  /** `after: null` puts the new section first. `composition` is filled in once the section has been composed. */
  | { op: "insertSection"; after: string | null; brief: string; composition?: WSCompositionResult }
  | { op: "replaceSection"; id: string; brief: string; composition?: WSCompositionResult };

export type EditReply = { reply: string; ops: EditOp[]; dropped: string[] };

export const MAX_OPS = 30;
const MAX_REPLY = 600;
const MAX_TEXT = 1500;
const MAX_STYLES_PER_OP = 12;
const MAX_STYLE_VALUE = 200;

// Visual properties only: enough to restyle, nothing that changes behaviour or loads code.
const STYLE_PROPERTIES = new Set([
  "color", "backgroundColor", "background", "opacity",
  "fontSize", "fontWeight", "fontFamily", "fontStyle", "lineHeight", "letterSpacing", "textAlign", "textTransform", "textDecoration",
  "padding", "paddingTop", "paddingRight", "paddingBottom", "paddingLeft",
  "margin", "marginTop", "marginRight", "marginBottom", "marginLeft",
  "gap", "rowGap", "columnGap",
  "width", "minWidth", "maxWidth", "height", "minHeight", "maxHeight",
  "border", "borderTop", "borderBottom", "borderColor", "borderWidth", "borderStyle", "borderRadius", "boxShadow",
  "display", "flexDirection", "flexWrap", "justifyContent", "alignItems", "alignSelf", "objectFit",
]);

const PROP_NAMES = new Set(["alt", "href", "src", "title", "placeholder", "target", "tag"]);
const SAFE_HREF = /^(https?:\/\/|mailto:|tel:|#|\/)/i;
const SAFE_SRC = /^(https:\/\/|photo-[\w-]+$)/i;
const HEADING_TAGS = new Set(["h1", "h2", "h3", "h4", "h5", "h6"]);
const LINK_TARGETS = new Set(["_blank", "_self"]);
// Anything that can pull in a file or run something is refused in a CSS value.
const UNSAFE_CSS = /url\s*\(|expression\s*\(|javascript:|@import|[<>{}]/i;

function cleanString(v: unknown, max: number): string | null {
  if (typeof v !== "string") return null;
  const s = v.trim();
  return s.length > 0 && s.length <= max ? s : null;
}

function cleanStyles(raw: unknown): StyleMap | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const out: StyleMap = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>).slice(0, MAX_STYLES_PER_OP)) {
    if (!STYLE_PROPERTIES.has(key)) continue;
    const v = typeof value === "number" ? String(value) : cleanString(value, MAX_STYLE_VALUE);
    if (v === null || UNSAFE_CSS.test(v)) continue;
    out[key] = v;
  }
  return Object.keys(out).length > 0 ? out : null;
}

function cleanPropValue(name: string, value: unknown): string | null {
  const v = cleanString(value, 500);
  if (v === null) return null;
  if (name === "href") return SAFE_HREF.test(v) ? v : null;
  if (name === "src") return SAFE_SRC.test(v) ? v : null;
  if (name === "tag") return HEADING_TAGS.has(v.toLowerCase()) ? v.toLowerCase() : null;
  if (name === "target") return LINK_TARGETS.has(v) ? v : null;
  return v;
}

/**
 * Checks the model's answer against the page it was given. Ops that point at an id the model was
 * not shown, ask for a property that is not a visual one or carry an unsafe value are dropped (and
 * counted in `dropped`); what is left is safe to show. At most MAX_OPS operations are kept.
 */
export function validateEditReply(raw: unknown, ctx: EditContext): EditReply {
  const obj = raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  const reply = typeof obj.reply === "string" ? obj.reply.trim().slice(0, MAX_REPLY) : "";
  const rawOps = Array.isArray(obj.ops) ? obj.ops : [];

  const ids = new Set(ctx.nodes.map((n) => n.id));
  const textIds = new Set(ctx.nodes.filter((n) => typeof n.text === "string").map((n) => n.id));
  const sectionIds = new Set(ctx.sections.map((s) => s.id));
  const ops: EditOp[] = [];
  const dropped: string[] = [];
  const drop = (why: string) => dropped.push(why);

  for (const item of rawOps) {
    if (ops.length >= MAX_OPS) { drop("too many operations"); break; }
    if (!item || typeof item !== "object" || Array.isArray(item)) { drop("not an object"); continue; }
    const o = item as Record<string, unknown>;
    const id = typeof o.id === "string" ? o.id : "";

    switch (o.op) {
      case "setText": {
        const text = cleanString(o.text, MAX_TEXT);
        if (!textIds.has(id) || text === null) { drop(`setText ${id}`); break; }
        ops.push({ op: "setText", id, text });
        break;
      }
      case "setStyle": {
        const styles = cleanStyles(o.styles);
        if (!ids.has(id) || !styles) { drop(`setStyle ${id}`); break; }
        ops.push({ op: "setStyle", id, styles });
        break;
      }
      case "setProp": {
        const name = typeof o.name === "string" ? o.name : "";
        const value = PROP_NAMES.has(name) ? cleanPropValue(name, o.value) : null;
        if (!ids.has(id) || value === null) { drop(`setProp ${id} ${name}`); break; }
        ops.push({ op: "setProp", id, name, value });
        break;
      }
      case "remove": {
        if (!ids.has(id) || id === ctx.rootId) { drop(`remove ${id}`); break; }
        ops.push({ op: "remove", id });
        break;
      }
      case "insertSection": {
        const brief = cleanString(o.brief, 400);
        const after = typeof o.after === "string" && o.after !== "top" ? o.after : null;
        if (brief === null || (after !== null && !sectionIds.has(after))) { drop("insertSection"); break; }
        ops.push({ op: "insertSection", after, brief });
        break;
      }
      case "replaceSection": {
        const brief = cleanString(o.brief, 400);
        if (brief === null || !sectionIds.has(id)) { drop(`replaceSection ${id}`); break; }
        ops.push({ op: "replaceSection", id, brief });
        break;
      }
      default:
        drop(`unknown op ${String(o.op)}`);
    }
  }
  return { reply, ops, dropped };
}

/** Operations that need a second AI call (a new section) before they can be applied. */
export function needsComposition(op: EditOp): op is Extract<EditOp, { op: "insertSection" | "replaceSection" }> {
  return op.op === "insertSection" || op.op === "replaceSection";
}
