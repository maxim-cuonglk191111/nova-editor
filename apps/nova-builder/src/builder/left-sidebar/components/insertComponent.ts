// Inserts a registry component into the page open on the canvas — below the selection,
// into a Row / Column, or at a drop target. One undoable transaction. Shared by the Add
// panel (click / drag) and the command palette.
import { nanoid } from "nanoid";
import { $selectedInstanceSelector, $selectedPage } from "@/lib/nano-states";
import { updateData } from "@/lib/transactions";
import { $instances } from "@/lib/data-stores";
import { ensureLocalSource } from "@/lib/style-object-model";
import type { DropTarget } from "./useDraggable";
import { getRegistry } from "./ComponentRegistry";

const CONTAINERS = new Set(["shadcn:Col", "shadcn:Row"]);

function parentOf(instances: ReturnType<typeof $instances.get>, childId: string): { parentId: string; index: number } | null {
  for (const [id, inst] of instances.entries()) {
    const index = inst.children.findIndex((c) => c.type === "id" && c.value === childId);
    if (index !== -1) return { parentId: id, index };
  }
  return null;
}

export function insertComponent(componentName: string, dropTarget: DropTarget = null) {
  const instances = $instances.get();
  const selector = $selectedInstanceSelector.get();
  const activePage = $selectedPage.get();
  if (!activePage) {
    console.error("[builder] insertComponent error: No page found!");
    return;
  }

  let parentId: string | null = null;
  let insertIdx: number | null = null;

  if (dropTarget) {
    if (dropTarget.position === "into") {
      parentId = dropTarget.instanceId;
    } else if (instances.get(dropTarget.instanceId)) {
      const found = parentOf(instances, dropTarget.instanceId);
      if (found) {
        parentId = found.parentId;
        insertIdx = dropTarget.position === "above" ? found.index : found.index + 1;
      }
    }
  } else if (selector && selector.length > 0) {
    const selectedId = selector[0];
    const target = instances.get(selectedId);
    if (target) {
      if (CONTAINERS.has(target.component)) {
        parentId = selectedId;
        insertIdx = target.children.length;
      } else {
        const found = parentOf(instances, selectedId);
        if (found) {
          parentId = found.parentId;
          insertIdx = found.index + 1;
        }
      }
    }
  }

  if (!parentId) parentId = activePage.rootInstanceId;
  if (insertIdx === null) insertIdx = instances.get(parentId)?.children.length ?? null;

  const newId = nanoid();
  const regEntry = getRegistry().find((r) => r.id === componentName);
  const creation = regEntry ? regEntry.createInstance(newId) : {
    instance: { type: "instance" as const, id: newId, component: componentName, label: componentName.replace("shadcn:", ""), children: [] },
  };
  const newInstance = creation.instance;

  updateData(({ instances: draft, props, styles, styleSources, styleSourceSelections, breakpoints }) => {
    draft.set(newId, newInstance as Parameters<typeof draft.set>[1]);
    creation.childInstances?.forEach((child) => draft.set(child.id, child as Parameters<typeof draft.set>[1]));
    if (creation.props) {
      Object.entries(creation.props).forEach(([propId, propVal]) => props.set(propId, propVal as Parameters<typeof props.set>[1]));
    }

    const parent = parentId ? draft.get(parentId) : undefined;
    if (parent && parentId) {
      const children = [...parent.children];
      const child = { type: "id" as const, value: newId };
      if (insertIdx !== null && insertIdx >= 0) children.splice(insertIdx, 0, child);
      else children.push(child);
      draft.set(parentId, { ...parent, children });
    }

    // Images default to object-fit: cover on the base breakpoint.
    if (newInstance.component === "Image") {
      const bps = [...(breakpoints as Map<string, { id: string; minWidth?: number }>).values()];
      const bpId = bps.sort((a, b) => (a.minWidth ?? 0) - (b.minWidth ?? 0))[0]?.id;
      if (bpId) {
        const sources = styleSources as Map<string, { id: string; type: string }>;
        const selections = styleSourceSelections as Map<string, { instanceId: string; values: string[] }>;
        const sourceId = ensureLocalSource(newId, sources, selections);
        (styles as Map<string, unknown>).set(`${sourceId}:${bpId}:objectFit:`, {
          styleSourceId: sourceId,
          breakpointId: bpId,
          property: "objectFit",
          value: { type: "keyword", value: "cover" },
        });
      }
    }
  });

  $selectedInstanceSelector.set([newId]);
}
