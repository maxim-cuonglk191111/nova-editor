"use client";
import { useState } from "react";
import { createResource } from "@/lib/dataBinding";
import { UI_VARS as C } from "@/lib/uiTheme";
import { useI18n, fmt } from "@/lib/i18n";


const inputStyle: React.CSSProperties = {
  width: "100%", padding: "6px 8px", background: "rgba(255,255,255,0.05)",
  border: `1px solid ${C.border}`, borderRadius: 5, color: C.text,
  fontSize: 13, fontFamily: C.mono, outline: "none", boxSizing: "border-box",
};

type Provider = "contentful" | "airtable" | "notion";

// labelKey indexes t.tools.cms.fields.
const FIELDS: Record<Provider, Array<{ key: string; labelKey: string; placeholder: string }>> = {
  contentful: [
    { key: "spaceId", labelKey: "spaceId", placeholder: "abc123" },
    { key: "environment", labelKey: "environment", placeholder: "master" },
    { key: "token", labelKey: "cdaToken", placeholder: "…" },
  ],
  airtable: [
    { key: "baseId", labelKey: "baseId", placeholder: "appXXXXXXXX" },
    { key: "table", labelKey: "table", placeholder: "Posts" },
    { key: "token", labelKey: "pat", placeholder: "pat…" },
  ],
  notion: [
    { key: "databaseId", labelKey: "databaseId", placeholder: "xxxxxxxx…" },
    { key: "token", labelKey: "integrationToken", placeholder: "secret_…" },
  ],
};

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3, marginBottom: 8 }}>
      <label style={{ fontSize: 12, color: C.textMuted, fontWeight: 600, letterSpacing: "0.04em" }}>{label.toUpperCase()}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={inputStyle} />
    </div>
  );
}

export function CMSPanel() {
  const L = useI18n().t.tools.cms;
  const [provider, setProvider] = useState<Provider>("contentful");
  const [config, setConfig] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [message, setMessage] = useState("");
  const [preview, setPreview] = useState<Record<string, unknown>[]>([]);

  const set = (key: string, value: string) => setConfig((c) => ({ ...c, [key]: value }));

  const test = async () => {
    setStatus("loading"); setMessage(""); setPreview([]);
    try {
      const res = await fetch("/api/cms", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, config }),
      });
      const json = await res.json();
      if (!res.ok) { setStatus("error"); setMessage(json.error ?? L.failed); return; }
      setStatus("ok");
      setMessage(fmt(json.count === 1 ? L.fetchedOne : L.fetchedMany, { count: json.count }));
      setPreview((json.items ?? []).slice(0, 3));
    } catch (err) { setStatus("error"); setMessage(String(err)); }
  };

  const saveAsResource = () => {
    // Persist the connection as a Resource pointing at the CMS proxy.
    const url = `/api/cms?provider=${provider}`;
    createResource(`${provider} CMS`, url, "post");
    setMessage(L.savedAsResource);
  };

  return (
    <div style={{ padding: 12, fontFamily: C.font, color: C.text, overflowY: "auto", height: "100%", boxSizing: "border-box" }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: C.textDim, letterSpacing: "0.04em", marginBottom: 12 }}>{L.title}</div>

      {/* Provider tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 14 }}>
        {(["contentful", "airtable", "notion"] as Provider[]).map((p) => (
          <button key={p} onClick={() => { setProvider(p); setConfig({}); setStatus("idle"); setPreview([]); }}
            style={{
              flex: 1, padding: "5px 0", fontSize: 12, fontWeight: 600, borderRadius: 5, cursor: "pointer",
              border: `1px solid ${provider === p ? "rgba(124,58,237,0.5)" : C.border}`,
              background: provider === p ? "rgba(124,58,237,0.12)" : "transparent",
              color: provider === p ? "#c4b5fd" : C.textMuted, textTransform: "capitalize", fontFamily: C.font,
            }}>{p}</button>
        ))}
      </div>

      {FIELDS[provider].map((f) => (
        <Field key={f.key} label={L.fields[f.labelKey] ?? f.labelKey} value={config[f.key] ?? ""} onChange={(v) => set(f.key, v)} placeholder={f.placeholder} />
      ))}

      <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
        <button onClick={test} disabled={status === "loading"}
          style={{ flex: 1, padding: "6px 0", borderRadius: 5, border: `1px solid ${C.border}`, background: "transparent", color: C.textDim, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          {status === "loading" ? L.testing : L.test}
        </button>
        <button onClick={saveAsResource} disabled={status !== "ok"}
          style={{ flex: 1, padding: "6px 0", borderRadius: 5, border: "none", background: status === "ok" ? "rgba(124,58,237,0.8)" : "rgba(255,255,255,0.06)", color: "#fff", fontSize: 13, fontWeight: 600, cursor: status === "ok" ? "pointer" : "default" }}>
          {L.saveAsResource}
        </button>
      </div>

      {message && (
        <div style={{ fontSize: 13, marginTop: 10, color: status === "error" ? C.danger : status === "ok" ? C.success : C.textDim }}>{message}</div>
      )}

      {preview.length > 0 && (
        <div style={{ marginTop: 12, borderTop: `1px solid ${C.border}`, paddingTop: 10 }}>
          <div style={{ fontSize: 12, color: C.textMuted, fontWeight: 600, marginBottom: 6 }}>{L.preview}</div>
          {preview.map((item, i) => (
            <pre key={i} style={{ fontSize: 9, color: C.textDim, background: "rgba(255,255,255,0.02)", border: `1px solid ${C.border}`, borderRadius: 5, padding: 8, margin: "0 0 6px", overflow: "auto", fontFamily: C.mono }}>
              {JSON.stringify(item, null, 2)}
            </pre>
          ))}
        </div>
      )}
    </div>
  );
}
