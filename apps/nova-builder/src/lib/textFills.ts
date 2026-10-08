// Applies AI-rewritten texts as one undoable transaction: a plain id replaces the element's
// text child, "<id>::<prop>" (see collectTextInstances) updates that text prop.
import { updateData } from "./transactions";
import { PROP_SEPARATOR } from "./textInstances";

export type TextFill = { instanceId: string; text: string };

export function applyTextFills(fills: TextFill[]) {
  updateData(({ instances, props }) => {
    for (const { instanceId, text } of fills) {
      const [id, propName] = instanceId.split(PROP_SEPARATOR);
      if (propName) {
        for (const [key, prop] of props) {
          if (prop.instanceId === id && prop.name === propName && prop.type === "string") props.set(key, { ...prop, value: text });
        }
        continue;
      }
      const inst = instances.get(id);
      if (inst) instances.set(id, { ...inst, children: [{ type: "text" as const, value: text }] } as Parameters<typeof instances.set>[1]);
    }
  });
}
