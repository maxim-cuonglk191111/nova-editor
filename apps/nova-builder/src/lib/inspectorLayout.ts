// Whether the right panel (the inspector) is open and how wide it is. Both are remembered per browser.
// The page grid reads the width through the CSS variable --nb-inspector (0px while closed).
import { atom } from "nanostores";

export const INSPECTOR_MIN = 240;
export const INSPECTOR_MAX = 480;
const WIDTH_KEY = "nova-inspector-width";
const OPEN_KEY = "nova-inspector-open";

export const $inspectorOpen = atom(true);
export const $inspectorWidth = atom(304);

export const clampInspectorWidth = (w: number) => Math.min(INSPECTOR_MAX, Math.max(INSPECTOR_MIN, Math.round(w)));

/** Reads the remembered layout; a narrow screen starts with a narrower inspector. Call once on the client. */
export function loadInspectorLayout() {
  try {
    const w = parseInt(localStorage.getItem(WIDTH_KEY) ?? "", 10);
    $inspectorWidth.set(Number.isFinite(w) ? clampInspectorWidth(w) : window.innerWidth < 1280 ? 272 : 304);
    $inspectorOpen.set(localStorage.getItem(OPEN_KEY) !== "0");
  } catch {
    /* storage blocked: the defaults stay */
  }
  const off = [
    $inspectorWidth.listen((w) => { try { localStorage.setItem(WIDTH_KEY, String(w)); } catch { /* ignore */ } }),
    $inspectorOpen.listen((o) => { try { localStorage.setItem(OPEN_KEY, o ? "1" : "0"); } catch { /* ignore */ } }),
  ];
  return () => off.forEach((f) => f());
}
