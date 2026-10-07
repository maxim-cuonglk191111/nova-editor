// @keyframes for the Animation panel presets (AnimationEditor ANIMATION_NAMES).
// Shared by the canvas/preview page and the HTML export so an animation picked
// in the Style panel plays the same everywhere.
export const ANIMATION_KEYFRAMES: Record<string, string> = {
  fadeIn: "from { opacity: 0; } to { opacity: 1; }",
  fadeOut: "from { opacity: 1; } to { opacity: 0; }",
  slideInLeft: "from { transform: translateX(-60px); opacity: 0; } to { transform: translateX(0); opacity: 1; }",
  slideInRight: "from { transform: translateX(60px); opacity: 0; } to { transform: translateX(0); opacity: 1; }",
  slideInTop: "from { transform: translateY(-40px); opacity: 0; } to { transform: translateY(0); opacity: 1; }",
  slideInBottom: "from { transform: translateY(40px); opacity: 0; } to { transform: translateY(0); opacity: 1; }",
  zoomIn: "from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; }",
  zoomOut: "from { transform: scale(1); opacity: 1; } to { transform: scale(0.8); opacity: 0; }",
  spin: "from { transform: rotate(0deg); } to { transform: rotate(360deg); }",
  pulse: "0%, 100% { transform: scale(1); } 50% { transform: scale(1.06); }",
  bounce: "0%, 100% { transform: translateY(0); animation-timing-function: ease-in; } 50% { transform: translateY(-12px); animation-timing-function: ease-out; }",
  shake: "0%, 100% { transform: translateX(0); } 20%, 60% { transform: translateX(-8px); } 40%, 80% { transform: translateX(8px); }",
};

/** CSS for every preset, or only those whose name appears in `usedIn`. */
export function animationKeyframesCss(usedIn?: string): string {
  return Object.entries(ANIMATION_KEYFRAMES)
    .filter(([name]) => usedIn === undefined || new RegExp(`\\b${name}\\b`).test(usedIn))
    .map(([name, body]) => `@keyframes ${name} { ${body} }`)
    .join("\n");
}
