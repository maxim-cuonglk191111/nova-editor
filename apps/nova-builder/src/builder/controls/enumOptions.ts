// Style properties whose value is one of a few keywords. The inspector shows these as segmented
// pills (one tap) instead of a text box; a value that is not in the list still gets the text box,
// so nothing the document already holds is hidden or rewritten.
export const ENUM_OPTIONS: Record<string, readonly string[]> = {
  display: ["block", "flex", "grid", "inline-block", "none"],
  flexDirection: ["row", "column", "row-reverse", "column-reverse"],
  flexWrap: ["nowrap", "wrap"],
  textAlign: ["left", "center", "right", "justify"],
  alignItems: ["flex-start", "center", "flex-end", "stretch"],
  justifyContent: ["flex-start", "center", "flex-end", "space-between"],
  position: ["static", "relative", "absolute", "fixed", "sticky"],
  fontStyle: ["normal", "italic"],
  textTransform: ["none", "uppercase", "lowercase", "capitalize"],
  textDecoration: ["none", "underline", "line-through"],
  overflow: ["visible", "hidden", "scroll", "auto"],
  boxSizing: ["border-box", "content-box"],
  visibility: ["visible", "hidden"],
  backgroundSize: ["cover", "contain", "auto"],
  backgroundRepeat: ["no-repeat", "repeat", "repeat-x", "repeat-y"],
};

const ARROW: Record<string, string> = { row: "→", column: "↓", "row-reverse": "←", "column-reverse": "↑" };
const SHORT: Record<string, string> = { "flex-start": "Start", "flex-end": "End", "space-between": "Between", "inline-block": "Inline", "no-repeat": "None", nowrap: "No wrap" };

/** The text on a pill: an arrow for directions, a short word for the long keywords, else the keyword itself. */
export function enumLabel(property: string, value: string): string {
  if (property === "flexDirection") return ARROW[value] ?? value;
  const word = SHORT[value] ?? value.replace(/-/g, " ");
  return word.charAt(0).toUpperCase() + word.slice(1);
}

export function enumOptionsFor(property: string, current: string): readonly string[] | null {
  const options = ENUM_OPTIONS[property];
  return options && options.includes(current) ? options : null;
}
