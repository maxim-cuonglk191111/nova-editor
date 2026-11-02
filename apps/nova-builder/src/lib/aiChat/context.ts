// Turns the canvas selection into what the AI is told about the page: a scope (the element, its
// section or the whole page) and a compact copy of that part of the tree. Pure: the data comes
// in as arguments, so it is tested without the editor.
import type { Instance, Prop, StyleDecl, StyleSourceSelection } from "@webstudio-is/sdk";
import type { ContextNode, EditContext } from "@studio/ai";
import type { ChatContextRef, ChatScope } from "./types";

export type DocView = {
  instances: Map<string, Instance>;
  props: Map<string, Prop>;
  styles: Map<string, StyleDecl>;
  styleSourceSelections: Map<string, StyleSourceSelection>;
};

export type PageView = { id: string; name: string; rootInstanceId: string };

/** What a request can carry: the tree is cut here so it fits a free tier. */
export const MAX_CONTEXT_NODES = 120;
const MAX_TEXT = 160;

const LOOK_STYLES = ["color", "backgroundColor", "background", "fontSize", "fontWeight", "fontFamily", "textAlign", "padding", "gap", "borderRadius"];
const SHOWN_PROPS = ["href", "src", "alt", "tag", "placeholder"];

const labelOf = (inst: Instance) => inst.label?.trim() || inst.component;
const rgba = (r: number, g: number, b: number, a: number) => (a >= 1 ? `rgb(${r}, ${g}, ${b})` : `rgba(${r}, ${g}, ${b}, ${a})`);

/** Instance id → parent id, over the whole document. */
export function parentMap(instances: Map<string, Instance>): Map<string, string> {
  const parents = new Map<string, string>();
  for (const inst of instances.values()) {
    for (const child of inst.children) if (child.type === "id") parents.set(child.value, inst.id);
  }
  return parents;
}

/** The top-level section (a child of the page root) that holds `id`, or `id` itself when it is one. */
export function sectionOf(id: string, rootId: string, parents: Map<string, string>): string | undefined {
  let cur: string | undefined = id;
  for (let hops = 0; cur && hops < 200; hops++) {
    const parent = parents.get(cur);
    if (parent === rootId) return cur;
    cur = parent;
  }
  return undefined;
}

export function sectionsOf(doc: DocView, rootId: string): { id: string; label: string }[] {
  const root = doc.instances.get(rootId);
  return (root?.children ?? []).flatMap((c) => {
    const inst = c.type === "id" ? doc.instances.get(c.value) : undefined;
    return inst ? [{ id: inst.id, label: labelOf(inst) }] : [];
  });
}

function localStyles(doc: DocView, id: string, baseBreakpointId: string): Record<string, string> {
  const sourceId = doc.styleSourceSelections.get(id)?.values[0];
  if (!sourceId) return {};
  const out: Record<string, string> = {};
  for (const prop of LOOK_STYLES) {
    const decl = doc.styles.get(`${sourceId}:${baseBreakpointId}::${prop}`);
    const v = decl?.value as { type?: string; value?: unknown; unit?: string; r?: number; g?: number; b?: number; alpha?: number } | undefined;
    if (!v) continue;
    if (v.type === "keyword" && typeof v.value === "string") out[prop] = v.value;
    else if (v.type === "unit" && typeof v.value === "number") out[prop] = `${v.value}${v.unit === "number" || !v.unit ? "" : v.unit}`;
    else if (v.type === "rgb" && typeof v.r === "number") out[prop] = rgba(v.r, v.g ?? 0, v.b ?? 0, v.alpha ?? 1);
    else if (v.type === "color" && v.value && typeof v.value === "object") {
      const c = v.value as { r: number; g: number; b: number; alpha?: number };
      out[prop] = rgba(c.r, c.g, c.b, c.alpha ?? 1);
    }
  }
  return out;
}

function nodeOf(doc: DocView, inst: Instance, baseBreakpointId: string): ContextNode {
  const textChild = inst.children.find((c) => c.type === "text");
  const hasChildren = inst.children.some((c) => c.type === "id");
  const props: Record<string, string> = {};
  for (const p of doc.props.values()) {
    if (p.instanceId === inst.id && SHOWN_PROPS.includes(p.name) && p.type === "string" && p.value) props[p.name] = String(p.value).slice(0, 200);
  }
  const styles = localStyles(doc, inst.id, baseBreakpointId);
  return {
    id: inst.id,
    component: inst.component,
    ...(inst.label ? { label: inst.label } : {}),
    ...(textChild && !hasChildren ? { text: String(textChild.value).slice(0, MAX_TEXT) } : {}),
    ...(Object.keys(props).length ? { props } : {}),
    ...(Object.keys(styles).length ? { styles } : {}),
    ...(hasChildren ? { children: inst.children.flatMap((c) => (c.type === "id" ? [c.value] : [])) } : {}),
  };
}

/** The subtree under `startId` in document order, cut at MAX_CONTEXT_NODES. */
function subtree(doc: DocView, startId: string, baseBreakpointId: string): ContextNode[] {
  const nodes: ContextNode[] = [];
  const seen = new Set<string>();
  const walk = (id: string) => {
    if (seen.has(id) || nodes.length >= MAX_CONTEXT_NODES) return;
    seen.add(id);
    const inst = doc.instances.get(id);
    if (!inst) return;
    nodes.push(nodeOf(doc, inst, baseBreakpointId));
    for (const c of inst.children) if (c.type === "id") walk(c.value);
  };
  walk(startId);
  return nodes;
}

const WIDER: Record<ChatScope, ChatScope> = { element: "section", section: "page", page: "page" };

/**
 * `selectedId` is what is selected on the canvas; `maxScope` lets the user widen the context by
 * removing chips (element → section → page). Returns both the chips (`ref`) and the request body.
 */
export function buildEditContext(
  doc: DocView,
  page: PageView,
  selectedId: string | undefined,
  baseBreakpointId: string,
  maxScope: ChatScope = "element"
): { ref: ChatContextRef; context: EditContext } {
  const parents = parentMap(doc.instances);
  const sections = sectionsOf(doc, page.rootInstanceId);
  const inPage = selectedId && selectedId !== page.rootInstanceId ? sectionOf(selectedId, page.rootInstanceId, parents) : undefined;

  let scope: ChatScope = "page";
  if (selectedId && inPage) scope = selectedId === inPage ? "section" : "element";
  // The user removed the element chip (or both): go up the ladder, never down.
  const order: ChatScope[] = ["element", "section", "page"];
  while (order.indexOf(scope) < order.indexOf(maxScope)) scope = WIDER[scope];

  const sectionId = scope === "page" ? undefined : inPage;
  const targetId = scope === "element" ? selectedId : scope === "section" ? sectionId : undefined;
  const startId = sectionId ?? page.rootInstanceId;
  const nodes = subtree(doc, startId, baseBreakpointId);
  // The page-level context lists the sections (they are the thing a page-wide request changes).
  if (scope === "page" && nodes.length >= MAX_CONTEXT_NODES) nodes.length = MAX_CONTEXT_NODES;

  const target = targetId ? doc.instances.get(targetId) : undefined;
  const section = sectionId ? doc.instances.get(sectionId) : undefined;
  const ref: ChatContextRef = {
    scope,
    pageId: page.id,
    pageName: page.name,
    ...(targetId && target ? { targetId, targetLabel: labelOf(target) } : {}),
    ...(sectionId && section ? { sectionId, sectionLabel: labelOf(section) } : {}),
  };
  return {
    ref,
    context: { scope, pageName: page.name, rootId: page.rootInstanceId, sections, ...(targetId ? { targetId } : {}), nodes },
  };
}
