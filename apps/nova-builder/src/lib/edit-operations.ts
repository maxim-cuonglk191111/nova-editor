// Pure edit operations over the $instances Map.
// Every function is side-effect-free — callers apply the returned Map to $instances.
// captureSnapshot() must be called by the caller BEFORE applying any result.

import { nanoid } from "nanoid";
import type { Instance, Instances, Prop, StyleDecl, StyleSource, StyleSourceSelection } from "@webstudio-is/sdk";
import { checkFragmentNesting, type NestingViolation } from "./nestingGuard";

export type ClipboardData = {
  instances: Map<string, Instance>;
  rootId: string;
  // Optional props that accompany the fragment (e.g. a "style" prop derived from
  // pasted Tailwind classes). Keyed by prop id; instanceId points into instances.
  props?: Map<string, Prop>;
  // Styles of the fragment (see lib/fragment-attachments.ts).
  styleSources?: Map<string, StyleSource>;
  styleSourceSelections?: Map<string, StyleSourceSelection>;
  styles?: Map<string, StyleDecl>;
};

export function makeInstanceId(): string {
  return `inst_${nanoid(8)}`;
}

export function buildParentMap(instances: Instances): Map<string, string> {
  const pm = new Map<string, string>();
  for (const [, inst] of instances) {
    for (const child of inst.children) {
      if (child.type === "id") pm.set(child.value, inst.id);
    }
  }
  return pm;
}

// Deep-clone a subtree with fresh IDs. Returns the id remap so callers can also
// re-key accompanying props (M7 fragment paste).
export function cloneSubtree(
  rootId: string,
  instances: Instances
): { cloned: Map<string, Instance>; newRootId: string; idMap: Map<string, string> } {
  const idMap = new Map<string, string>();
  const cloned = new Map<string, Instance>();

  function assign(id: string): string {
    if (idMap.has(id)) return idMap.get(id)!;
    const newId = makeInstanceId();
    idMap.set(id, newId);
    return newId;
  }

  function clone(id: string): void {
    const inst = instances.get(id);
    if (!inst) return;
    const newId = assign(id);
    const newChildren = inst.children.map((c) => {
      if (c.type === "id") {
        clone(c.value);
        return { type: "id" as const, value: assign(c.value) };
      }
      return c;
    });
    cloned.set(newId, { ...inst, id: newId, children: newChildren });
  }

  clone(rootId);
  return { cloned, newRootId: idMap.get(rootId)!, idMap };
}

// Delete an instance and remove it from its parent's children list.
// Returns { updated, deleted: false } unchanged if instanceId has no parent (root cannot be deleted).
// `nextSelectedId` is what to select afterwards (next sibling, else previous, else
// parent) so the selection indicator stays on the canvas instead of vanishing.
export function deleteInstance(
  instanceId: string,
  instances: Instances
): { updated: Instances; deleted: boolean; nextSelectedId?: string } {
  const parentMap = buildParentMap(instances);
  const parentId = parentMap.get(instanceId);
  if (!parentId) return { updated: instances, deleted: false };
  const parent = instances.get(parentId);
  if (!parent) return { updated: instances, deleted: false };

  const siblings = parent.children.flatMap((c) => (c.type === "id" ? [c.value] : []));
  const index = siblings.indexOf(instanceId);
  const nextSelectedId = siblings[index + 1] ?? siblings[index - 1] ?? parentId;

  const updated = new Map(instances);
  updated.set(parentId, {
    ...parent,
    children: parent.children.filter(
      (c) => !(c.type === "id" && c.value === instanceId)
    ),
  });
  updated.delete(instanceId);
  return { updated, deleted: true, nextSelectedId };
}

// Duplicate: clone subtree with new IDs and insert the clone immediately after the original.
// `idMap` (old → new) lets the caller clone props and styles (lib/fragment-attachments).
export function duplicateInstance(
  instanceId: string,
  instances: Instances
): { updated: Instances; newRootId: string; idMap: Map<string, string> } | null {
  const parentMap = buildParentMap(instances);
  const parentId = parentMap.get(instanceId);
  if (!parentId) return null;
  const parent = instances.get(parentId);
  if (!parent) return null;

  const { cloned, newRootId, idMap } = cloneSubtree(instanceId, instances);
  const updated = new Map(instances);
  for (const [id, inst] of cloned) updated.set(id, inst);

  const origIdx = parent.children.findIndex(
    (c) => c.type === "id" && c.value === instanceId
  );
  const newChildren = [...parent.children];
  newChildren.splice(origIdx + 1, 0, { type: "id" as const, value: newRootId });
  updated.set(parentId, { ...parent, children: newChildren });
  return { updated, newRootId, idMap };
}

export type PasteResult =
  | { updated: Instances; newRootId: string; idMap: Map<string, string>; violation?: undefined }
  | { updated?: undefined; newRootId?: undefined; idMap?: undefined; violation: NestingViolation };

// Paste clipboard as a sibling after selectedId, or as last child of root when nothing selected.
// IDs are always re-minted so each paste produces unique instances.
// Returns a `violation` (and no mutation) when the paste would break the content model.
// `idMap` (old → new) lets the caller clone the fragment's props and styles.
export function pasteInstance(
  clipboard: ClipboardData,
  selectedId: string | undefined,
  instances: Instances
): PasteResult | null {
  const { cloned, newRootId, idMap } = cloneSubtree(clipboard.rootId, clipboard.instances);
  const updated = new Map(instances);
  for (const [id, inst] of cloned) updated.set(id, inst);

  if (selectedId) {
    const parentMap = buildParentMap(instances);
    const parentId = parentMap.get(selectedId);
    if (parentId) {
      const violation = checkFragmentNesting(parentId, newRootId, cloned, instances);
      if (violation) return { violation };
      const parent = instances.get(parentId)!;
      const origIdx = parent.children.findIndex(
        (c) => c.type === "id" && c.value === selectedId
      );
      const newChildren = [...parent.children];
      newChildren.splice(origIdx + 1, 0, { type: "id" as const, value: newRootId });
      updated.set(parentId, { ...parent, children: newChildren });
      return { updated, newRootId, idMap };
    }
  }

  // Fallback: append to root instance (first instance with no parent).
  const parentMap = buildParentMap(instances);
  for (const [id, inst] of instances) {
    if (!parentMap.has(id)) {
      const violation = checkFragmentNesting(id, newRootId, cloned, instances);
      if (violation) return { violation };
      updated.set(id, {
        ...inst,
        children: [...inst.children, { type: "id" as const, value: newRootId }],
      });
      return { updated, newRootId, idMap };
    }
  }
  return null;
}

// Delete multiple instances.  Skips any instance whose ancestor is also in the set
// (the ancestor deletion implicitly removes descendants — no double-delete needed).
export function deleteMultipleInstances(
  instanceIds: string[],
  instances: Instances
): { updated: Instances; deletedCount: number } {
  const deleteSet = new Set(instanceIds);
  const parentMap = buildParentMap(instances);

  const toDelete = instanceIds.filter((id) => {
    let cur = parentMap.get(id);
    while (cur !== undefined) {
      if (deleteSet.has(cur)) return false;
      cur = parentMap.get(cur);
    }
    return true;
  });

  let updated = instances;
  let deletedCount = 0;
  for (const id of toDelete) {
    const result = deleteInstance(id, updated);
    if (result.deleted) {
      updated = result.updated;
      deletedCount++;
    }
  }
  return { updated, deletedCount };
}

// Ids whose ancestors are not also in the list (acting on an ancestor covers its descendants).
export function topLevelInstanceIds(instanceIds: string[], instances: Instances): string[] {
  const set = new Set(instanceIds);
  const parentMap = buildParentMap(instances);
  return instanceIds.filter((id) => {
    let cur = parentMap.get(id);
    while (cur !== undefined) {
      if (set.has(cur)) return false;
      cur = parentMap.get(cur);
    }
    return true;
  });
}

// Duplicate multiple instances.  Same ancestor-skip logic as deleteMultipleInstances.
export function duplicateMultipleInstances(
  instanceIds: string[],
  instances: Instances
): { updated: Instances; newRootIds: string[] } | null {
  const toDuplicate = topLevelInstanceIds(instanceIds, instances);

  let updated = instances;
  const newRootIds: string[] = [];
  for (const id of toDuplicate) {
    const result = duplicateInstance(id, updated);
    if (result) {
      updated = result.updated;
      newRootIds.push(result.newRootId);
    }
  }
  return { updated, newRootIds };
}

function isEditableTarget(e: KeyboardEvent): boolean {
  const t = e.target;
  // Shortcuts replayed from the canvas are dispatched on window, which is not an Element.
  if (!(t instanceof HTMLElement)) return false;
  return (
    t instanceof HTMLInputElement ||
    t instanceof HTMLTextAreaElement ||
    t.getAttribute("contenteditable") === "true"
  );
}

export { isEditableTarget };
