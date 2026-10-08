"use client";
import { useState, useEffect, useRef } from "react";
import { useStore } from "@nanostores/react";
import { applyTextFills } from "@/lib/textFills";
import { $instances, $pages, $props } from "@/lib/data-stores";
import { $aiContentPanelOpen, $selectedPageId, $selectedInstanceSelector } from "@/lib/nano-states";
import { $projectMeta } from "@/lib/data-stores";
import { collectTextInstances, isWithin } from "@/lib/textInstances";
import { UI_VARS as C } from "@/lib/uiTheme";
import { useI18n, fmt } from "@/lib/i18n";

type Fill = { instanceId: string; text: string };
type FillState =
  | { type: "idle" }
  | { type: "loading" }
  | { type: "success"; fills: Fill[] }
  | { type: "error"; message: string };

const PREVIEW_ROWS = 4;

export function AIContentPanel() {
  const L = useI18n().t.tools.aiContent;
  const isOpen = useStore($aiContentPanelOpen);
  const instances = useStore($instances);
  const props = useStore($props);
  const pages = useStore($pages);
  const selectedPageId = useStore($selectedPageId);
  const selector = useStore($selectedInstanceSelector);
  const meta = useStore($projectMeta);
  const [topic, setTopic] = useState("");
  const [state, setState] = useState<FillState>({ type: "idle" });
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    textareaRef.current?.focus();
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") $aiContentPanelOpen.set(false); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen]);

  if (!isOpen) return null;

  const page = pages?.pages.get(selectedPageId ?? pages.homePageId) ?? pages?.pages.get(pages?.homePageId ?? "");
  // A selected element on this page narrows the fill to its text ("change one section").
  const selectedId = selector?.[0];
  const scopeId = selectedId && page && selectedId !== page.rootInstanceId && isWithin(instances, page.rootInstanceId, selectedId) ? selectedId : page?.rootInstanceId;
  const scoped = scopeId !== page?.rootInstanceId ? instances.get(scopeId ?? "") : undefined;
  const textInstances = scopeId ? collectTextInstances(instances, scopeId, props) : [];
  const found = scoped
    ? fmt(L.foundSelection, { count: textInstances.length, name: scoped.label ?? scoped.component })
    : fmt(L.found, { count: textInstances.length });

  const handleFill = async () => {
    if (!topic.trim() || !textInstances.length) return;
    setState({ type: "loading" });
    try {
      const res = await fetch("/api/ai/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topic.trim(), instances: textInstances, projectId: meta?.id }),
      });
      const json = await res.json() as { fills?: Fill[]; error?: string };
      if (!res.ok) { setState({ type: "error", message: res.status === 502 ? L.failed : json.error ?? L.failed }); return; }
      const fills = json.fills ?? [];
      setState(fills.length ? { type: "success", fills } : { type: "error", message: L.failed });
    } catch (err) {
      setState({ type: "error", message: String(err) });
    }
  };

  const handleApply = () => {
    if (state.type !== "success") return;
    applyTextFills(state.fills);
    $aiContentPanelOpen.set(false);
    setTopic("");
    setState({ type: "idle" });
  };

  const isLoading = state.type === "loading";
  const before = new Map(textInstances.map((t) => [t.instanceId, t.currentText]));

  return (
    <div
      role="dialog"
      aria-label={L.dialogLabel}
      style={{
        position: "fixed", top: 52, left: "50%", transform: "translateX(-50%)",
        width: 500, maxWidth: "calc(100vw - 32px)", zIndex: 100,
        background: C.bg, border: `1px solid ${C.border}`, borderRadius: 14,
        boxShadow: "0 12px 48px rgba(0,0,0,0.6)", fontFamily: C.font, overflow: "hidden",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 18px", borderBottom: `1px solid ${C.border}` }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#a78bfa" }}>{L.title}</span>
        <button onClick={() => $aiContentPanelOpen.set(false)}
          style={{ background: "none", border: "none", color: C.textMuted, cursor: "pointer", fontSize: 18, padding: "2px 4px" }}>×</button>
      </div>
      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ fontSize: 13, color: C.textMuted }}>{found}</div>
        <textarea
          ref={textareaRef}
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleFill(); }}
          placeholder={L.placeholder}
          rows={2}
          disabled={isLoading}
          style={{ width: "100%", background: C.input, border: `1px solid ${C.inputBorder}`, borderRadius: 8, color: C.text, fontSize: 12, fontFamily: C.font, padding: "9px 12px", resize: "none", outline: "none", boxSizing: "border-box", opacity: isLoading ? 0.5 : 1 }}
        />
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            onClick={handleFill}
            disabled={isLoading || !topic.trim() || !textInstances.length}
            style={{ padding: "6px 16px", borderRadius: 6, border: "none", background: isLoading || !topic.trim() ? "rgba(124,58,237,0.25)" : "linear-gradient(135deg, #7c3aed, #6d28d9)", color: "#fff", fontSize: 12, fontFamily: C.font, fontWeight: 700, cursor: isLoading ? "default" : "pointer" }}
          >
            {isLoading ? L.generating : L.fill}
          </button>
        </div>
        {state.type === "error" && (
          <div role="alert" style={{ padding: "9px 12px", borderRadius: 7, background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.3)", color: C.danger, fontSize: 13 }}>
            {state.message}
          </div>
        )}
        {state.type === "success" && (
          <div style={{ padding: 12, borderRadius: 8, background: "rgba(5,150,105,0.07)", border: "1px solid rgba(5,150,105,0.25)", display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ color: C.success, fontSize: 12, fontWeight: 600 }}>{fmt(L.filled, { count: state.fills.length })}</div>
            <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 4 }}>
              {state.fills.slice(0, PREVIEW_ROWS).map((f) => (
                <li key={f.instanceId} style={{ fontSize: 12, color: C.text, lineHeight: 1.4 }}>
                  <span style={{ color: C.textMuted, textDecoration: "line-through" }}>{(before.get(f.instanceId) ?? "").slice(0, 60)}</span>
                  {" → "}{f.text.slice(0, 80)}
                </li>
              ))}
            </ul>
            {state.fills.length > PREVIEW_ROWS && (
              <div style={{ fontSize: 12, color: C.textMuted }}>{fmt(L.more, { count: state.fills.length - PREVIEW_ROWS })}</div>
            )}
            <div style={{ display: "flex", gap: 6, alignItems: "center", justifyContent: "flex-end" }}>
              <span style={{ fontSize: 12, color: C.textMuted, marginRight: "auto" }}>{L.undoHint}</span>
              <button onClick={() => setState({ type: "idle" })} style={{ padding: "4px 10px", borderRadius: 5, border: `1px solid ${C.border}`, background: "transparent", color: C.textMuted, fontSize: 13, fontFamily: C.font, cursor: "pointer" }}>{L.discard}</button>
              <button onClick={handleApply} style={{ padding: "4px 14px", borderRadius: 5, border: "none", background: C.success, color: "#fff", fontSize: 13, fontFamily: C.font, fontWeight: 700, cursor: "pointer" }}>{L.apply}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
