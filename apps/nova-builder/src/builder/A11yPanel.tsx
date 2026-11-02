"use client";
import { FloatingPanel, panelPrimary, panelQuiet } from "./FloatingPanel";
import { Icon } from "@/builder/icons";
import { useState, useEffect } from "react";
import { useStore } from "@nanostores/react";
import { $instances, $props, $pages } from "@/lib/data-stores";
import { $a11yPanelOpen, $selectedPageId, $selectedInstanceSelector } from "@/lib/nano-states";
import type { A11yIssue } from "@/app/api/ai/a11y/route";
import type { Instance } from "@webstudio-is/sdk";
import { UI_VARS as C } from "@/lib/uiTheme";
import { useI18n, fmt } from "@/lib/i18n";
import { componentName } from "@/lib/i18n/componentName";


const SEVERITY_COLOR: Record<string, string> = {
  error: C.error, warning: C.warning, info: C.info,
};

function buildInstanceNodes(instances: Map<string, Instance>, props: Map<string, unknown>, rootId: string) {
  const result: { id: string; component: string; props: Record<string, unknown>; textContent?: string }[] = [];
  const visited = new Set<string>();

  const walk = (id: string) => {
    if (visited.has(id)) return;
    visited.add(id);
    const inst = instances.get(id);
    if (!inst) return;
    const instanceProps: Record<string, unknown> = {};
    for (const [, p] of props) {
      const prop = p as { instanceId?: string; name?: string; value?: unknown };
      if (prop.instanceId === id && prop.name) instanceProps[prop.name] = prop.value;
    }
    const textContent = inst.children.filter((c) => c.type === "text").map((c) => (c as { type: "text"; value: string }).value).join(" ");
    result.push({ id, component: inst.component, props: instanceProps, textContent: textContent || undefined });
    for (const child of inst.children) {
      if (child.type === "id") walk(child.value);
    }
  };
  walk(rootId);
  return result;
}

export function A11yPanel() {
  const { t, locale } = useI18n();
  const L = t.tools.a11y;
  const isOpen = useStore($a11yPanelOpen);
  const instances = useStore($instances);
  const props = useStore($props);
  const pages = useStore($pages);
  const selectedPageId = useStore($selectedPageId);
  const [issues, setIssues] = useState<A11yIssue[]>([]);
  const [loading, setLoading] = useState(false);
  const [ran, setRan] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") $a11yPanelOpen.set(false); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen]);

  if (!isOpen) return null;

  const page = pages?.pages.get(selectedPageId ?? pages?.homePageId ?? "") ?? pages?.pages.get(pages?.homePageId ?? "");

  const runCheck = async () => {
    if (!page) return;
    setLoading(true);
    setRan(false);
    const nodes = buildInstanceNodes(instances, props, page.rootInstanceId);
    try {
      const res = await fetch("/api/ai/a11y", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instances: nodes, locale }),
      });
      const json = await res.json() as { issues?: A11yIssue[] };
      setIssues(json.issues ?? []);
      setRan(true);
    } catch {
      setIssues([]);
      setRan(true);
    } finally {
      setLoading(false);
    }
  };

  const errors = issues.filter((i) => i.severity === "error").length;
  const warnings = issues.filter((i) => i.severity === "warning").length;

  return (
    <FloatingPanel label={L.dialogLabel} title={L.title} icon="accessibility" onClose={() => $a11yPanelOpen.set(false)} width={400}>
      <div style={{ padding: "14px 16px", flexShrink: 0, display: "flex", alignItems: "center" }}>
        <button onClick={runCheck} disabled={loading}
          style={panelPrimary(loading)}>
          {loading ? L.checking : L.run}
        </button>
        {ran && (
          <span style={{ marginLeft: 10, fontSize: 13, color: C.textMuted }}>
            {errors > 0 && <span style={{ color: C.error }}>{fmt(L.errors, { count: errors })} </span>}
            {warnings > 0 && <span style={{ color: C.warning }}>{fmt(L.warnings, { count: warnings })} </span>}
            {issues.length === 0 && <span style={{ color: C.success }}>{L.allClear}</span>}
          </span>
        )}
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "0 16px 16px" }}>
        {issues.map((issue) => (
          <div key={`${issue.instanceId}-${issue.rule}`}
            style={{ marginBottom: 10, padding: "12px 14px", borderRadius: 12, border: `1px solid ${SEVERITY_COLOR[issue.severity]}30`, background: `${SEVERITY_COLOR[issue.severity]}08` }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: SEVERITY_COLOR[issue.severity], textTransform: "uppercase" }}>{L.severity[issue.severity] ?? issue.severity}</span>
              <span title={`${issue.component} · ${issue.rule}`} style={{ fontSize: 12, color: C.textMuted }}>{instances.get(issue.instanceId)?.label || componentName(issue.component, t.componentNames)}</span>
              <button
                onClick={() => $selectedInstanceSelector.set([issue.instanceId])}
                style={{ marginLeft: "auto", fontSize: 12, color: C.accent, background: "none", border: "none", cursor: "pointer", padding: 0 }}
              >
                {L.select}
              </button>
            </div>
            <div style={{ fontSize: 13, color: C.text, marginBottom: 4 }}>{L.rules[issue.rule] ?? issue.message}</div>
            <div style={{ fontSize: 12, color: C.textMuted }}>{L.suggestion} {issue.ai ? issue.fix : L.fixes[issue.rule] ?? issue.fix}</div>
          </div>
        ))}
        {ran && issues.length === 0 && (
          <div style={{ textAlign: "center", color: C.success, fontSize: 12, paddingTop: 16 }}>
            {L.noIssues}
          </div>
        )}
      </div>
    </FloatingPanel>
  );
}
