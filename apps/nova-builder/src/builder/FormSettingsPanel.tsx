"use client";
import { useStore } from "@nanostores/react";
import { nanoid } from "nanoid";
import { $instances, $props } from "@/lib/data-stores";
import { $selectedInstanceId } from "@/lib/nano-states";
import { updateData } from "@/lib/transactions";
import { UI_VARS as C } from "@/lib/uiTheme";
import { useI18n } from "@/lib/i18n";

export const FORM_COMPONENTS = new Set([
  "Form", "WebhookForm",
  "Input", "Textarea", "Select",
  "Label", "Checkbox", "Button",
]);


type AnyProp = { id: string; instanceId: string; name: string; type: string; value: unknown };

const inputSt: React.CSSProperties = {
  background: C.input,
  border: `1px solid ${C.inputBorder}`,
  borderRadius: 4,
  color: C.text,
  fontSize: 13,
  fontFamily: C.mono,
  padding: "4px 8px",
  width: "100%",
  boxSizing: "border-box",
  outline: "none",
};

const selectSt: React.CSSProperties = {
  ...inputSt,
  fontFamily: C.font,
  cursor: "pointer",
};

// ── Field configs per component ───────────────────────────────────────────────

type FieldDef = {
  name: string;
  /** Key into t.inspector.form.fields. */
  labelKey: string;
  control: "text" | "select" | "boolean" | "number";
  options?: string[];
  placeholder?: string;
};

const FIELDS: Record<string, FieldDef[]> = {
  Form: [
    { name: "action", labelKey: "actionUrl", control: "text", placeholder: "https://..." },
    { name: "method", labelKey: "method", control: "select", options: ["get", "post"] },
    { name: "id", labelKey: "id", control: "text", placeholder: "form-id" },
  ],
  WebhookForm: [
    { name: "action", labelKey: "webhookUrl", control: "text", placeholder: "https://..." },
    { name: "state", labelKey: "state", control: "select", options: ["", "success", "error"] },
    { name: "id", labelKey: "id", control: "text", placeholder: "form-id" },
  ],
  Input: [
    { name: "type", labelKey: "type", control: "select", options: ["text","email","password","number","tel","url","search","date","time","checkbox","radio","file","hidden"] },
    { name: "name", labelKey: "name", control: "text", placeholder: "field-name" },
    { name: "placeholder", labelKey: "placeholder", control: "text", placeholder: "Enter value…" },
    { name: "value", labelKey: "defaultValue", control: "text" },
    { name: "required", labelKey: "required", control: "boolean" },
    { name: "autofocus", labelKey: "autofocus", control: "boolean" },
    { name: "min", labelKey: "min", control: "text", placeholder: "0" },
    { name: "max", labelKey: "max", control: "text", placeholder: "100" },
    { name: "pattern", labelKey: "pattern", control: "text", placeholder: "[A-Za-z]+" },
    { name: "id", labelKey: "id", control: "text" },
  ],
  Textarea: [
    { name: "name", labelKey: "name", control: "text", placeholder: "field-name" },
    { name: "placeholder", labelKey: "placeholder", control: "text" },
    { name: "rows", labelKey: "rows", control: "number" },
    { name: "required", labelKey: "required", control: "boolean" },
    { name: "id", labelKey: "id", control: "text" },
  ],
  Select: [
    { name: "name", labelKey: "name", control: "text", placeholder: "field-name" },
    { name: "required", labelKey: "required", control: "boolean" },
    { name: "multiple", labelKey: "multiple", control: "boolean" },
    { name: "id", labelKey: "id", control: "text" },
  ],
  Label: [
    { name: "htmlFor", labelKey: "forField", control: "text", placeholder: "input-id" },
  ],
  Checkbox: [
    { name: "name", labelKey: "name", control: "text", placeholder: "field-name" },
    { name: "value", labelKey: "value", control: "text", placeholder: "on" },
    { name: "checked", labelKey: "checked", control: "boolean" },
    { name: "required", labelKey: "required", control: "boolean" },
    { name: "id", labelKey: "id", control: "text" },
  ],
  Button: [
    { name: "type", labelKey: "type", control: "select", options: ["submit","button","reset"] },
    { name: "disabled", labelKey: "disabled", control: "boolean" },
    { name: "id", labelKey: "id", control: "text" },
  ],
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function getPropMap(props: Map<string, AnyProp>, instanceId: string): Map<string, AnyProp> {
  const m = new Map<string, AnyProp>();
  for (const p of props.values()) {
    if (p.instanceId === instanceId) m.set(p.name, p);
  }
  return m;
}

function writeProp(instanceId: string, name: string, rawValue: string, type: string) {
  let value: unknown = rawValue;
  if (type === "number") value = rawValue === "" ? undefined : Number(rawValue);
  if (type === "boolean") value = rawValue === "true";
  updateData(({ props: draft }) => {
    const current = draft as Map<string, AnyProp>;
    const existing = [...current.values()].find((p) => p.instanceId === instanceId && p.name === name);
    if (existing) {
      current.set(existing.id, { ...existing, value });
    } else {
      const id = `prop_${nanoid(8)}`;
      current.set(id, { id, instanceId, name, type, value });
    }
  });
}

// ── Section ───────────────────────────────────────────────────────────────────

function FieldRow({ field, instanceId, propMap }: { field: FieldDef; instanceId: string; propMap: Map<string, AnyProp> }) {
  const F = useI18n().t.inspector.form;
  const existing = propMap.get(field.name);
  const rawVal = existing ? String(existing.value ?? "") : "";

  return (
    <div style={{ padding: "4px 12px", display: "flex", flexDirection: "column", gap: 3 }}>
      <label style={{ fontSize: 12, color: C.textMuted, fontFamily: C.font, fontWeight: 600, letterSpacing: "0.04em" }}>
        {F.fields[field.labelKey] ?? field.labelKey}
      </label>
      {field.control === "boolean" ? (
        <select
          value={rawVal || "false"}
          onChange={(e) => writeProp(instanceId, field.name, e.target.value, "boolean")}
          style={selectSt}
        >
          <option value="false">false</option>
          <option value="true">true</option>
        </select>
      ) : field.control === "select" ? (
        <select
          value={rawVal}
          onChange={(e) => writeProp(instanceId, field.name, e.target.value, "string")}
          style={selectSt}
        >
          {(field.options ?? []).map((opt) => (
            <option key={opt} value={opt}>{opt || F.defaultOption}</option>
          ))}
        </select>
      ) : (
        <input
          type={field.control === "number" ? "number" : "text"}
          placeholder={field.placeholder}
          value={rawVal}
          onChange={(e) => writeProp(instanceId, field.name, e.target.value, field.control === "number" ? "number" : "string")}
          style={inputSt}
        />
      )}
    </div>
  );
}

// ── Panel ─────────────────────────────────────────────────────────────────────

export function FormSettingsPanel() {
  const F = useI18n().t.inspector.form;
  const instanceId = useStore($selectedInstanceId);
  const instances = useStore($instances);
  const props = useStore($props) as Map<string, AnyProp>;

  if (!instanceId) {
    return (
      <div style={{ padding: 16, fontSize: 13, color: C.textMuted, fontFamily: C.font }}>
        {F.selectElement}
      </div>
    );
  }

  const instance = instances.get(instanceId);
  if (!instance) return null;

  const fields = FIELDS[instance.component] ?? [];
  const propMap = getPropMap(props, instanceId);

  return (
    <div style={{ height: "100%", background: C.bg, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ padding: "8px 12px 6px", borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
        <div style={{ fontSize: 12, color: C.text, fontFamily: C.font, fontWeight: 600 }}>
          {(instance as { label?: string }).label || instance.component}
        </div>
        <div style={{ fontSize: 12, color: C.textMuted, fontFamily: C.mono, marginTop: 2 }}>
          {instance.component}
        </div>
      </div>

      {/* Fields */}
      <div style={{ flex: 1, overflowY: "auto", padding: "6px 0" }}>
        {fields.length === 0 ? (
          <div style={{ padding: "8px 12px", fontSize: 13, color: C.textMuted, fontFamily: C.font }}>
            {F.noSettings}
          </div>
        ) : (
          fields.map((f) => (
            <FieldRow key={f.name} field={f} instanceId={instanceId} propMap={propMap} />
          ))
        )}
      </div>
    </div>
  );
}
