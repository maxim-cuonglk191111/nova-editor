// Hand-drawn marks for the landing page. Each is an SVG with slightly uneven paths, so it
// reads as drawn rather than generated. All are decorative (aria-hidden); colour comes from
// `currentColor` so the stylesheet decides it.
import type { SVGProps } from "react";

type P = Omit<SVGProps<SVGSVGElement>, "ref">;
const common = { "aria-hidden": true, focusable: false, fill: "none", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round" } as const;

/** A wobbly underline, laid under the headline's key phrase. */
export const Squiggle = (p: P) => (
  <svg viewBox="0 0 300 18" preserveAspectRatio="none" strokeWidth={5} {...common} {...p}>
    <path d="M3 11c14-9 24 7 39-1s23-7 36 0 25 6 38-2 24-6 37 1 26 5 39-2 24-5 37 1 26 4 41-2" />
  </svg>
);

/** A loose loop around a word. */
export const Loop = (p: P) => (
  <svg viewBox="0 0 220 90" preserveAspectRatio="none" strokeWidth={4} {...common} {...p}>
    <path d="M30 46C20 24 70 6 118 9c62 3 98 20 92 40-7 24-62 34-120 32C42 79 8 66 14 46 19 28 52 18 84 16" />
  </svg>
);

/** A curly arrow, from the annotation to the prompt box. */
export const CurlArrow = (p: P) => (
  <svg viewBox="0 0 120 110" strokeWidth={4} {...common} {...p}>
    <path d="M8 10c34-4 70 6 78 36 6 22-10 36-26 30-14-6-10-24 4-24 18 0 26 22 22 40" />
    <path d="M70 84l12 20 20-14" />
  </svg>
);

/** A starburst sticker outline. */
export const Burst = (p: P) => (
  <svg viewBox="0 0 120 120" strokeWidth={3} {...common} {...p}>
    <path d="M60 4l10 17 19-7 3 20 20 4-9 18 15 14-17 11 5 19-20 1-6 19-17-10-17 10-6-19-20-1 5-19L2 77l15-14-9-18 20-4 3-20 19 7z" fill="currentColor" />
  </svg>
);

/** A multiplayer-style cursor. */
export const Cursor = (p: P) => (
  <svg viewBox="0 0 24 28" strokeWidth={1.6} {...common} {...p}>
    <path d="M3 2l17 11.5-7.4 1.6 4 8-3.4 1.7-4-8.2L3 21.2z" fill="currentColor" />
  </svg>
);

/** Masking tape holding a photo. */
export const Tape = (p: P) => (
  <svg viewBox="0 0 120 34" preserveAspectRatio="none" {...common} stroke="none" {...p}>
    <path d="M3 4l6 3-4 5 6 3-3 5 6 3-4 5 6 4h92l-5-4 4-5-5-3 4-5-5-3 4-4-5-3z" fill="currentColor" />
  </svg>
);

/** A small asterisk used as a bullet. */
export const Asterisk = (p: P) => (
  <svg viewBox="0 0 24 24" strokeWidth={3} {...common} {...p}>
    <path d="M12 3v18M4.5 7.5l15 9M19.5 7.5l-15 9" />
  </svg>
);
