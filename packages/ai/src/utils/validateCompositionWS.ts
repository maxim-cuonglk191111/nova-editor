// Convert the composerAgentWS simplified tree output into proper WebstudioData
// maps (Instance[], Prop[], StyleDecl[], StyleSource[], StyleSourceSelection[]).
//
// The AI outputs a simplified "tree" with inline styles as flat CSS property/
// value strings. This converter:
//   1. Reassigns fresh inst_<8> IDs (never trusts AI IDs)
//   2. Builds normalized Instance records with {type:"id",value:id} child refs
//   3. Creates a StyleSource("local") per instance that has styles
//   4. Converts flat CSS string values to WS StyleValue objects (best-effort)
//   5. Creates StyleDecl records per style property
//   6. Creates StyleSourceSelection per instance
//   7. Creates Prop records for component props and text content
//   8. Rewrites fixed desktop sizes into fluid ones (makeResponsive)
import { makeResponsive } from "./responsiveStyles.js";
import { addMobileNavbarStyles } from "./mobileNavbar.js";

// ─── WS type shapes (inline to avoid a runtime dep on ws-sdk in this package) ─

type ChildRef = { type: "id"; value: string } | { type: "text"; value: string };

interface WSInstance {
  type: "instance";
  id: string;
  component: string;
  label?: string;
  children: ChildRef[];
}

interface WSProp {
  id: string;
  instanceId: string;
  name: string;
  type: "string" | "number" | "boolean" | "json";
  value: unknown;
}

type StyleValue =
  | { type: "keyword"; value: string }
  | { type: "unit"; value: number; unit: string }
  | { type: "color"; value: { r: number; g: number; b: number; alpha: number } };

interface WSStyleDecl {
  styleSourceId: string;
  breakpointId: string;
  property: string;
  value: StyleValue;
}

interface WSStyleSource {
  id: string;
  type: "local";
}

interface WSStyleSourceSelection {
  instanceId: string;
  values: string[];
}

export interface WSCompositionResult {
  instances: WSInstance[];
  props: WSProp[];
  styleSources: WSStyleSource[];
  styleSourceSelections: WSStyleSourceSelection[];
  styles: WSStyleDecl[];
  usedComponents: string[];
  droppedComponents: string[];
  rootIds: string[];
}

// ─── ID generator ──────────────────────────────────────────────────────────────

function genId(prefix: string): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let s = "";
  for (let i = 0; i < 8; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return `${prefix}${s}`;
}

// ─── StyleValue converter ──────────────────────────────────────────────────────

const UNIT_RE = /^(-?[\d.]+)(px|em|rem|%|vw|vh|vmin|vmax|pt|cm|mm|in|ch|ex|fr)$/;

function parseColor(hex: string): { r: number; g: number; b: number; alpha: number } | null {
  const h = hex.replace(/^#/, "");
  if (h.length === 3) {
    return {
      r: parseInt(h[0]! + h[0]!, 16),
      g: parseInt(h[1]! + h[1]!, 16),
      b: parseInt(h[2]! + h[2]!, 16),
      alpha: 1,
    };
  }
  if (h.length === 6) {
    return {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16),
      alpha: 1,
    };
  }
  return null;
}

function cssStringToStyleValue(css: string): StyleValue {
  const trimmed = css.trim();

  // Hex colors
  if (/^#[0-9a-fA-F]{3,8}$/.test(trimmed)) {
    const color = parseColor(trimmed);
    if (color) return { type: "color", value: color };
  }

  // Unit values (16px, 1.5rem, 100%, etc.)
  const unitMatch = UNIT_RE.exec(trimmed);
  if (unitMatch) {
    return { type: "unit", value: parseFloat(unitMatch[1]!), unit: unitMatch[2]! };
  }

  // Bare numbers → unitless
  if (/^-?[\d.]+$/.test(trimmed)) {
    return { type: "unit", value: parseFloat(trimmed), unit: "" };
  }

  // Everything else: keyword (includes shorthands, rgba(), named colors, etc.)
  return { type: "keyword", value: trimmed };
}

// ─── Known components and mappings ───────────────────────────────────────────

const COMPONENT_MAPPING: Record<string, string> = {
  Box: "Box",
  Heading: "Heading",
  Paragraph: "Paragraph",
  Bold: "Bold",
  Italic: "Italic",
  Link: "Link",
  Button: "shadcn:Button",
  Image: "Image",
  Input: "shadcn:Input",
  Label: "Label",
  Form: "Form",
  List: "List",
  ListItem: "ListItem",
  Card: "shadcn:Card",
  Badge: "shadcn:Badge",
  Switch: "shadcn:Switch",
  Checkbox: "shadcn:Checkbox",
  Avatar: "shadcn:Avatar",
};

const KNOWN_COMPONENTS = new Set(Object.keys(COMPONENT_MAPPING));

// ─── Main converter ───────────────────────────────────────────────────────────

type AINode = {
  id?: unknown;
  component?: unknown;
  label?: unknown;
  props?: unknown;
  styles?: unknown;
  text?: unknown;
  children?: unknown;
};

// A page needs exactly one h1 (SEO + accessibility). Models emit none (only h2s)
// or several (a logo h1 in the navbar plus the hero title). Keep the first h1
// outside the navbar — else the first h1, else promote the first heading — and
// demote every other h1 to h2.
function ensureSingleH1(instances: WSInstance[], props: WSProp[], rootIds: string[]): void {
  const byId = new Map(instances.map((i) => [i.id, i]));
  const tagOf = (id: string) => props.find((p) => p.instanceId === id && p.name === "tag");
  const setTag = (id: string, value: string) => {
    const tag = tagOf(id);
    if (tag) tag.value = value;
    else props.push({ id: genId("prop_"), instanceId: id, name: "tag", type: "string", value });
  };

  // Headings in document order, each with the top-level section it sits in.
  const headings: { id: string; section: string }[] = [];
  for (const section of rootIds) {
    const stack = [section];
    while (stack.length > 0) {
      const id = stack.pop()!;
      if (byId.get(id)?.component === "Heading") headings.push({ id, section });
      const children = byId.get(id)?.children ?? [];
      for (let i = children.length - 1; i >= 0; i--) {
        const child = children[i]!;
        if (child.type === "id") stack.push(child.value);
      }
    }
  }
  if (headings.length === 0) return;

  const isNavbar = (sectionId: string) => {
    const tag = tagOf(sectionId)?.value;
    return tag === "header" || tag === "nav" || /nav|header/i.test(byId.get(sectionId)?.label ?? "");
  };
  const h1s = headings.filter((h) => tagOf(h.id)?.value === "h1");
  const keep = h1s.find((h) => !isNavbar(h.section)) ?? h1s[0] ?? headings.find((h) => !isNavbar(h.section)) ?? headings[0]!;

  setTag(keep.id, "h1");
  for (const h of h1s) if (h.id !== keep.id) setTag(h.id, "h2");
}

// The prompt lists curated images by Unsplash id; models sometimes return the
// bare id instead of the full URL.
export function expandImageSrc(src: unknown): unknown {
  if (typeof src !== "string") return src;
  const id = src.trim();
  return /^photo-[\w-]+$/.test(id)
    ? `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1000&q=80`
    : src;
}

export function validateCompositionWS(raw: unknown): WSCompositionResult {
  const instances: WSInstance[] = [];
  const props: WSProp[] = [];
  const styleSources: WSStyleSource[] = [];
  const styleSourceSelections: WSStyleSourceSelection[] = [];
  const styles: WSStyleDecl[] = [];
  const usedComponents = new Set<string>();
  const droppedComponents = new Set<string>();
  const rootIds: string[] = [];

  // Every node in the tree gets its own fresh ID. The AI's IDs are ignored
  // entirely: models reuse IDs across nodes, and mapping by AI ID made one
  // instance appear under several parents (forms/footers rendered inside the
  // hero, even parent cycles).
  function walk(nodes: unknown[]): string[] {
    const childIds: string[] = [];
    for (const node of nodes) {
      if (!node || typeof node !== "object" || Array.isArray(node)) continue;
      const n = node as AINode;
      const rawComponent = typeof n.component === "string" ? n.component : "";
      if (!KNOWN_COMPONENTS.has(rawComponent)) {
        if (rawComponent) droppedComponents.add(rawComponent);
        continue;
      }
      const component = COMPONENT_MAPPING[rawComponent]!;

      const instanceId = genId("inst_");
      usedComponents.add(component);

      // Recurse children first to get child IDs
      const subIds = Array.isArray(n.children) ? walk(n.children as unknown[]) : [];

      // Build child refs — add inline text as a text child ref
      const childRefs: ChildRef[] = subIds.map((id) => ({ type: "id" as const, value: id }));
      const text = typeof n.text === "string" ? n.text.trim() : "";
      if (text) {
        childRefs.push({ type: "text", value: text });
      }

      // Instance
      const instance: WSInstance = {
        type: "instance",
        id: instanceId,
        component,
        label: typeof n.label === "string" ? n.label : rawComponent,
        children: childRefs,
      };
      instances.push(instance);

      // Props
      if (n.props && typeof n.props === "object" && !Array.isArray(n.props)) {
        for (const [key, rawVal] of Object.entries(n.props as Record<string, unknown>)) {
          if (rawVal === null || rawVal === undefined) continue;
          const val = key === "src" ? expandImageSrc(rawVal) : rawVal;
          props.push({
            id: genId("prop_"),
            instanceId,
            name: key,
            type: typeof val === "number" ? "number" : typeof val === "boolean" ? "boolean" : "string",
            value: val,
          });
        }
      }

      // Styles → StyleSource + StyleDecl + StyleSourceSelection
      const styleProps = makeResponsive(
        n.styles && typeof n.styles === "object" && !Array.isArray(n.styles)
          ? (n.styles as Record<string, unknown>)
          : {}
      );

      const styleEntries = Object.entries(styleProps).filter(([, v]) => v !== null && v !== undefined && v !== "");

      if (styleEntries.length > 0) {
        const sourceId = genId("src_");
        styleSources.push({ id: sourceId, type: "local" });
        styleSourceSelections.push({ instanceId, values: [sourceId] });

        for (const [property, val] of styleEntries) {
          styles.push({
            styleSourceId: sourceId,
            breakpointId: "base",
            property,
            value: cssStringToStyleValue(String(val)),
          });
        }
      }

      childIds.push(instanceId);
    }
    return childIds;
  }

  const tree =
    raw &&
    typeof raw === "object" &&
    !Array.isArray(raw) &&
    Array.isArray((raw as Record<string, unknown>).tree)
      ? ((raw as Record<string, unknown>).tree as unknown[])
      : [];

  const topIds = walk(tree);
  rootIds.push(...topIds);
  ensureSingleH1(instances, props, rootIds);
  addMobileNavbarStyles({ instances, props, styleSources, styleSourceSelections, styles }, genId);

  return {
    instances,
    props,
    styleSources,
    styleSourceSelections,
    styles,
    usedComponents: [...usedComponents],
    droppedComponents: [...droppedComponents],
    rootIds,
  };
}
