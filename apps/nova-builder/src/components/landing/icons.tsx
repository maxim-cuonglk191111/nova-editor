// Line icons for the public site. One 24px grid, 1.75 stroke, rounded joins — the same
// weight as the ribbon in the Nova mark. Decorative: every icon is aria-hidden; the text
// next to it carries the meaning.
import type { SVGProps } from "react";

const base: SVGProps<SVGSVGElement> = {
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
  focusable: false,
};

type IconProps = Omit<SVGProps<SVGSVGElement>, "ref">;

/** AI: a four-point spark with a small companion, not an emoji. */
export const IconSpark = (p: IconProps) => (
  <svg {...base} {...p}><path d="M11 3.5l1.9 5.1 5.1 1.9-5.1 1.9L11 17.5l-1.9-5.1L4 10.5l5.1-1.9L11 3.5z" /><path d="M18.5 15.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7.7-1.8z" /></svg>
);
export const IconCursor = (p: IconProps) => (
  <svg {...base} {...p}><path d="M5 3.5l13 6.2-5.6 1.7-1.7 5.6L5 3.5z" /></svg>
);
export const IconRocket = (p: IconProps) => (
  <svg {...base} {...p}><path d="M14.5 4.5c3 .3 5 2.3 5 5-1.5 4-4.5 6.5-8 7.5l-4-4c1-3.5 3.5-6.5 7-8.5z" /><circle cx="14.5" cy="9.5" r="1.4" /><path d="M7.5 13.5l-3 .5.5-3M10.5 16.5l-.5 3 3-.5" /></svg>
);
export const IconLayers = (p: IconProps) => (
  <svg {...base} {...p}><path d="M12 4l8 4.2-8 4.2L4 8.2 12 4z" /><path d="M4 12.2l8 4.2 8-4.2M4 16.2l8 4.2 8-4.2" /></svg>
);
export const IconDevices = (p: IconProps) => (
  <svg {...base} {...p}><rect x="3" y="5" width="13" height="9" rx="1.5" /><path d="M7 18h5M9.5 14v4" /><rect x="17" y="9" width="4" height="9" rx="1" /></svg>
);
export const IconCode = (p: IconProps) => (
  <svg {...base} {...p}><path d="M8.5 7.5L4 12l4.5 4.5M15.5 7.5L20 12l-4.5 4.5M13.5 5l-3 14" /></svg>
);
export const IconForm = (p: IconProps) => (
  <svg {...base} {...p}><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M8 9h8M8 13h8M8 17h4" /></svg>
);
export const IconSearch = (p: IconProps) => (
  <svg {...base} {...p}><circle cx="11" cy="11" r="6" /><path d="M20 20l-4.2-4.2" /></svg>
);
export const IconPages = (p: IconProps) => (
  <svg {...base} {...p}><path d="M7 3.5h8l4 4V19a1.5 1.5 0 01-1.5 1.5h-10A1.5 1.5 0 016 19V5A1.5 1.5 0 017 3.5z" /><path d="M14.5 3.5V8H19" /></svg>
);
export const IconCheck = (p: IconProps) => (
  <svg {...base} strokeWidth={2} {...p}><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
);
export const IconArrow = (p: IconProps) => (
  <svg {...base} strokeWidth={2} {...p}><path d="M5 12h14M13 6l6 6-6 6" /></svg>
);
export const IconMenu = (p: IconProps) => (
  <svg {...base} strokeWidth={2} {...p}><path d="M4 7h16M4 12h16M4 17h16" /></svg>
);
export const IconClose = (p: IconProps) => (
  <svg {...base} strokeWidth={2} {...p}><path d="M6 6l12 12M18 6L6 18" /></svg>
);
