// Props and styles that travel with an instance subtree on copy / paste / duplicate.
// Pure: callers pass the current maps and write the returned maps inside updateData.
// Local style sources are re-minted per clone (each copy gets its own styles);
// token sources are shared and kept as long as the target project has them.

import { nanoid } from "nanoid";
import type { Instance, Prop, StyleDecl, StyleSource, StyleSourceSelection } from "@webstudio-is/sdk";

// Same key format as the rest of the app (applyWSComposition, BreakpointManager).
const styleKey = (d: StyleDecl) => `${d.styleSourceId}:${d.breakpointId}:${d.state ?? ""}:${d.property}`;

export type Attachments = {
  props: Map<string, Prop>;
  styleSources: Map<string, StyleSource>;
  styleSourceSelections: Map<string, StyleSourceSelection>;
  styles: Map<string, StyleDecl>;
};

export type DocumentMaps = Attachments & { instances: Map<string, Instance> };

export function subtreeIds(rootId: string, instances: Map<string, Instance>): Set<string> {
  const ids = new Set<string>();
  const walk = (id: string) => {
    if (ids.has(id)) return;
    ids.add(id);
    for (const c of instances.get(id)?.children ?? []) if (c.type === "id") walk(c.value);
  };
  walk(rootId);
  return ids;
}

/** The subtree rooted at `rootId` with everything needed to recreate it elsewhere. */
export function collectFragment(rootId: string, doc: DocumentMaps): DocumentMaps & { rootId: string } {
  const ids = subtreeIds(rootId, doc.instances);
  const instances = new Map([...doc.instances].filter(([id]) => ids.has(id)));
  const props = new Map([...doc.props].filter(([, p]) => ids.has(p.instanceId)));
  const styleSourceSelections = new Map([...doc.styleSourceSelections].filter(([id]) => ids.has(id)));
  const sourceIds = new Set([...styleSourceSelections.values()].flatMap((s) => s.values));
  const styleSources = new Map([...doc.styleSources].filter(([id]) => sourceIds.has(id)));
  const styles = new Map([...doc.styles].filter(([, d]) => sourceIds.has(d.styleSourceId)));
  return { rootId, instances, props, styleSourceSelections, styleSources, styles };
}

/**
 * Re-keys a fragment's attachments onto cloned instance ids (`idMap`: old → new).
 * `existingSources` = the target document's style sources, used to keep shared tokens.
 */
export function cloneAttachments(
  fragment: Partial<Attachments>,
  idMap: Map<string, string>,
  existingSources: Map<string, StyleSource>
): Attachments {
  const out: Attachments = { props: new Map(), styleSources: new Map(), styleSourceSelections: new Map(), styles: new Map() };

  for (const prop of fragment.props?.values() ?? []) {
    const instanceId = idMap.get(prop.instanceId);
    if (!instanceId) continue;
    const id = `prop_${nanoid(8)}`;
    out.props.set(id, { ...prop, id, instanceId });
  }

  const sourceMap = new Map<string, string>();
  for (const [id, source] of fragment.styleSources ?? []) {
    if (source.type === "local") {
      const newId = `src_${nanoid(8)}`;
      sourceMap.set(id, newId);
      out.styleSources.set(newId, { ...source, id: newId });
    } else if (existingSources.has(id)) {
      sourceMap.set(id, id);
    }
  }

  for (const sel of fragment.styleSourceSelections?.values() ?? []) {
    const instanceId = idMap.get(sel.instanceId);
    if (!instanceId) continue;
    const values = sel.values.flatMap((v) => (sourceMap.has(v) ? [sourceMap.get(v)!] : []));
    out.styleSourceSelections.set(instanceId, { instanceId, values });
  }

  for (const decl of fragment.styles?.values() ?? []) {
    const styleSourceId = sourceMap.get(decl.styleSourceId);
    if (!styleSourceId || styleSourceId === decl.styleSourceId) continue; // shared token styles already exist
    const copy = { ...decl, styleSourceId };
    out.styles.set(styleKey(copy), copy);
  }
  return out;
}

/** Writes attachments into the mutable maps of an updateData transaction. */
export function applyAttachments(target: Attachments, att: Attachments): void {
  for (const [k, v] of att.props) target.props.set(k, v);
  for (const [k, v] of att.styleSources) target.styleSources.set(k, v);
  for (const [k, v] of att.styleSourceSelections) target.styleSourceSelections.set(k, v);
  for (const [k, v] of att.styles) target.styles.set(k, v);
}
