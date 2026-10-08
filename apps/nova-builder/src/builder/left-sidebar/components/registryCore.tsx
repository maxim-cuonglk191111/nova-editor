// Component registry core: the definition type, register/get and the helpers
// the per-category entry files (./registry/*) use.
import React from "react";

// Standard categories following shadcn documentation groups
export type ComponentCategory =
  | "Inputs"
  | "Navigation"
  | "Overlay"
  | "Layout"
  | "Display"
  | "Typography"
  | "Feedback"
  | "Advanced";

export interface ComponentDefinition {
  id: string; // matches canvas name, e.g. "shadcn:Button"
  displayName: string;
  category: ComponentCategory;
  description: string;
  keywords: string[];
  preview(): React.ReactNode;
  createInstance(id: string): {
    instance: {
      type: "instance";
      id: string;
      component: string;
      label: string;
      children: Array<{ type: "id" | "text" | "expression"; value: string }>;
    };
    childInstances?: Array<{
      type: "instance";
      id: string;
      component: string;
      label: string;
      children: Array<{ type: "id" | "text" | "expression"; value: string }>;
    }>;
    props?: Record<string, {
      id: string;
      instanceId: string;
      name: string;
      type: "string" | "number" | "boolean" | "enum";
      value: any;
    }>;
  };
  defaultProps?: Record<string, any>;
  tags?: string[];
}

const componentRegistry: ComponentDefinition[] = [];

export function registerComponent(entry: ComponentDefinition) {
  const index = componentRegistry.findIndex((e) => e.id === entry.id);
  if (index !== -1) {
    componentRegistry[index] = entry;
  } else {
    componentRegistry.push(entry);
  }
}

export function getRegistry(): ComponentDefinition[] {
  return [...componentRegistry];
}

// Helper to create simple default instances
export const defaultBuilder = (id: string, component: string, label: string, children: string[] = []) => ({
  instance: {
    type: "instance" as const,
    id,
    component,
    label,
    children: children.map((c) => ({ type: "text" as const, value: c })),
  },
});

// Helper for unique sub-ids
export const makeSubId = (id: string, suffix: string) => `${id}-${suffix}`;
