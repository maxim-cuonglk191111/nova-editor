"use client";
import React, { useRef, useState } from "react";
import { useStore } from "@nanostores/react";
import { updateData } from "@/lib/transactions";
import { $selectedState } from "@/lib/nano-states";
import { ensureLocalSource } from "@/lib/style-object-model";
import { UI_VARS as C } from "@/lib/uiTheme";
import { useI18n } from "@/lib/i18n";


type UnitValue = { type: "unit"; value: number; unit: string };
type KeywordValue = { type: "keyword"; value: string };
type ColorValue = { type: "color"; value: { r: number; g: number; b: number; alpha?: number } };
type StyleValue = UnitValue | KeywordValue | ColorValue | { type: string; [k: string]: unknown };

type AnyStyleDecl = {
  styleSourceId: string;
  breakpointId: string;
  state?: string;
  property: string;
  value: StyleValue;
};

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  if (!m) return null;
  return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) };
}

// Properties whose bare number is not a length — "700" must stay 700, not 700px.
const UNITLESS = new Set(["fontWeight", "lineHeight", "opacity", "zIndex", "flexGrow", "flexShrink", "order", "aspectRatio"]);

export function parseNewValue(raw: string, property = ""): StyleValue {
  const unitMatch = raw.match(/^(-?\d+\.?\d*)(px|%|rem|em|vw|vh|fr|ch|pt|deg|s|ms)$/);
  if (unitMatch) return { type: "unit", value: parseFloat(unitMatch[1]), unit: unitMatch[2] };
  if (/^#[0-9a-f]{3,8}$/i.test(raw)) {
    const rgb = hexToRgb(raw.length === 4 ? raw.replace(/([^#])/g, "$1$1") : raw) ?? { r: 0, g: 0, b: 0 };
    // SDK rgb shape — renderable by the canvas css-engine (legacy "color" is not)
    return { type: "rgb", ...rgb, alpha: 1 };
  }
  const num = Number(raw);
  if (!isNaN(num) && raw.trim() !== "") return { type: "unit", value: num, unit: UNITLESS.has(property) ? "" : "px" };
  return { type: "keyword", value: raw };
}

/** Accepts camelCase ("maxWidth"), CSS ("max-width") or a shown label ("Max width"). */
export function resolvePropertyName(input: string, labels: Record<string, string>): string {
  const raw = input.trim();
  const byLabel = Object.entries(labels).find(([, l]) => l.toLowerCase() === raw.toLowerCase());
  if (byLabel) return byLabel[0];
  return raw.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
}

const CSS_PROP_SUGGESTIONS = [
  "display","flexDirection","flexWrap","alignItems","justifyContent","gap","columnGap","rowGap",
  "gridTemplateColumns","gridTemplateRows","gridColumn","gridRow","flexGrow","flexShrink","flexBasis",
  "width","height","minWidth","maxWidth","minHeight","maxHeight","aspectRatio","boxSizing",
  "padding","paddingTop","paddingRight","paddingBottom","paddingLeft",
  "margin","marginTop","marginRight","marginBottom","marginLeft",
  "position","top","right","bottom","left","zIndex",
  "fontFamily","fontSize","fontWeight","fontStyle","lineHeight","letterSpacing",
  "textAlign","textDecoration","textTransform","textOverflow","whiteSpace","wordBreak",
  "color","background","backgroundColor","backgroundImage","backgroundSize","backgroundPosition",
  "border","borderTop","borderRight","borderBottom","borderLeft",
  "borderColor","borderWidth","borderStyle","borderRadius",
  "outline","outlineColor","outlineWidth","outlineStyle",
  "opacity","boxShadow","textShadow","transform","transition","animation",
  "cursor","overflow","overflowX","overflowY","visibility","pointerEvents",
  "filter","backdropFilter","mixBlendMode","isolation","objectFit","objectPosition",
];

export function AddPropertyRow({
  instanceId,
  breakpointId,
}: {
  instanceId: string;
  breakpointId: string | undefined;
}) {
  const { t } = useI18n();
  const [propName, setPropName] = useState("");
  const [propValue, setPropValue] = useState("");
  const valueRef = useRef<HTMLInputElement>(null);
  const activeState = useStore($selectedState);

  const commit = () => {
    const name = resolvePropertyName(propName, t.inspector.propNames);
    const val = propValue.trim();
    if (!name || !val || !breakpointId) return;

    updateData(({ styles, styleSources, styleSourceSelections }) => {
      const sourceId = ensureLocalSource(
        instanceId,
        styleSources as Map<string, { id: string; type: string }>,
        styleSourceSelections as Map<string, { instanceId: string; values: string[] }>,
      );
      const decl: AnyStyleDecl = {
        styleSourceId: sourceId,
        breakpointId,
        state: activeState || undefined,
        property: name,
        value: parseNewValue(val, name),
      };
      const key = `${sourceId}:${breakpointId}:${activeState}:${name}`;
      (styles as Map<string, AnyStyleDecl>).set(key, decl);
    });

    setPropName("");
    setPropValue("");
  };

  const inputStyle: React.CSSProperties = {
    background: C.inputBg,
    border: `1px solid ${C.border}`,
    borderRadius: 3,
    color: C.text,
    fontFamily: C.fontMono,
    fontSize: 13,
    padding: "2px 4px",
    outline: "none",
    boxSizing: "border-box" as const,
  };

  return (
    <div style={{ padding: "6px 8px", borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
      <div style={{ fontSize: 11, color: C.textMuted, fontFamily: C.font, marginBottom: 4 }}>{t.inspector.addStyle}</div>
      <div style={{ display: "flex", gap: 4 }}>
        <datalist id="nova-css-props">
          {CSS_PROP_SUGGESTIONS.map((p) => (
            <option key={p} value={p}>{t.inspector.propNames[p] ?? p}</option>
          ))}
        </datalist>
        <input
          list="nova-css-props"
          placeholder={t.inspector.propertyPlaceholder}
          value={propName}
          onChange={(e) => setPropName(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") valueRef.current?.focus(); }}
          style={{ ...inputStyle, width: "45%" }}
        />
        <input
          ref={valueRef}
          placeholder={t.inspector.valuePlaceholder}
          value={propValue}
          onChange={(e) => setPropValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") commit(); }}
          onBlur={commit}
          style={{ ...inputStyle, flex: 1, minWidth: 0 }}
        />
      </div>
    </div>
  );
}
