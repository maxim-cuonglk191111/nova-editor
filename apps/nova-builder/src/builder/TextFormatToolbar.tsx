"use client";
// Floating bold/italic/underline toolbar shown while a canvas text element is
// in double-click edit mode. Commands are posted into the canvas iframe.

import type { RefObject } from "react";
import { useI18n } from "@/lib/i18n";
import { UI_VARS as C, UI_SHAPE as S } from "@/lib/uiTheme";
import { Icon } from "./icons";

export function TextFormatToolbar({ iframeRef }: { iframeRef: RefObject<HTMLIFrameElement | null> }) {
  const { t } = useI18n();

  const commands = [
    { icon: "bold" as const, title: t.chrome.boldTitle, cmd: "bold" },
    { icon: "italic" as const, title: t.chrome.italicTitle, cmd: "italic" },
    { icon: "underline" as const, title: t.chrome.underlineTitle, cmd: "underline" },
    { icon: "link" as const, title: t.chrome.linkTitle, cmd: "link" },
  ];

  return (
    <div
      data-text-format-toolbar="true"
      style={{
        position: "absolute",
        top: 10,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        gap: 2,
        background: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: S.radiusMd,
        padding: 4,
        boxShadow: C.shadowPop,
        fontFamily: C.font,
      }}
    >
      {commands.map(({ icon, title, cmd }) => (
        <button
          key={cmd}
          title={title}
          aria-label={title}
          onMouseDown={(e) => {
            e.preventDefault(); // prevent blur in canvas
            if (cmd === "link") {
              const url = window.prompt("Enter link URL:", "https://");
              if (!url) return;
              iframeRef.current?.contentWindow?.postMessage(
                { type: "nova:formatText", command: "link", url },
                window.location.origin
              );
              return;
            }
            iframeRef.current?.contentWindow?.postMessage(
              { type: "nova:formatText", command: cmd },
              window.location.origin
            );
          }}
          style={{ background: "none", border: "none", borderRadius: S.radiusSm, color: C.text, cursor: "pointer", width: 34, height: 34, display: "inline-flex", alignItems: "center", justifyContent: "center", padding: 0 }}
        >
          <Icon name={icon} size={18} weight="bold" />
        </button>
      ))}
      <div style={{ width: 1, height: 20, background: C.border, margin: "0 6px" }} />
      <span style={{ fontSize: 13, color: C.textMuted, padding: "0 8px 0 2px" }}>
        {t.builder.formatCommitHint}
      </span>
    </div>
  );
}
