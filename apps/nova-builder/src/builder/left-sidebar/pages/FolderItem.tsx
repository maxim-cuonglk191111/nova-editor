"use client";
import { Icon } from "@/builder/icons";
import { useState } from "react";
import { UI_VARS as C } from "@/lib/uiTheme";
import { useI18n } from "@/lib/i18n";


type FolderItemHandlers = {
  onToggle: () => void;
  onRename: (name: string) => void;
  onDelete: () => void;
};

type FolderItemProps = {
  name: string;
  isExpanded: boolean;
  handlers: FolderItemHandlers;
  children?: React.ReactNode;
};

export function FolderItem({ name, isExpanded, handlers, children }: FolderItemProps) {
  const L = useI18n().t.sidebar.pages;
  const { onToggle, onRename, onDelete } = handlers;
  const [hovered, setHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(name);

  function commitRename() {
    const trimmed = editValue.trim();
    setIsEditing(false);
    if (trimmed && trimmed !== name) onRename(trimmed);
    else setEditValue(name);
  }

  return (
    <div>
      <div
        style={{ position: "relative", display: "flex", alignItems: "center" }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <button
          onClick={onToggle}
          style={{ background: "none", border: "none", color: C.textMuted, cursor: "pointer", fontSize: 9, padding: "0 4px 0 8px", flexShrink: 0 }}
        >
          <Icon name={isExpanded ? "caretDown" : "caretRight"} size={12} weight="bold" />
        </button>

        <span style={{ marginRight: 6, color: C.textMuted, display: "inline-flex" }}><Icon name="folder" size={16} weight="duotone" /></span>

        {isEditing ? (
          <input
            autoFocus
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => { if (e.key === "Enter") commitRename(); if (e.key === "Escape") { setIsEditing(false); setEditValue(name); } }}
            style={{ flex: 1, background: "var(--ui-hover-bg)", border: "1px solid color-mix(in srgb, var(--ui-accent) 40%, transparent)", borderRadius: 3, color: C.text, fontSize: 12, fontFamily: C.font, padding: "2px 5px", outline: "none", minWidth: 0 }}
          />
        ) : (
          <button
            onDoubleClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
            style={{ flex: 1, background: hovered ? C.hoverBg : "none", border: "none", color: C.text, fontSize: 14, fontWeight: 500, fontFamily: C.font, cursor: "default", textAlign: "left", padding: "9px 4px", minWidth: 0 }}
          >
            {name}
          </button>
        )}

        {hovered && !isEditing && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            title={L.deleteFolder}
            style={{ position: "absolute", right: 8, width: 28, height: 28, background: "var(--ui-card)", border: "none", color: C.danger, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", padding: 0, borderRadius: 8 }}
          >
            <Icon name="close" size={12} weight="bold" />
          </button>
        )}
      </div>

      {isExpanded && children && (
        <div style={{ paddingLeft: 16, borderLeft: "1px solid var(--ui-border)", marginLeft: 14 }}>
          {children}
        </div>
      )}
    </div>
  );
}
