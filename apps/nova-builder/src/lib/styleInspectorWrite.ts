"use client";
import { updateData } from "./transactions";
import { $selectedBreakpoint, $selectedState, $multiSelectedInstanceIds } from "./nano-states";
import type { AnyStyleDecl, StyleValue } from "./styleValueConversion";
import { ensureLocalSource } from "./style-object-model";

// Re-export for callers that import ensureSource by name (backward compat shim).
export { ensureLocalSource as ensureSource } from "./style-object-model";

export function writeStyle(instanceId: string, decl: AnyStyleDecl, newValue: StyleValue) {
  const multiIds = $multiSelectedInstanceIds.get();
  const targetIds = multiIds.length > 1 ? multiIds : [instanceId];

  const activeBpId = $selectedBreakpoint.get()?.id ?? decl.breakpointId;
  const activeState = $selectedState.get();

  updateData(({ styles, styleSources, styleSourceSelections }) => {
    const sources = styleSources as Map<string, { id: string; type: string }>;
    const selections = styleSourceSelections as Map<string, { instanceId: string; values: string[] }>;
    for (const targetId of targetIds) {
      // Always write to the LOCAL source — never to a token source.
      const sourceId = ensureLocalSource(targetId, sources, selections);
      const key = `${sourceId}:${activeBpId}:${activeState}:${decl.property}`;
      (styles as Map<string, AnyStyleDecl>).set(key, {
        ...decl,
        styleSourceId: sourceId,
        breakpointId: activeBpId,
        state: activeState || undefined,
        value: newValue,
      });
    }
  });
}

/** Removes one property at the decl's own breakpoint + state (undoable), for every selected instance. */
export function removeStyle(instanceId: string, decl: AnyStyleDecl) {
  const multiIds = $multiSelectedInstanceIds.get();
  const targetIds = multiIds.length > 1 ? multiIds : [instanceId];
  const state = decl.state ?? "";
  updateData(({ styles, styleSources, styleSourceSelections }) => {
    const selections = styleSourceSelections as Map<string, { instanceId: string; values: string[] }>;
    const sources = styleSources as Map<string, { id: string; type: string }>;
    // Local sources only — a token's value is shared by other elements.
    const sourceIds = new Set(
      [decl.styleSourceId, ...targetIds.flatMap((id) => selections.get(id)?.values ?? [])]
        .filter((id) => sources.get(id)?.type === "local"),
    );
    for (const [key, d] of styles as Map<string, AnyStyleDecl>) {
      if (sourceIds.has(d.styleSourceId) && d.property === decl.property && d.breakpointId === decl.breakpointId && (d.state ?? "") === state) {
        (styles as Map<string, AnyStyleDecl>).delete(key);
      }
    }
  });
}

export function getDeclsForInstance(
  targetId: string,
  styles: Map<string, AnyStyleDecl>,
  styleSourceSelections: Map<string, { instanceId: string; values: string[] }>,
  bpId: string | undefined,
  baseBpId: string | undefined,
  selectedState: string
): Map<string, AnyStyleDecl> {
  const sel = styleSourceSelections.get(targetId);
  const srcIds = sel?.values ?? [];
  const byProp = new Map<string, AnyStyleDecl>();

  // Iterate in source order (index 0 = lowest specificity token, index last = highest specificity local source)
  for (const srcId of srcIds) {
    for (const decl of styles.values()) {
      if (decl.styleSourceId !== srcId) continue;
      if ((decl.state ?? "") !== selectedState) continue;
      if (bpId !== undefined && decl.breakpointId !== bpId && decl.breakpointId !== baseBpId) continue;

      const existing = byProp.get(decl.property);
      // If no existing decl from this source or earlier source, OR if this decl is at active breakpoint overriding base breakpoint
      if (!existing || decl.breakpointId === bpId || existing.styleSourceId !== srcId) {
        byProp.set(decl.property, decl);
      }
    }
  }
  return byProp;
}

