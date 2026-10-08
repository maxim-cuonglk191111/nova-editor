import type { Instance } from "@webstudio-is/sdk";

export type TextInstance = { instanceId: string; currentText: string };

/** Upper bound for one AI Content Fill request (the server fills them in batches). */
export const MAX_FILL_TEXTS = 120;

/** Whether `id` is `rootId` or one of its descendants. */
export function isWithin(instances: Map<string, Instance>, rootId: string, id: string): boolean {
  const stack = [rootId];
  const seen = new Set<string>();
  while (stack.length) {
    const cur = stack.pop()!;
    if (cur === id) return true;
    if (seen.has(cur)) continue;
    seen.add(cur);
    for (const c of instances.get(cur)?.children ?? []) if (c.type === "id") stack.push(c.value);
  }
  return false;
}

/** Leaf text elements under `rootId`, in document order. */
export function collectTextInstances(instances: Map<string, Instance>, rootId: string): TextInstance[] {
  const result: TextInstance[] = [];
  const visited = new Set<string>();
  const walk = (id: string) => {
    if (visited.has(id)) return;
    visited.add(id);
    const inst = instances.get(id);
    if (!inst) return;
    const textChild = inst.children.find((c) => c.type === "text");
    if (textChild && !inst.children.some((c) => c.type === "id")) {
      result.push({ instanceId: id, currentText: textChild.value as string });
    }
    for (const child of inst.children) {
      if (child.type === "id") walk(child.value);
    }
  };
  walk(rootId);
  return result.slice(0, MAX_FILL_TEXTS);
}
