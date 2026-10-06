"use client";

import { useLayoutEffect, useState } from "react";
import { useStore } from "@nanostores/react";
import { selectorIdAttribute } from "@webstudio-is/react-sdk";
import { $textEditingInstance } from "@/lib/nano-states";
import { TextEditor } from "./text-editor/text-editor";
import type { Instance } from "@webstudio-is/sdk";

// The editor floats over the element being edited, so it takes the element's
// typography and the element itself is hidden — otherwise the old text shows
// through underneath and the edit looks like a second, unstyled layer.
const TYPOGRAPHY = [
  "fontFamily", "fontSize", "fontWeight", "fontStyle", "lineHeight", "letterSpacing",
  "color", "textAlign", "textTransform", "paddingTop", "paddingRight", "paddingBottom", "paddingLeft",
] as const;

function elementFor(instanceId: string): HTMLElement | null {
  for (const el of document.querySelectorAll<HTMLElement>(`[${selectorIdAttribute}]`)) {
    const raw = el.getAttribute(selectorIdAttribute) ?? "";
    if (raw === instanceId || raw.startsWith(`${instanceId},`)) return el;
  }
  return null;
}

export function TextEditOverlay() {
  const editing = useStore($textEditingInstance);
  const instanceId = editing?.instanceId;
  const [typography, setTypography] = useState<React.CSSProperties>({});

  useLayoutEffect(() => {
    if (!instanceId) return;
    const el = elementFor(instanceId);
    if (!el) return;
    const computed = getComputedStyle(el);
    const copied: Record<string, string> = {};
    for (const prop of TYPOGRAPHY) copied[prop] = computed[prop];
    setTypography(copied as React.CSSProperties);
    const previous = el.style.visibility;
    el.style.visibility = "hidden";
    return () => {
      el.style.visibility = previous;
    };
  }, [instanceId]);

  if (!editing) return null;

  const { initialChildren, rect } = editing;

  function handleCommit({ instances }: { instanceId: string; instances: Instance[] }) {
    $textEditingInstance.set(null);
    window.parent.postMessage(
      { type: "nova:textCommitLexical", instanceId, instances },
      window.location.origin
    );
  }

  function handleCancel() {
    $textEditingInstance.set(null);
    window.parent.postMessage({ type: "nova:editingEnd" }, window.location.origin);
  }

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 9000,
        pointerEvents: "none",
      }}
    >
      <TextEditor
        instanceId={editing.instanceId}
        initialChildren={initialChildren}
        onCommit={handleCommit}
        onCancel={handleCancel}
        style={{
          ...typography,
          position: "absolute",
          top: rect.top,
          left: rect.left,
          width: rect.width,
          minHeight: rect.height,
          boxSizing: "border-box",
          pointerEvents: "all",
          background: "transparent",
          zIndex: 9001,
        }}
      />
    </div>
  );
}
