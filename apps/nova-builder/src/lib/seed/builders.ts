// The small vocabulary every seeded site is written in: a compact tree of nodes (the same one the AI
// composer returns), a few system font stacks and the shared image helpers. Fonts are system stacks
// so the preview, an export and a published site all draw the same.

export type Tree = Record<string, unknown>;
export type Styles = Record<string, string>;

// Photos are real places, dishes and people in Vietnam from Wikimedia Commons. Width 1280 is one
// of Commons' standard thumbnail sizes, so the file is served from cache. Every photo is used
// once, on one site.
const commons = (file: string) => `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}?width=1280`;

// ── tiny builders ─────────────────────────────────────────────────────────────
export const box = (label: string, styles: Styles, children: Tree[] = [], props: Record<string, unknown> = {}): Tree => ({ component: "Box", label, props, styles, children });
export const h = (text: string, tag: string, styles: Styles = {}): Tree => ({ component: "Heading", label: "Heading", props: { tag }, text, styles });
export const p = (text: string, styles: Styles = {}): Tree => ({ component: "Paragraph", label: "Paragraph", text, styles });
export const a = (text: string, href: string, styles: Styles = {}): Tree => ({ component: "Link", label: "Link", props: { href }, text, styles });
export const btn = (text: string, styles: Styles): Tree => ({ component: "Button", label: "Button", props: { type: "button" }, text, styles });
export const img = (file: string, alt: string, styles: Styles = {}): Tree => ({ component: "Image", label: "Image", props: { src: commons(file), alt }, styles });
export const badge = (text: string, styles: Styles = {}): Tree => ({ component: "Badge", label: "Badge", props: { variant: "outline" }, text, styles });
// Avatars use portraits of ordinary people in Vietnam; the name stays as the fallback initials.
export const avatar = (file: string, name: string, styles: Styles = {}): Tree => ({ component: "Avatar", label: "Avatar", props: { src: commons(file), name }, styles });

export type SeedContext = {
  /** Public base of the assets bucket's seed/ folder, no trailing slash. */
  assetBase: string;
};

// Georgia has no Vietnamese glyphs (ế, ắ, ố come out as a letter plus a stray accent), so the
// serif stack starts with faces that do: Palatino Linotype on Windows, Palatino on macOS.
export const SERIF = "'Palatino Linotype', Palatino, 'Book Antiqua', 'Times New Roman', serif";
export const MONO = "ui-monospace, 'SFMono-Regular', Menlo, Consolas, monospace";
export const POSTER = "Impact, 'Arial Narrow Bold', 'Haettenschweiler', sans-serif";
export const SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif";
