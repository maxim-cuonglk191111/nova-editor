"use client";
// "+ Page" form. The path follows the page name until the user edits it, stays disabled
// while the name is empty, and is only validated after blur or a submit attempt — so the
// form never opens with an error the user did not cause.
import { fieldStyle, primaryButton, quietButton } from "@/builder/controls/formStyles";
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

const field = fieldStyle;

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
    <div style={{ padding: 14, borderBottom: `1px solid ${C.border}`, display: "flex", flexDirection: "column", gap: 10, flexShrink: 0, background: C.surface }}>
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
          border: visibleMessage ? `1px solid ${C.danger}` : field.border,
          color: visibleMessage ? C.danger : C.textMuted,
          opacity: hasName ? 1 : 0.55,
          cursor: hasName ? "text" : "not-allowed",
        }}
      />
      {visibleMessage && <div role="alert" style={{ fontSize: 13, color: C.danger, fontFamily: C.font }}>{visibleMessage}</div>}
      {path.includes("[") && !visibleMessage && (
        <div style={{ fontSize: 13, color: C.accentText, fontFamily: C.font }}>
          {L.pathParamHintBefore} <code style={{ fontFamily: C.fontMono }}>/[slug]</code> {L.pathParamHintAfter}
        </div>
      )}
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={submit} disabled={!hasName} style={{ ...primaryButton(!hasName), flex: 1 }}>
          {L.create}
        </button>
        <button onClick={onCancel} style={quietButton}>
          {L.cancel}
        </button>
      </div>
    </div>
  );
}
