"use client";
import React from "react";
import { useStore } from "@nanostores/react";
import { $instances } from "@/lib/data-stores";
import { $selectedInstanceId, $selectedInstanceSelector, $multiSelectedInstanceIds } from "@/lib/nano-states";
import { $canUndo, $canRedo, undo, redo } from "@/lib/history";
import { useI18n, fmt } from "@/lib/i18n";
import { UI_VARS as C, UI_SHAPE as S } from "@/lib/uiTheme";
import { Icon } from "./icons";

function buildAncestors(
  instanceId: string,
  instances: ReturnType<typeof $instances.get>
): Array<{ id: string; label: string }> {
  // Build a parent map from the instances tree.
  const parent = new Map<string, string>();
  for (const [id, inst] of instances) {
    for (const child of inst.children) {
      if (child.type === "id") parent.set(child.value, id);
    }
  }

  const chain: Array<{ id: string; label: string }> = [];
  let current: string | undefined = instanceId;
  while (current !== undefined) {
    const inst = instances.get(current);
    if (!inst) break;
    chain.unshift({ id: current, label: inst.label ?? inst.component });
    current = parent.get(current);
  }
  return chain;
}

const btnBase: React.CSSProperties = {
  background: "none",
  border: "none",
  cursor: "pointer",
  width: 32,
  height: 32,
  borderRadius: S.radiusSm,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
};

// The bar under the canvas: undo and redo, then the path from the page down to the selected element.
export function Footer() {
  const { t } = useI18n();
  const selectedId = useStore($selectedInstanceId);
  const multiSelectedIds = useStore($multiSelectedInstanceIds);
  const instances = useStore($instances);
  const canUndo = useStore($canUndo);
  const canRedo = useStore($canRedo);

  const isMultiSelect = multiSelectedIds.length > 1;
  const ancestors =
    !isMultiSelect && selectedId !== undefined ? buildAncestors(selectedId, instances) : [];

  return (
    <div
      style={{
        gridArea: "footer",
        height: 36,
        background: C.card,
        borderTop: `1px solid ${C.border}`,
        display: "flex",
        alignItems: "center",
        padding: "0 8px",
        gap: 0,
        overflow: "hidden",
        flexShrink: 0,
        fontFamily: C.font,
      }}
    >
      <button
        onClick={undo}
        disabled={!canUndo}
        title={t.chrome.undoTitle}
        aria-label={t.chrome.undoTitle}
        style={{ ...btnBase, color: canUndo ? C.text : C.muted, cursor: canUndo ? "pointer" : "default" }}
      >
        <Icon name="undo" size={18} />
      </button>
      <button
        onClick={redo}
        disabled={!canRedo}
        title={t.chrome.redoTitle}
        aria-label={t.chrome.redoTitle}
        style={{ ...btnBase, color: canRedo ? C.text : C.muted, cursor: canRedo ? "pointer" : "default", marginRight: 8 }}
      >
        <Icon name="redo" size={18} />
      </button>

      <div style={{ width: 1, height: 16, background: C.border, marginRight: 8, flexShrink: 0 }} />

      {isMultiSelect ? (
        <span
          style={{
            fontSize: 13,
            color: C.accentText,
            background: C.accentBg,
            border: `1px solid ${C.accentBorder}`,
            borderRadius: S.radiusPill,
            padding: "2px 10px",
          }}
        >
          {fmt(t.chrome.multiSelected, { count: multiSelectedIds.length })}
        </span>
      ) : ancestors.length === 0 ? (
        <span style={{ fontSize: 13, color: C.textMuted }}>
          {t.chrome.noSelection}
        </span>
      ) : (
        ancestors.map((item, i) => (
          <span key={item.id} style={{ display: "flex", alignItems: "center" }}>
            {i > 0 && (
              <span style={{ color: C.muted, margin: "0 2px", display: "inline-flex" }}>
                <Icon name="caretRight" size={12} weight="bold" />
              </span>
            )}
            <button
              onClick={() => { $selectedInstanceSelector.set([item.id]); }}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: 13,
                fontFamily: C.font,
                fontWeight: i === ancestors.length - 1 ? 600 : 400,
                color: i === ancestors.length - 1 ? C.text : C.textMuted,
                padding: "4px 6px",
                borderRadius: S.radiusSm,
              }}
            >
              {item.label}
            </button>
          </span>
        ))
      )}
    </div>
  );
}
