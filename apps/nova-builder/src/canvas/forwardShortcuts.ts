"use client";
// Clicking an element on the canvas moves keyboard focus into this iframe, so
// builder shortcuts (Delete, ⌘D, ⌘Z, ⌘C/⌘V, ⌘K…) never reached the builder
// window. Forward shortcut keystrokes to the parent, which replays them on its
// own window so the single command registry handles them.
import { useEffect } from "react";

export const SHORTCUT_MESSAGE = "nova:shortcut";

export type ForwardedShortcut = {
  type: typeof SHORTCUT_MESSAGE;
  key: string;
  code: string;
  ctrlKey: boolean;
  metaKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
};

const isTyping = (target: EventTarget | null) => {
  const el = target as HTMLElement | null;
  return !!el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName));
};

const isShortcut = (e: KeyboardEvent) =>
  e.ctrlKey || e.metaKey || e.key === "Delete" || e.key === "Backspace";

export function useForwardShortcutsToBuilder(enabled: boolean) {
  useEffect(() => {
    if (!enabled || window.parent === window) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented || isTyping(e.target) || !isShortcut(e)) return;
      e.preventDefault();
      const message: ForwardedShortcut = {
        type: SHORTCUT_MESSAGE,
        key: e.key, code: e.code,
        ctrlKey: e.ctrlKey, metaKey: e.metaKey, shiftKey: e.shiftKey, altKey: e.altKey,
      };
      window.parent.postMessage(message, window.location.origin);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [enabled]);
}
