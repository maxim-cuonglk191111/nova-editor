// Makes AI-composed base styles hold up on narrow viewports.
// The composer only writes base (desktop) styles, so fixed desktop sizes are
// rewritten into fluid equivalents that still render identically at 1440px.

type Styles = Record<string, unknown>;

const PX = /^(-?\d+(?:\.\d+)?)px$/;

function px(value: unknown): number | null {
  const m = typeof value === "string" ? PX.exec(value.trim()) : null;
  return m ? parseFloat(m[1]!) : null;
}

const DESKTOP_WIDTH = 1440;

function fluidFontSize(size: number): string {
  const min = Math.max(22, Math.round(size * 0.55));
  const vw = ((size / DESKTOP_WIDTH) * 100).toFixed(2);
  return `clamp(${min}px, ${vw}vw, ${size}px)`;
}

export function makeResponsive(styles: Styles): Styles {
  const out: Styles = { ...styles };

  const fontSize = px(out.fontSize);
  if (fontSize !== null && fontSize >= 28) out.fontSize = fluidFontSize(fontSize);

  // Rows must be allowed to wrap, otherwise nav bars and two-column heroes
  // overflow horizontally on phones.
  const direction = typeof out.flexDirection === "string" ? out.flexDirection : "row";
  if ((out.display === "flex" || out.display === "inline-flex") && direction.startsWith("row") && out.flexWrap === undefined) {
    out.flexWrap = "wrap";
  }

  // `flex: 1` has a 0 basis, so items shrink instead of wrapping — give them a basis.
  if (out.flex === "1" || out.flex === "1 1 0%" || out.flex === "1 1 0") out.flex = "1 1 280px";

  const width = px(out.width);
  if (width !== null && width > 320 && out.maxWidth === undefined) out.maxWidth = "100%";

  // Inside a column flex container with align-items:center, an item with only
  // max-width is sized to its content (up to max-width), not to the container —
  // so a 600px max-width paragraph stays 600px on a 390px phone. width:100%
  // makes it track the container while max-width still caps it on desktop.
  if (out.width === undefined && px(out.maxWidth) !== null) out.width = "100%";

  const minWidth = px(out.minWidth);
  if (minWidth !== null && minWidth > 320) out.minWidth = `min(${minWidth}px, 100%)`;

  if (typeof out.gridTemplateColumns === "string") {
    const m = /^repeat\(\s*(\d+)\s*,\s*1fr\s*\)$/.exec(out.gridTemplateColumns.trim());
    if (m && Number(m[1]) >= 2) out.gridTemplateColumns = "repeat(auto-fit, minmax(240px, 1fr))";
  }

  return out;
}
