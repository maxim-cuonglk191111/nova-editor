"use client";
import { useState, useEffect } from "react";
import { useStore } from "@nanostores/react";
import { $instances, $props, $dataSources } from "@/lib/data-stores";
import { $selectedInstanceId, $registeredComponentMetas, $pendingCanvasMsg } from "@/lib/nano-states";
import { updateData } from "@/lib/transactions";
import { decodeExpression } from "@/lib/expression";
import { BindingPopover } from "./BindingPopover";
import { ImageLibraryPicker } from "./ImageLibraryPicker";
import { VariantOverrideHint } from "./VariantOverrideHint";
import { nanoid } from "nanoid";
import { UI_VARS as C, FONT } from "@/lib/uiTheme";
import { useI18n } from "@/lib/i18n";
import { writeProp, type AnyProp } from "@/lib/propWriteHelper";

type MetaPropDef = {
  type?: string;
  control?: string;
  label?: string;
  defaultValue?: unknown;
  options?: Array<string | { label: string; name: string }>;
  description?: string;
};

const SELECT_CONTROLS = new Set(["select", "tag", "radio"]);

// Framework/optimizer props with no visible effect in a Nova site — hidden so the
// Props tab only shows what a site owner can act on.
const HIDDEN_META_PROPS = new Set(["prefetch", "preventScrollReset", "reloadDocument", "replace", "optimize", "quality", "disabled"]);
// HTML plumbing the AI/templates set on elements (button type, ids, form action…):
// meaningless to a site owner and easy to break, so not listed under custom props.
const HIDDEN_ADHOC_PROPS = new Set(["type", "id", "class", "className", "action", "method", "role", "tabIndex", "htmlFor", "for", "name", "autoComplete"]);

// ── Image Source Control ─────────────────────────────────────────────────────
// Dedicated UI for setting an Image component's src — URL paste + library button.
function ImageSrcControl({
  instanceId,
  current,
  inputStyle,
}: {
  instanceId: string;
  current: AnyProp | undefined;
  inputStyle: React.CSSProperties;
}) {
  const P = useI18n().t.inspector.props;
  const src = typeof current?.value === "string" ? current.value : "";
  const [localUrl, setLocalUrl] = useState(src);
  const [isFocused, setIsFocused] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);

  // Keep local state in sync when the prop changes externally
  useEffect(() => {
    if (!isFocused) setLocalUrl(typeof current?.value === "string" ? current.value : "");
  }, [current?.value, isFocused]);

  function commit(value: string) {
    writeProp(instanceId, "src", value, "string");
  }

  const isValidPreview =
    src.startsWith("http") || src.startsWith("/") || src.startsWith("data:");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {/* Thumbnail preview */}
      {isValidPreview && (
        <div
          style={{
            width: "100%", height: 80, borderRadius: 4, overflow: "hidden",
            border: `1px solid ${C.inputBorder}`, background: "#111",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={P.previewAlt}
            style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        </div>
      )}

      {/* URL input */}
      <input
        type="url"
        value={localUrl}
        placeholder="https://example.com/image.png"
        style={inputStyle}
        onFocus={() => setIsFocused(true)}
        onChange={(e) => setLocalUrl(e.target.value)}
        onBlur={(e) => { setIsFocused(false); commit(e.target.value); }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            commit(localUrl);
            (e.target as HTMLInputElement).blur();
          }
        }}
      />

      <button
        aria-expanded={libraryOpen}
        onClick={() => setLibraryOpen((v) => !v)}
        style={{
          padding: "5px 10px",
          background: "none",
          border: `1px solid ${C.inputBorder}`,
          borderRadius: 4,
          color: C.textMuted,
          fontSize: 12,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 6,
          width: "100%",
          justifyContent: "center",
          transition: "border-color 0.15s, color 0.15s",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.borderColor = C.accentLight;
          (e.currentTarget as HTMLButtonElement).style.color = C.accentLight;
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.borderColor = C.inputBorder;
          (e.currentTarget as HTMLButtonElement).style.color = C.textMuted;
        }}
      >
        <span>📁</span>
        <span>{P.pickFromLibrary}</span>
      </button>
      {libraryOpen && (
        <ImageLibraryPicker
          current={src}
          onPick={(url) => { commit(url); setLibraryOpen(false); }}
        />
      )}
    </div>
  );
}

function PropControl({
  instanceId, name, meta, current,
}: {
  instanceId: string;
  name: string;
  meta: MetaPropDef;
  current: AnyProp | undefined;
}) {
  const { t } = useI18n();
  const P = t.inspector.props;
  const F = t.inspector.form;
  const value = current?.value;
  const displayValue = value !== undefined ? value : meta.defaultValue;

  const inputStyle = {
    background: C.input, border: `1px solid ${C.inputBorder}`, borderRadius: 4,
    color: C.text, fontSize: 13, fontFamily: C.fontMono,
    padding: "3px 6px", width: "100%", boxSizing: "border-box" as const, outline: "none",
  };

  if (meta.control === "color" || meta.type === "color") {
    return (
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        <input
          type="color"
          value={typeof displayValue === "string" ? displayValue : "#000000"}
          onChange={(e) => writeProp(instanceId, name, e.target.value, "string")}
          style={{ width: 28, height: 24, padding: 1, border: `1px solid ${C.inputBorder}`, borderRadius: 4, background: "none", cursor: "pointer" }}
        />
        <input
          type="text"
          value={typeof displayValue === "string" ? displayValue : ""}
          onChange={(e) => writeProp(instanceId, name, e.target.value, "string")}
          style={{ ...inputStyle, flex: 1 }}
        />
      </div>
    );
  }

  if (meta.options?.length && (SELECT_CONTROLS.has(meta.control ?? "") || meta.type === "enum")) {
    // Generated metas list plain strings ("_blank"); hand-written ones use { label, name }.
    const options = meta.options.map((o) =>
      typeof o === "string" ? { name: o, label: P.optionLabels[o] ?? o } : { name: o.name, label: P.optionLabels[o.name] ?? o.label });
    return (
      <select
        value={typeof displayValue === "string" ? displayValue : ""}
        onChange={(e) => writeProp(instanceId, name, e.target.value, "string")}
        style={{ ...inputStyle, fontFamily: C.font }}
      >
        <option value="">{P.defaultOption}</option>
        {options.map((opt) => (
          <option key={opt.name} value={opt.name}>{opt.label}</option>
        ))}
      </select>
    );
  }

  if (meta.type === "boolean" || meta.control === "boolean") {
    return (
      <select
        value={displayValue === true ? "true" : displayValue === false ? "false" : ""}
        onChange={(e) => writeProp(instanceId, name, e.target.value === "true", "boolean")}
        style={{ ...inputStyle, fontFamily: C.font }}
      >
        <option value="">{P.defaultOption}</option>
        <option value="true">{F.yes}</option>
        <option value="false">{F.no}</option>
      </select>
    );
  }

  // Image src: dedicated control with URL paste + library button
  if (meta.control === "file" && name === "src") {
    return <ImageSrcControl instanceId={instanceId} current={current} inputStyle={inputStyle} />;
  }

  if (meta.control === "url" || name === "href" || name === "src" || name === "action") {
    return (
      <input
        type="url"
        value={typeof displayValue === "string" ? displayValue : ""}
        onChange={(e) => writeProp(instanceId, name, e.target.value, "string")}
        placeholder="https://"
        style={inputStyle}
      />
    );
  }

  if (meta.type === "number") {
    return (
      <input
        type="number"
        value={typeof displayValue === "number" ? displayValue : ""}
        onChange={(e) => writeProp(instanceId, name, Number(e.target.value), "number")}
        style={inputStyle}
      />
    );
  }

  return (
    <input
      type="text"
      value={typeof displayValue === "string" || typeof displayValue === "number" ? String(displayValue) : ""}
      onChange={(e) => writeProp(instanceId, name, e.target.value, "string")}
      style={inputStyle}
    />
  );
}

// A single prop row: label + bind toggle + either the plain control or, when
// the prop is bound to an expression, a read-only "bound" chip. Owns only the
// binding affordance (SRP) — value editing stays in PropControl.
function PropRow({
  instanceId,
  name,
  label,
  meta,
  current,
}: {
  instanceId: string;
  name: string;
  label: string;
  meta: MetaPropDef;
  current: AnyProp | undefined;
}) {
  const { t } = useI18n();
  const dataSources = useStore($dataSources);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const isBound = current?.type === "expression";
  const boundExpression = isBound ? (current!.value as string) : undefined;

  return (
    <div style={{ padding: "4px 12px", display: "flex", flexDirection: "column", gap: 3 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <label style={{ fontSize: 12, color: C.textMuted, fontWeight: 600, letterSpacing: "0.04em", flex: 1 }}>
          {label}
        </label>
        {meta.description && (
          <span title={meta.description} style={{ fontSize: 12, color: C.textMuted, cursor: "help" }}>?</span>
        )}
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setPopoverOpen((v) => !v)}
            title={t.builder.bindProp}
            style={{
              background: "none",
              border: "none",
              color: isBound ? C.accentLight : C.textMuted,
              fontSize: 13,
              cursor: "pointer",
              padding: "0 2px",
              lineHeight: 1,
            }}
          >
            {isBound ? "⚡" : "⚡"}
          </button>
          {popoverOpen && (
            <BindingPopover
              instanceId={instanceId}
              propName={name}
              boundExpression={boundExpression}
              onClose={() => setPopoverOpen(false)}
            />
          )}
        </div>
      </div>
      {isBound ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "4px 8px",
            borderRadius: 4,
            border: `1px solid ${C.accentLight}`,
            background: "rgba(124,58,237,0.08)",
            color: C.accentLight,
            fontSize: FONT.xs,
            fontFamily: C.fontMono,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
          title={decodeExpression(boundExpression ?? "", dataSources)}
        >
          <span style={{ flexShrink: 0 }}>⚡</span>
          {decodeExpression(boundExpression ?? "", dataSources) || t.builder.bindBound}
        </div>
      ) : (
        <PropControl instanceId={instanceId} name={name} meta={meta} current={current} />
      )}
      {name === "variant" && <VariantOverrideHint instanceId={instanceId} />}
    </div>
  );
}

const TEXT_EDITABLE_COMPONENTS = new Set([
  "Heading", "Paragraph", "Text", "Button", "Link", "Label",
  "RichText", "Bold", "Italic", "Span",
]);

function TextContentField({ instanceId, instance }: { instanceId: string; instance: { component: string; children: { type: string; value: string }[] } }) {
  const plainText = instance.children
    .filter((c) => c.type === "text")
    .map((c) => c.value)
    .join("");
  const P = useI18n().t.inspector.props;
  const [localValue, setLocalValue] = useState(plainText);
  const [isFocused, setIsFocused] = useState(false);

  // Sync when the instance changes externally (e.g. canvas commit), but not while user is typing.
  useEffect(() => {
    if (!isFocused) setLocalValue(plainText);
  }, [plainText, isFocused]);

  function commit(value: string) {
    const newChildren: { type: "text"; value: string }[] = [{ type: "text", value }];
    updateData(({ instances: draft }) => {
      const inst = draft.get(instanceId);
      if (!inst) return;
      const nonText = inst.children.filter((c) => c.type !== "text");
      draft.set(instanceId, {
        ...inst,
        children: [...newChildren, ...nonText],
      } as Parameters<typeof draft.set>[1]);
    });
    // Also bridge directly to canvas via postMessage in case the SyncClient
    // emitter chain hasn't connected (startup race on demo project).
    $pendingCanvasMsg.set({ type: "nova:instanceChildren", instanceId, children: newChildren });
  }

  return (
    <div style={{ padding: "4px 12px 8px", borderBottom: `1px solid ${C.border}` }}>
      <label style={{ fontSize: 12, color: C.textMuted, fontWeight: 600, letterSpacing: "0.04em", display: "block", marginBottom: 4 }}>
        {P.content}
      </label>
      <textarea
        value={localValue}
        rows={3}
        onChange={(e) => setLocalValue(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={(e) => { setIsFocused(false); commit(e.target.value); }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            commit(localValue);
            (e.target as HTMLTextAreaElement).blur();
          }
        }}
        style={{
          background: C.input, border: `1px solid ${C.inputBorder}`, borderRadius: 4,
          color: C.text, fontSize: 13, fontFamily: C.fontMono,
          padding: "5px 8px", width: "100%", boxSizing: "border-box" as const,
          outline: "none", resize: "vertical", lineHeight: 1.5,
        }}
      />
      <div style={{ fontSize: 11, color: C.textMuted, marginTop: 3 }}>
        {P.contentHint}
      </div>
    </div>
  );
}

export function PropsEditorPanel() {
  const P = useI18n().t.inspector.props;
  const instanceId = useStore($selectedInstanceId);
  const instances = useStore($instances);
  const props = useStore($props) as Map<string, AnyProp>;
  const metas = useStore($registeredComponentMetas);

  if (!instanceId) {
    return (
      <div style={{ padding: 16, fontSize: 13, color: C.textMuted, fontFamily: C.font }}>
        {P.selectElement}
      </div>
    );
  }

  const instance = instances.get(instanceId);
  if (!instance) return null;

  const meta = metas.get(instance.component);
  const metaProps: Record<string, MetaPropDef> = (meta as any)?.props ?? {};

  // Props from meta definition
  const metaKeys = Object.keys(metaProps).filter((k) => !k.startsWith("data-ws") && !HIDDEN_META_PROPS.has(k));

  // Ad-hoc props (on the instance but not in meta)
  const instanceProps: AnyProp[] = [];
  const metaKeySet = new Set(metaKeys);
  for (const p of props.values()) {
    if (p.instanceId !== instanceId) continue;
    if (p.name === "_legacyClasses" || p.name.startsWith("data-ws") || HIDDEN_ADHOC_PROPS.has(p.name)) continue;
    if (!metaKeySet.has(p.name)) instanceProps.push(p);
  }

  const propMap = new Map<string, AnyProp>();
  for (const p of props.values()) {
    if (p.instanceId === instanceId) propMap.set(p.name, p);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: C.bg, overflow: "hidden" }}>
      {/* Instance header */}
      <div style={{ padding: "8px 12px 6px", borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
        <div style={{ fontSize: 12, color: C.text, fontWeight: 600 }}>
          {(instance as { label?: string }).label || instance.component}
        </div>
        <div style={{ fontSize: 12, color: C.textMuted, fontFamily: C.fontMono, marginTop: 2 }}>
          {instance.component}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
        {/* Inline text content editor — shown for text-capable components */}
        {TEXT_EDITABLE_COMPONENTS.has(instance.component.split(":").pop() ?? instance.component) && (
          <TextContentField key={instanceId} instanceId={instanceId} instance={instance as { component: string; children: { type: string; value: string }[] }} />
        )}

        {/* Meta-defined props */}
        {metaKeys.length > 0 && (
          <>
            <div style={{ padding: "4px 12px 2px", fontSize: 9, color: C.textMuted, letterSpacing: "0.08em", textTransform: "uppercase" }}>
              {P.componentProps}
            </div>
            {metaKeys.map((key) => {
              const def = metaProps[key];
              const label = P.propLabels[key] ?? def.label ?? key;
              return (
                <PropRow key={key} instanceId={instanceId} name={key} label={label} meta={def} current={propMap.get(key)} />
              );
            })}
          </>
        )}

        {/* Ad-hoc props not in meta */}
        {instanceProps.length > 0 && (
          <>
            <div style={{ padding: "8px 12px 2px", fontSize: 9, color: C.textMuted, letterSpacing: "0.08em", textTransform: "uppercase" }}>
              {P.customProps}
            </div>
            {instanceProps.sort((a, b) => a.name.localeCompare(b.name)).map((p) => (
              <PropRow key={p.id} instanceId={instanceId} name={p.name} label={P.propLabels[p.name] ?? p.name} meta={{ type: p.type }} current={p} />
            ))}
          </>
        )}

        {metaKeys.length === 0 && instanceProps.length === 0 && (
          <div style={{ padding: "12px", fontSize: 13, color: C.textMuted, fontFamily: C.font }}>
            {P.noProps}
          </div>
        )}
      </div>
    </div>
  );
}
