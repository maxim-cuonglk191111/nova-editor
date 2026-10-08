/** Display name for a component id: the dictionary entry, else `fallback`, else the id without its "shadcn:" prefix. */
export function componentName(id: string, names: Record<string, string>, fallback?: string): string {
  return names[id] ?? fallback ?? id.replace(/^shadcn:/, "");
}
