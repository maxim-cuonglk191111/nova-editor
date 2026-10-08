import type { Instance, Prop } from "@webstudio-is/sdk";

/** `instanceId` is "<id>" for a text child, or "<id>::<prop>" for a text prop such as a field's placeholder. */
export type TextInstance = { instanceId: string; currentText: string };

/** Props whose value is visitor-facing text. */
const TEXT_PROPS = new Set(["placeholder"]);
export const PROP_SEPARATOR = "::";

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

/** Leaf text elements under `rootId` (and, with `props`, text props like placeholders), in document order. */
export function collectTextInstances(instances: Map<string, Instance>, rootId: string, props?: Map<string, Prop>): TextInstance[] {
  const result: TextInstance[] = [];
  const visited = new Set<string>();
  const textProps = new Map<string, Prop[]>();
  for (const p of props?.values() ?? []) {
    if (TEXT_PROPS.has(p.name) && p.type === "string" && p.value.trim()) textProps.set(p.instanceId, [...(textProps.get(p.instanceId) ?? []), p]);
  }
  const walk = (id: string) => {
    if (visited.has(id)) return;
    visited.add(id);
    const inst = instances.get(id);
    if (!inst) return;
    const textChild = inst.children.find((c) => c.type === "text");
    if (textChild && !inst.children.some((c) => c.type === "id")) {
      result.push({ instanceId: id, currentText: textChild.value as string });
    }
    for (const p of textProps.get(id) ?? []) {
      result.push({ instanceId: `${id}${PROP_SEPARATOR}${p.name}`, currentText: p.value as string });
    }
    for (const child of inst.children) {
      if (child.type === "id") walk(child.value);
    }
  };
  walk(rootId);
  return result.slice(0, MAX_FILL_TEXTS);
}
