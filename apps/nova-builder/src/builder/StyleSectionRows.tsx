"use client";
import { useCallback } from "react";
import { useStore } from "@nanostores/react";
import { $instances, $styleSources } from "@/lib/data-stores";
import { $selectedInstanceId, $selectedBreakpoint } from "@/lib/nano-states";
import type { UnitValue, KeywordValue, ColorValue, RgbValue, StyleValue, AnyStyleDecl } from "@/lib/styleValueConversion";
import { styleValueToString } from "@/lib/styleValueConversion";
import { writeStyle, removeStyle } from "@/lib/styleInspectorWrite";
import { UI_VARS as C } from "@/lib/uiTheme";
import { useI18n, fmt } from "@/lib/i18n";
import { componentName } from "@/lib/i18n/componentName";
import { Icon } from "@/builder/icons";
import { UnitInput, COMMON_UNITS } from "./controls/UnitInput";
import { ColorControl } from "./controls/ColorControl";
import { CollapsibleSection } from "./controls/CollapsibleSection";
import { ToggleGroup } from "./controls/ToggleGroup";
import { enumLabel, enumOptionsFor } from "./controls/enumOptions";

type StyleSrc = { id: string; type: string; name?: string };

// ─── Style value editor ───────────────────────────────────────────────────────

export function StyleValueEditor({
  decl,
  onWrite,
}: {
  decl: AnyStyleDecl;
  onWrite: (newValue: StyleValue) => void;
}) {
  const value = decl.value;

  if (value.type === "unit") {
    const uv = value as UnitValue;
    // Unitless numbers (font weight, line height, opacity…) get a "–" choice instead of a blank select.
    const unitless = uv.unit === "" || uv.unit === "number";
    return (
      <UnitInput
        value={uv.value}
        unit={uv.unit}
        property={decl.property}
        units={unitless ? [uv.unit, ...COMMON_UNITS] : undefined}
        onCommit={(v, u) => onWrite({ type: "unit", value: v, unit: u })}
      />
    );
  }

  if (value.type === "color" || value.type === "rgb") {
    // Read both shapes (legacy Nova "color" from pre-v20 docs and SDK "rgb");
    // ColorControl always writes the SDK "rgb" shape (canvas-renderable).
    const c =
      value.type === "rgb"
        ? (value as RgbValue)
        : { ...(value as ColorValue).value, alpha: (value as ColorValue).value.alpha ?? 1 };
    return <ColorControl r={c.r} g={c.g} b={c.b} alpha={c.alpha ?? 1} onCommit={onWrite} />;
  }

  if (value.type === "keyword") {
    const kv = value as KeywordValue;
    const options = enumOptionsFor(decl.property, kv.value);
    if (options) {
      return (
        <ToggleGroup
          options={options.map((v) => ({ value: v, label: enumLabel(decl.property, v), title: v }))}
          value={kv.value}
          onChange={(v) => onWrite({ type: "keyword", value: v })}
        />
      );
    }
    return (
      <input
        key={kv.value}
        type="text"
        defaultValue={kv.value}
        onBlur={(e) => onWrite({ type: "keyword", value: e.target.value })}
        onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
        style={{ width: "100%", height: 32, padding: "0 8px", background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, color: C.codeVal, fontFamily: C.fontMono, fontSize: 13, outline: "none", boxSizing: "border-box" }}
      />
    );
  }

  return <span style={{ color: C.codeVal, fontFamily: C.fontMono, fontSize: 13 }}>{styleValueToString(value)}</span>;
}

// ─── Property categorization ─────────────────────────────────────────────────

export const SECTION_ORDER = ["Layout", "Size", "Spacing", "Typography", "Background", "Border", "Effects", "Advanced"] as const;
export type SectionName = (typeof SECTION_ORDER)[number];

export const SECTION_PROPS: Record<SectionName, Set<string>> = {
  Layout: new Set(["display","flexDirection","flexWrap","alignItems","justifyContent","justifyItems","alignContent","alignSelf","justifySelf","flex","flexGrow","flexShrink","flexBasis","gap","columnGap","rowGap","gridTemplateColumns","gridTemplateRows","gridColumn","gridRow","position","top","right","bottom","left"]),
  Size: new Set(["width","height","minWidth","maxWidth","minHeight","maxHeight","aspectRatio","boxSizing"]),
  Spacing: new Set(["padding","paddingTop","paddingRight","paddingBottom","paddingLeft","paddingInline","paddingBlock","margin","marginTop","marginRight","marginBottom","marginLeft","marginInline","marginBlock"]),
  Typography: new Set(["fontFamily","fontSize","fontWeight","fontStyle","lineHeight","letterSpacing","textAlign","textDecoration","textTransform","textOverflow","color","whiteSpace","wordBreak","overflowWrap"]),
  Background: new Set(["background","backgroundColor","backgroundImage","backgroundSize","backgroundPosition","backgroundRepeat","backgroundClip","backgroundAttachment"]),
  Border: new Set(["border","borderTop","borderRight","borderBottom","borderLeft","borderColor","borderTopColor","borderRightColor","borderBottomColor","borderLeftColor","borderWidth","borderTopWidth","borderRightWidth","borderBottomWidth","borderLeftWidth","borderStyle","borderRadius","borderTopLeftRadius","borderTopRightRadius","borderBottomLeftRadius","borderBottomRightRadius","outline","outlineColor","outlineWidth","outlineStyle"]),
  Effects: new Set(["opacity","boxShadow","textShadow","transform","transformOrigin","transition","animation","cursor","overflow","overflowX","overflowY","zIndex","visibility","pointerEvents","filter","backdropFilter","mixBlendMode","isolation"]),
  Advanced: new Set(),
};

export function getSection(property: string): SectionName {
  for (const name of SECTION_ORDER) {
    if (name === "Advanced") continue;
    if (SECTION_PROPS[name].has(property)) return name;
  }
  return "Advanced";
}

// ─── Editable prop row ────────────────────────────────────────────────────────

const SPACING_PRESET_PROPS = new Set([
  "padding", "paddingTop", "paddingRight", "paddingBottom", "paddingLeft",
  "margin", "marginTop", "marginRight", "marginBottom", "marginLeft",
  "gap", "rowGap", "columnGap",
  "borderRadius", "borderTopLeftRadius", "borderTopRightRadius", "borderBottomLeftRadius", "borderBottomRightRadius",
]);

const SPACING_SCALE_PRESETS = [
  { tag: "0", value: 0 },
  { tag: "S", value: 8 },
  { tag: "M", value: 16 },
  { tag: "L", value: 24 },
  { tag: "XL", value: 32 },
];

export function EditablePropRow({
  property,
  decl,
  instanceId,
}: {
  property: string;
  decl: AnyStyleDecl;
  instanceId: string;
}) {
  const { t } = useI18n();
  const styleSources = useStore($styleSources) as Map<string, StyleSrc>;
  const breakpoint = useStore($selectedBreakpoint);
  const src = styleSources.get(decl.styleSourceId);
  const isToken = src?.type === "token";
  // Only a value set at the active breakpoint can be removed here; an inherited
  // (base) value is overridden by editing, not deleted from all screen sizes.
  const removable = !isToken && (!breakpoint || decl.breakpointId === breakpoint.id);

  const handleWrite = useCallback(
    (newValue: StyleValue) => writeStyle(instanceId, decl, newValue),
    [instanceId, decl]
  );

  const friendlyName = t.inspector.propNames[property] ?? property;
  const showCssHint = friendlyName !== property;
  const asPills = decl.value.type === "keyword" && enumOptionsFor(property, (decl.value as KeywordValue).value) !== null;

  if (asPills) {
    return (
      <tr data-property={property}>
        <td colSpan={3} style={{ padding: "6px 16px 10px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
            <span title={`${friendlyName} (${property})`} style={{ fontSize: 14, fontWeight: 500, color: isToken ? "var(--ui-accent-text)" : C.text, fontFamily: C.font }}>{friendlyName}</span>
            {removable && (
              <button
                onClick={() => removeStyle(instanceId, decl)}
                title={t.inspector.resetValue ?? t.inspector.removeValue}
                aria-label={`${t.inspector.resetValue ?? t.inspector.removeValue}: ${friendlyName}`}
                style={{ border: "none", background: "none", color: C.textMuted, fontSize: 14, lineHeight: 1, cursor: "pointer", padding: "0 2px" }}
              ><Icon name="reset" size={14} /></button>
            )}
          </div>
          <StyleValueEditor decl={decl} onWrite={handleWrite} />
        </td>
      </tr>
    );
  }

  return (
    <tr data-property={property} style={{ verticalAlign: "middle" }}>
      <td
        title={`${friendlyName} (${property})`}
        style={{ padding: "5px 4px 5px 16px", color: isToken ? "var(--ui-accent-text)" : C.text, fontFamily: C.font, fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 0, width: "46%" }}
      >
        <div style={{ display: "flex", flexDirection: "column", minWidth: 0, lineHeight: 1.15 }}>
          <span style={{ fontSize: 14, fontWeight: 500, color: isToken ? "var(--ui-accent-text)" : C.text, overflow: "hidden", textOverflow: "ellipsis" }}>
            {friendlyName}
            {isToken && (
              <span title={fmt(t.inspector.fromToken, { name: src?.name ?? "" })} style={{ marginLeft: 4, fontSize: 8, background: "color-mix(in srgb, var(--ui-accent) 20%, transparent)", color: "var(--ui-accent-text)", borderRadius: 3, padding: "1px 4px", verticalAlign: "middle", fontFamily: C.font, letterSpacing: "0.05em", textTransform: "uppercase" }}>T{/* i18n-ignore — token badge */}</span>
            )}
          </span>
        </div>
      </td>
      <td style={{ padding: "3px 4px", width: "54%" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <StyleValueEditor decl={decl} onWrite={handleWrite} />
          {SPACING_PRESET_PROPS.has(property) && decl.value.type === "unit" && (
            <div style={{ display: "flex", gap: 4, alignItems: "center", marginTop: 2 }}>
              {SPACING_SCALE_PRESETS.map((p) => {
                const uv = decl.value as UnitValue;
                const active = uv.value === p.value && (uv.unit === "px" || uv.unit === "" || uv.unit === "number");
                return (
                  <button
                    key={p.tag}
                    onClick={() => handleWrite({ type: "unit", value: p.value, unit: "px" })}
                    title={`${p.tag}: ${p.value}px`}
                    style={{
                      background: active ? "color-mix(in srgb, var(--ui-accent) 20%, transparent)" : "transparent",
                      border: `1px solid ${active ? C.accentBorder : C.border}`,
                      color: active ? C.accentText : C.textMuted,
                      borderRadius: 6,
                      fontSize: 11,
                      padding: "2px 7px",
                      lineHeight: "14px",
                      cursor: "pointer",
                      fontFamily: C.fontMono,
                    }}
                  >
                    {p.tag}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </td>
      <td style={{ padding: "3px 8px 3px 0", width: 18 }}>
        {removable && (
          <button
            onClick={() => removeStyle(instanceId, decl)}
            title={t.inspector.resetValue ?? t.inspector.removeValue}
            aria-label={`${t.inspector.resetValue ?? t.inspector.removeValue}: ${friendlyName}`}
            style={{ border: "none", background: "none", color: C.textMuted, fontSize: 13, lineHeight: 1, cursor: "pointer", padding: "0 2px" }}
          ><Icon name="reset" size={14} /></button>
        )}
      </td>
    </tr>
  );
}

// ─── Style section ────────────────────────────────────────────────────────────

export function StyleSection({
  name,
  entries,
  instanceId,
}: {
  name: SectionName;
  entries: [string, AnyStyleDecl][];
  instanceId: string;
}) {
  const { t } = useI18n();
  if (entries.length === 0) return null;
  return (
    <CollapsibleSection
      title={t.inspector.sections[name] ?? name}
      badge={entries.length}
      defaultOpen={name === "Layout" || name === "Size" || name === "Spacing"}
    >
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <tbody>
          {entries.map(([prop, decl]) => (
            <EditablePropRow key={prop} property={prop} decl={decl} instanceId={instanceId} />
          ))}
        </tbody>
      </table>
    </CollapsibleSection>
  );
}

// ─── Instance header ──────────────────────────────────────────────────────────

export function InstanceHeader() {
  const { t } = useI18n();
  const instanceId = useStore($selectedInstanceId);
  const instances = useStore($instances);
  if (!instanceId) return null;
  const instance = instances.get(instanceId);
  if (!instance) return null;
  const type = componentName(instance.component, t.componentNames);
  return (
    <div style={{ padding: "14px 16px 12px", borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
      <div style={{ fontSize: 16, color: C.text, fontFamily: C.font, fontWeight: 700 }}>
        {(instance as { label?: string }).label || type}
      </div>
      <div title={instance.component} style={{ fontSize: 12, color: C.textMuted, fontFamily: C.font, marginTop: 2 }}>
        {type}
      </div>
    </div>
  );
}

// ─── Multi-select header ──────────────────────────────────────────────────────

export function MultiSelectHeader({ count }: { count: number }) {
  const { t } = useI18n();
  return (
    <div style={{ padding: "8px 12px 6px", borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
      <div style={{ fontSize: 12, color: C.text, fontFamily: C.font, fontWeight: 600 }}>
        {fmt(t.inspector.instancesSelected, { count })}
      </div>
      <div style={{ fontSize: 12, color: C.textMuted, fontFamily: C.font, marginTop: 2 }}>
        {t.inspector.sharedOnly}
      </div>
    </div>
  );
}
