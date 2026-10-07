"use client";
// Explains why picking a button/badge "Style" (variant) changes nothing: colours
// set in the Style tab are more specific and win over the variant's colours.
import { useStore } from "@nanostores/react";
import { $styles, $styleSourceSelections, $styleSources } from "@/lib/data-stores";
import { UI_VARS as C } from "@/lib/uiTheme";
import { useI18n } from "@/lib/i18n";

const COLOR_PROPS = new Set(["backgroundColor", "background", "color", "backgroundImage"]);

export function VariantOverrideHint({ instanceId }: { instanceId: string }) {
  const P = useI18n().t.inspector.props;
  const styles = useStore($styles) as Map<string, { styleSourceId: string; property: string }>;
  const selections = useStore($styleSourceSelections) as Map<string, { values: string[] }>;
  const sources = useStore($styleSources) as Map<string, { type: string }>;
  const local = new Set((selections.get(instanceId)?.values ?? []).filter((id) => sources.get(id)?.type === "local"));
  const overridden = [...styles.values()].some((d) => local.has(d.styleSourceId) && COLOR_PROPS.has(d.property));
  if (!overridden) return null;
  return <div style={{ fontSize: 11, color: C.textMuted, lineHeight: 1.45 }}>{P.variantOverridden}</div>;
}
