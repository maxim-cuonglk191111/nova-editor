"use client";
// "+ Page" form. The path follows the page name until the user edits it, stays disabled
// while the name is empty, and is only validated after blur or a submit attempt — so the
// form never opens with an error the user did not cause.
import { useRef, useState } from "react";
import { toSlug } from "./usePageCrud";
import { normalizePagePath, pathIssue } from "./pagePathRules";
import { UI_VARS as C } from "@/lib/uiTheme";
import { useI18n } from "@/lib/i18n";

type Props = {
  existing: { id: string; path: string }[];
  onCreate: (name: string, path: string) => boolean;
  onCancel: () => void;
};

const field: React.CSSProperties = {
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(139,92,246,0.4)",
  borderRadius: 4,
  color: C.text,
  fontSize: 13,
  fontFamily: C.font,
  padding: "5px 8px",
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
};

export function NewPageForm({ existing, onCreate, onCancel }: Props) {
  const L = useI18n().t.sidebar.pages;
  const [name, setName] = useState("");
  const [path, setPath] = useState("");
  const [pathEdited, setPathEdited] = useState(false);
  const [showIssue, setShowIssue] = useState(false);
  const pathRef = useRef<HTMLInputElement>(null);

  const hasName = Boolean(name.trim());
  const issue = pathIssue(path, existing);
  const message = issue === "required" ? L.pathRequired : issue === "reserved" ? L.rootPathReserved : issue === "collision" ? L.pathCollisionError : null;
  const visibleMessage = showIssue ? message : null;

  function onNameChange(value: string) {
    setName(value);
    if (!pathEdited) {
      const slug = toSlug(value);
      setPath(slug ? `/${slug}` : "");
    }
  }

  function submit() {
    if (!hasName) return;
    if (issue) {
      setShowIssue(true);
      pathRef.current?.focus();
      return;
    }
    if (onCreate(name.trim(), normalizePagePath(path))) onCancel();
  }

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") submit();
    if (e.key === "Escape") onCancel();
  };

  return (
    <div style={{ padding: "8px 10px", borderBottom: `1px solid ${C.border}`, display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}>
      <input autoFocus value={name} onChange={(e) => onNameChange(e.target.value)} placeholder={L.pageName} onKeyDown={onKey} style={field} />
      <input
        ref={pathRef}
        value={path}
        disabled={!hasName}
        onChange={(e) => { setPath(e.target.value); setPathEdited(true); }}
        onBlur={() => { if (path) setShowIssue(true); }}
        placeholder={L.pathAutoPlaceholder}
        aria-invalid={Boolean(visibleMessage)}
        onKeyDown={onKey}
        style={{
          ...field,
          border: visibleMessage ? `1px solid ${C.danger}` : "1px solid rgba(255,255,255,0.1)",
          color: visibleMessage ? C.danger : C.textMuted,
          fontFamily: C.fontMono,
          opacity: hasName ? 1 : 0.5,
          cursor: hasName ? "text" : "not-allowed",
        }}
      />
      {visibleMessage && <div role="alert" style={{ fontSize: 12, color: C.danger, fontFamily: C.font }}>{visibleMessage}</div>}
      {path.includes("[") && !visibleMessage && (
        <div style={{ fontSize: 11, color: C.accentText, fontFamily: C.font }}>
          {L.pathParamHintBefore} <code style={{ fontFamily: C.fontMono }}>/[slug]</code> {L.pathParamHintAfter}
        </div>
      )}
      <div style={{ display: "flex", gap: 6 }}>
        <button
          onClick={submit}
          disabled={!hasName}
          style={{
            flex: 1, padding: "6px 0", background: "#7c3aed", border: "1px solid #7c3aed", borderRadius: 4,
            color: "#ffffff", fontWeight: 600, fontSize: 13, fontFamily: C.font,
            opacity: hasName ? 1 : 0.4, cursor: hasName ? "pointer" : "not-allowed",
          }}
        >
          {L.create}
        </button>
        <button onClick={onCancel} style={{ padding: "6px 12px", background: "none", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 4, color: C.textMuted, fontSize: 13, fontFamily: C.font, cursor: "pointer" }}>
          {L.cancel}
        </button>
      </div>
    </div>
  );
}
