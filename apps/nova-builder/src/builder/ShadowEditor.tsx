"use client";
import { useMemo } from "react";
import { writeStyleProperty } from "@/lib/styleWriteHelper";
import { ShadowLayer, parseLayers, serializeLayers, ShadowLayerRow } from "./ShadowLayerRow";
import { UI_VARS as C } from "@/lib/uiTheme";
import { useI18n, fmt } from "@/lib/i18n";


type PanelProps = { instanceId: string; currentCss: string };

function ShadowPanelBase({
  label,
  cssProperty,
  type,
  instanceId,
  currentCss,
}: {
  label: string;
  cssProperty: string;
  type: "box" | "text";
  instanceId: string;
  currentCss: string;
}) {
  const E = useI18n().t.inspector.editors;
  const layers = useMemo(() => parseLayers(currentCss, type), [currentCss, type]);

  const commit = (newLayers: ShadowLayer[]) =>
    writeStyleProperty(instanceId, cssProperty, serializeLayers(newLayers, type));

  const addLayer = () => commit([...layers, { x: 0, y: 4, blur: 8, spread: 0, color: "rgba(0,0,0,0.25)", inset: false }]);
  const updateLayer = (i: number, l: ShadowLayer) => { const next = [...layers]; next[i] = l; commit(next); };
  const deleteLayer = (i: number) => commit(layers.filter((_, idx) => idx !== i));

  const shadowPresets: Array<{ label: string; layers: ShadowLayer[] }> = [
    { label: E.shadowSubtle, layers: [{ x: 0, y: 1, blur: 3, spread: 0, color: "rgba(0,0,0,0.12)", inset: false }] },
    { label: E.shadowMedium, layers: [{ x: 0, y: 4, blur: 6, spread: -1, color: "rgba(0,0,0,0.1)", inset: false }, { x: 0, y: 2, blur: 4, spread: -2, color: "rgba(0,0,0,0.06)", inset: false }] },
    { label: E.shadowElevated, layers: [{ x: 0, y: 10, blur: 25, spread: -5, color: "rgba(0,0,0,0.15)", inset: false }, { x: 0, y: 8, blur: 10, spread: -6, color: "rgba(0,0,0,0.08)", inset: false }] },
    { label: E.shadowGlow, layers: [{ x: 0, y: 0, blur: 16, spread: 0, color: "rgba(124,58,237,0.35)", inset: false }] },
  ];

  return (
    <div style={{ borderBottom: `1px solid ${C.border}` }}>
      <div style={{ display: "flex", alignItems: "center", padding: "5px 12px", background: C.sectionBg }}>
        <div style={{ display: "flex", flexDirection: "column", flex: 1, lineHeight: 1.2 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 12, color: C.textMuted, fontFamily: C.font, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase" }}>
              {label}
            </span>
            {layers.length > 0 && <span style={{ color: C.textMuted, fontWeight: 400 }}>{layers.length}</span>}
          </div>
          <span style={{ fontSize: 10, color: C.textMuted, fontFamily: C.fontMono, opacity: 0.65 }}>
            {cssProperty}
          </span>
        </div>
        <button onClick={addLayer} title={fmt(E.addItem, { label })} style={{ width: 20, height: 20, border: `1px solid ${C.border}`, borderRadius: 3, background: "none", color: C.textMuted, fontSize: 15, lineHeight: "18px", cursor: "pointer", padding: 0 }}>+</button>
      </div>

      {/* Shadow Presets bar for box shadow */}
      {type === "box" && (
        <div style={{ padding: "4px 8px", borderBottom: `1px solid ${C.border}`, display: "flex", gap: 3, alignItems: "center", background: "rgba(255,255,255,0.02)", flexWrap: "wrap" }}>
          <span style={{ fontSize: 9, color: C.textMuted, textTransform: "uppercase", fontWeight: 600 }}>{E.shadowPresets}:</span>
          {shadowPresets.map((sp) => (
            <button
              key={sp.label}
              onClick={() => commit(sp.layers)}
              title={sp.label}
              style={{
                padding: "1px 5px",
                borderRadius: 3,
                border: `1px solid ${C.border}`,
                background: "transparent",
                color: C.text,
                fontSize: 10,
                fontFamily: C.font,
                cursor: "pointer",
              }}
            >
              {sp.label}
            </button>
          ))}
        </div>
      )}
      {layers.length > 0 && (
        <div style={{ padding: "4px 8px 8px", display: "flex", flexDirection: "column", gap: 4 }}>
          {layers.map((layer, i) => (
            <ShadowLayerRow key={i} layer={layer} type={type} onChange={(l) => updateLayer(i, l)} onDelete={() => deleteLayer(i)} />
          ))}
        </div>
      )}
    </div>
  );
}

export function BoxShadowPanel({ instanceId, currentCss }: PanelProps) {
  const E = useI18n().t.inspector.editors;
  return <ShadowPanelBase label={E.boxShadow} cssProperty="boxShadow" type="box" instanceId={instanceId} currentCss={currentCss} />;
}

export function TextShadowPanel({ instanceId, currentCss }: PanelProps) {
  const E = useI18n().t.inspector.editors;
  return <ShadowPanelBase label={E.textShadow} cssProperty="textShadow" type="text" instanceId={instanceId} currentCss={currentCss} />;
}

// Kept for backward compatibility with any direct consumers.
export function ShadowPanel({
  label,
  cssProperty,
  type,
  instanceId,
  currentCss,
}: {
  label: string;
  cssProperty: string;
  type: "box" | "text";
  instanceId: string;
  currentCss: string;
}) {
  return <ShadowPanelBase label={label} cssProperty={cssProperty} type={type} instanceId={instanceId} currentCss={currentCss} />;
}
