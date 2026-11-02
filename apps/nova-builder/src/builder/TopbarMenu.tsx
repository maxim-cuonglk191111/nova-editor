"use client";
import { useEffect, useRef } from "react";
import { UI_VARS as C, UI_SHAPE as S } from "@/lib/uiTheme";

export type TopbarMenuItem = {
  label: string;
  title?: string;
  onClick?: () => void;
  href?: string;
  download?: boolean;
  active?: boolean;
};

type Props = {
  trigger: string;
  /** Utility class of the wrapper, used to show or hide the menu at some widths. */
  className?: string;
  items: TopbarMenuItem[];
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
};

export function TopbarMenu({ trigger, className, items, open, onToggle, onClose }: Props) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("keydown", handleKey);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open, onClose]);

  return (
    <div ref={menuRef} className={className} style={{ position: "relative", flexShrink: 0 }}>
      <button
        onClick={onToggle}
        aria-expanded={open}
        aria-haspopup="menu"
        style={{
          height: S.control, padding: "0 14px", borderRadius: S.radiusMd, cursor: "pointer", fontFamily: C.font, fontSize: 13,
          border: `1px solid ${open ? C.accentBorder : C.border}`,
          background: open ? C.accentBg : C.card,
          color: open ? C.accentText : C.text, fontWeight: 600,
          display: "inline-flex", alignItems: "center", gap: 6,
        }}
      >
        {trigger}
      </button>

      {open && (
        <div
          role="menu"
          style={{
            position: "absolute", top: "calc(100% + 6px)", right: 0, zIndex: 200,
            background: C.card, border: `1px solid ${C.border}`, borderRadius: S.radiusMd,
            padding: 6, minWidth: 200,
            boxShadow: C.shadowPop,
          }}
        >
          {items.map((item) => {
            const sharedStyle = {
              display: "block", width: "100%", padding: "10px 12px", border: "none", borderRadius: S.radiusSm,
              background: item.active ? C.accentBg : "transparent",
              color: item.active ? C.accentText : C.text,
              fontSize: 14, fontFamily: C.font, textAlign: "left" as const,
              cursor: "pointer", textDecoration: "none",
              boxSizing: "border-box" as const,
            };
            if (item.href) {
              return (
                <a key={item.label} href={item.href} download={item.download} role="menuitem" style={sharedStyle} onClick={() => { item.onClick?.(); onClose(); }}>
                  {item.label}
                </a>
              );
            }
            return (
              <button key={item.label} role="menuitem" title={item.title} onClick={() => { item.onClick?.(); onClose(); }} style={sharedStyle}>
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
