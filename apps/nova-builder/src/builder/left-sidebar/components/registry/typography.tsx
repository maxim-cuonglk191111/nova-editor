import { registerComponent, defaultBuilder } from "../registryCore";

// ── TYPOGRAPHY ──────────────────────────────────────────────────────────────

registerComponent({
  id: "shadcn:Code",
  displayName: "Code",
  category: "Typography",
  keywords: ["code", "inline", "monospace", "pre", "tag"],
  description: "Monospace formatted inline code block.",
  preview: () => (
    <code className="px-1.5 py-0.5 bg-secondary text-foreground font-mono text-[10px] rounded border border-border">
      {"const key = \"val\";"}
    </code>
  ),
  createInstance: (id) => defaultBuilder(id, "shadcn:Code", "Code", ["const key = \"val\";"]),
});

registerComponent({
  id: "shadcn:Kbd",
  displayName: "Kbd",
  category: "Typography",
  keywords: ["kbd", "keyboard", "shortcut", "keys"],
  description: "Display keyboard shortcut keys.",
  preview: () => (
    <kbd className="px-1.5 py-0.5 border border-border bg-secondary text-foreground font-semibold rounded text-[9px] shadow-sm select-none">
      ⌘ K
    </kbd>
  ),
  createInstance: (id) => defaultBuilder(id, "shadcn:Kbd", "Kbd", ["⌘ K"]),
});

registerComponent({
  id: "shadcn:Text",
  displayName: "Text",
  category: "Typography",
  keywords: ["text", "paragraph", "span", "p", "typography"],
  description: "Generic text paragraph block.",
  preview: () => (
    <p className="text-xs text-foreground leading-normal max-w-[180px] text-left">
      Experience the visual builder layout editor.
    </p>
  ),
  createInstance: (id) => defaultBuilder(id, "shadcn:Text", "Text", ["This is a text paragraph element."]),
});

registerComponent({
  id: "shadcn:Heading",
  displayName: "Heading",
  category: "Typography",
  keywords: ["heading", "title", "header", "h1", "h2", "h3"],
  description: "Heading text block elements.",
  preview: () => (
    <h3 className="text-sm font-bold text-foreground leading-tight tracking-tight text-left">
      Your heading
    </h3>
  ),
  createInstance: (id) => defaultBuilder(id, "shadcn:Heading", "Heading", ["Your heading"]),
});

registerComponent({
  id: "shadcn:Link",
  displayName: "Link",
  category: "Typography",
  keywords: ["link", "href", "url", "anchor", "hyperlink"],
  description: "Anchor hyperlink navigation.",
  preview: () => (
    <a href="#" className="text-xs font-semibold text-primary underline underline-offset-4 hover:opacity-85">
      Learn more ↗
    </a>
  ),
  createInstance: (id) => defaultBuilder(id, "shadcn:Link", "Link", ["Learn more"]),
});
