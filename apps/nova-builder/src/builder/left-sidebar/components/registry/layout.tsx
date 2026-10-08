import { registerComponent, defaultBuilder, makeSubId } from "../registryCore";

// ── LAYOUT ──────────────────────────────────────────────────────────────────

registerComponent({
  id: "shadcn:Card",
  displayName: "Card",
  category: "Layout",
  keywords: ["card", "container", "paper", "box", "wrap"],
  description: "Bordered container grouping items.",
  preview: () => (
    <div className="w-[185px] border border-border bg-card text-card-foreground rounded-xl p-3 text-left shadow-sm">
      <span className="text-[11px] font-bold block">Card Title</span>
      <span className="text-[9px] text-muted-foreground block mb-2 leading-relaxed">
        Description of layout.
      </span>
      <div className="h-6 rounded bg-accent/40 w-full" />
    </div>
  ),
  createInstance: (id) => defaultBuilder(id, "shadcn:Card", "Card"),
});

registerComponent({
  id: "shadcn:Separator",
  displayName: "Separator",
  category: "Layout",
  keywords: ["separator", "divider", "line", "rule", "border"],
  description: "Clean divider separator line.",
  preview: () => (
    <div className="w-[180px] py-2 flex flex-col gap-1.5 text-center text-[9px] text-muted-foreground font-semibold">
      <span>Section Header</span>
      <div className="h-[1px] bg-border w-full" />
      <span>Content Body</span>
    </div>
  ),
  createInstance: (id) => defaultBuilder(id, "shadcn:Separator", "Separator"),
});

registerComponent({
  id: "shadcn:Resizable",
  displayName: "Resizable",
  category: "Layout",
  keywords: ["resizable", "split", "panels", "divider", "resize"],
  description: "Adjustable size split panels.",
  preview: () => (
    <div className="w-[185px] h-[55px] border border-border rounded-md flex overflow-hidden text-[9px] font-semibold text-center select-none shadow-sm">
      <div className="w-[45%] bg-accent/40 flex items-center justify-center text-muted-foreground">Panel A</div>
      <div className="w-1.5 bg-border hover:bg-primary flex items-center justify-center text-[8px] text-muted-foreground cursor-col-resize">
        ⋮
      </div>
      <div className="flex-1 flex items-center justify-center text-muted-foreground">Panel B</div>
    </div>
  ),
  createInstance: (id) => defaultBuilder(id, "shadcn:Resizable", "Resizable"),
});

registerComponent({
  id: "shadcn:ScrollArea",
  displayName: "Scroll Area",
  category: "Layout",
  keywords: ["scroll", "area", "overflow", "list", "bar"],
  description: "Content wrapper with custom scrollbar.",
  preview: () => (
    <div className="w-[180px] h-[50px] border border-border bg-background rounded-md p-1.5 overflow-hidden relative shadow-sm">
      <div className="text-[8px] font-semibold text-muted-foreground leading-normal pr-3">
        Scroll me to see custom slider tracks. This is some scrollable text inside a custom scroll area component.
      </div>
      <div className="w-1 h-[80%] bg-secondary rounded-full absolute right-0.5 top-1 flex justify-center">
        <div className="w-full h-[50%] bg-muted-foreground/60 rounded-full" />
      </div>
    </div>
  ),
  createInstance: (id) => defaultBuilder(id, "shadcn:ScrollArea", "ScrollArea"),
});

registerComponent({
  id: "shadcn:AspectRatio",
  displayName: "Aspect Ratio",
  category: "Layout",
  keywords: ["aspect", "ratio", "image", "media", "scale"],
  description: "Aspect-ratio constrained frame container.",
  preview: () => (
    <div className="w-[140px] aspect-video border border-dashed border-border bg-secondary/60 rounded flex items-center justify-center text-[10px] text-muted-foreground font-semibold">
      16:9 Aspect Ratio
    </div>
  ),
  createInstance: (id) => defaultBuilder(id, "shadcn:AspectRatio", "AspectRatio"),
});

registerComponent({
  id: "shadcn:Collapsible",
  displayName: "Collapsible",
  category: "Layout",
  keywords: ["collapsible", "expand", "hide", "panel", "chevron"],
  description: "Trigger collapsible details list.",
  preview: () => (
    <div className="w-[185px] border border-border bg-background rounded-md p-1.5 text-[9px] font-semibold shadow-sm text-left">
      <div className="flex justify-between items-center">
        <span>Settings panel</span>
        <span>▼</span>
      </div>
      <div className="mt-1.5 border-t border-border/40 pt-1 text-muted-foreground">Expanded options list...</div>
    </div>
  ),
  createInstance: (id) => defaultBuilder(id, "shadcn:Collapsible", "Collapsible"),
});

registerComponent({
  id: "shadcn:Accordion",
  displayName: "Accordion",
  category: "Layout",
  keywords: ["accordion", "details", "expand", "faq", "list"],
  description: "Expandable summary panel list.",
  preview: () => (
    <div className="w-[185px] flex flex-col border border-border bg-background rounded-md p-1.5 text-[9px] font-semibold divide-y divide-border/40 shadow-sm text-left">
      <div className="py-1 flex justify-between items-center text-primary">
        <span>Is it responsive?</span>
        <span>▲</span>
      </div>
      <div className="py-1 pb-2 text-muted-foreground leading-normal">
        Yes, all components support responsive layout columns.
      </div>
      <div className="py-1.5 flex justify-between items-center text-foreground">
        <span>Can I edit colors?</span>
        <span>▼</span>
      </div>
    </div>
  ),
  createInstance: (id) => defaultBuilder(id, "shadcn:Accordion", "Accordion"),
});

registerComponent({
  id: "shadcn:Carousel",
  displayName: "Carousel",
  category: "Layout",
  keywords: ["carousel", "slider", "slides", "images", "banner"],
  description: "Interactive layout slide carousel.",
  preview: () => (
    <div className="w-[185px] h-[65px] border border-border bg-secondary rounded-lg flex items-center justify-between p-2 shadow-sm">
      <button className="w-5 h-5 bg-background border border-border rounded-full text-[8px] flex items-center justify-center font-bold">
        ◀
      </button>
      <span className="text-[10px] font-bold text-muted-foreground">Slide 1 of 3</span>
      <button className="w-5 h-5 bg-background border border-border rounded-full text-[8px] flex items-center justify-center font-bold">
        ▶
      </button>
    </div>
  ),
  createInstance: (id) => defaultBuilder(id, "shadcn:Carousel", "Carousel"),
});

registerComponent({
  id: "shadcn:Row",
  displayName: "Row (Grid)",
  category: "Layout",
  keywords: ["row", "grid", "flex", "cols", "layout"],
  description: "12-column layout Grid container.",
  preview: () => (
    <div className="w-[185px] border border-dashed border-border rounded p-1.5 grid grid-cols-3 gap-1 text-[9px] text-muted-foreground text-center bg-accent/20">
      <div className="bg-background border border-border p-1 rounded">Col</div>
      <div className="bg-background border border-border p-1 rounded">Col</div>
      <div className="bg-background border border-border p-1 rounded">Col</div>
    </div>
  ),
  createInstance: (id) => defaultBuilder(id, "shadcn:Row", "Row"),
});

registerComponent({
  id: "shadcn:Col",
  displayName: "Column",
  category: "Layout",
  keywords: ["column", "col", "grid", "layout", "span"],
  description: "Grid column item container.",
  preview: () => (
    <div className="w-12 border border-dashed border-primary rounded p-1 bg-primary/5 text-center text-[9px] text-primary font-semibold">
      Column
    </div>
  ),
  createInstance: (id) => defaultBuilder(id, "shadcn:Col", "Column"),
});

registerComponent({
  id: "shadcn:Row2Cols",
  displayName: "2 Columns Row",
  category: "Layout",
  keywords: ["preset", "columns", "layout", "grid", "2cols"],
  description: "Preset grid row with 2 columns.",
  preview: () => (
    <div className="w-[185px] border border-dashed border-border rounded p-1.5 grid grid-cols-2 gap-1.5 text-[9px] text-muted-foreground text-center bg-accent/20">
      <div className="bg-background border border-border py-1.5 rounded font-medium">Column 1</div>
      <div className="bg-background border border-border py-1.5 rounded font-medium">Column 2</div>
    </div>
  ),
  createInstance: (id) => {
    const col1Id = makeSubId(id, "c1");
    const col2Id = makeSubId(id, "c2");
    return {
      instance: {
        type: "instance" as const,
        id,
        component: "shadcn:Row",
        label: "2 Columns Row",
        children: [
          { type: "id", value: col1Id },
          { type: "id", value: col2Id },
        ],
      },
      childInstances: [
        { type: "instance" as const, id: col1Id, component: "shadcn:Col", label: "Column 1", children: [] },
        { type: "instance" as const, id: col2Id, component: "shadcn:Col", label: "Column 2", children: [] },
      ],
      props: {
        [`${col1Id}:span`]: { id: `${col1Id}:span`, instanceId: col1Id, name: "span", type: "number" as const, value: 6 },
        [`${col2Id}:span`]: { id: `${col2Id}:span`, instanceId: col2Id, name: "span", type: "number" as const, value: 6 },
      },
    };
  },
});

registerComponent({
  id: "shadcn:Row3Cols",
  displayName: "3 Columns Row",
  category: "Layout",
  keywords: ["preset", "columns", "layout", "grid", "3cols"],
  description: "Preset grid row with 3 columns.",
  preview: () => (
    <div className="w-[185px] border border-dashed border-border rounded p-1.5 grid grid-cols-3 gap-1 text-[8px] text-muted-foreground text-center bg-accent/20">
      <div className="bg-background border border-border py-1 rounded">Col 1</div>
      <div className="bg-background border border-border py-1 rounded">Col 2</div>
      <div className="bg-background border border-border py-1 rounded">Col 3</div>
    </div>
  ),
  createInstance: (id) => {
    const col1Id = makeSubId(id, "c1");
    const col2Id = makeSubId(id, "c2");
    const col3Id = makeSubId(id, "c3");
    return {
      instance: {
        type: "instance" as const,
        id,
        component: "shadcn:Row",
        label: "3 Columns Row",
        children: [
          { type: "id", value: col1Id },
          { type: "id", value: col2Id },
          { type: "id", value: col3Id },
        ],
      },
      childInstances: [
        { type: "instance" as const, id: col1Id, component: "shadcn:Col", label: "Column 1", children: [] },
        { type: "instance" as const, id: col2Id, component: "shadcn:Col", label: "Column 2", children: [] },
        { type: "instance" as const, id: col3Id, component: "shadcn:Col", label: "Column 3", children: [] },
      ],
      props: {
        [`${col1Id}:span`]: { id: `${col1Id}:span`, instanceId: col1Id, name: "span", type: "number" as const, value: 4 },
        [`${col2Id}:span`]: { id: `${col2Id}:span`, instanceId: col2Id, name: "span", type: "number" as const, value: 4 },
        [`${col3Id}:span`]: { id: `${col3Id}:span`, instanceId: col3Id, name: "span", type: "number" as const, value: 4 },
      },
    };
  },
});

registerComponent({
  id: "shadcn:Row4Cols",
  displayName: "4 Columns Row",
  category: "Layout",
  keywords: ["preset", "columns", "layout", "grid", "4cols"],
  description: "Preset grid row with 4 columns.",
  preview: () => (
    <div className="w-[185px] border border-dashed border-border rounded p-1 grid grid-cols-4 gap-1 text-[7px] text-muted-foreground text-center bg-accent/20">
      <div className="bg-background border border-border py-1 rounded">C1</div>
      <div className="bg-background border border-border py-1 rounded">C2</div>
      <div className="bg-background border border-border py-1 rounded">C3</div>
      <div className="bg-background border border-border py-1 rounded">C4</div>
    </div>
  ),
  createInstance: (id) => {
    const col1Id = makeSubId(id, "c1");
    const col2Id = makeSubId(id, "c2");
    const col3Id = makeSubId(id, "c3");
    const col4Id = makeSubId(id, "c4");
    return {
      instance: {
        type: "instance" as const,
        id,
        component: "shadcn:Row",
        label: "4 Columns Row",
        children: [
          { type: "id", value: col1Id },
          { type: "id", value: col2Id },
          { type: "id", value: col3Id },
          { type: "id", value: col4Id },
        ],
      },
      childInstances: [
        { type: "instance" as const, id: col1Id, component: "shadcn:Col", label: "Column 1", children: [] },
        { type: "instance" as const, id: col2Id, component: "shadcn:Col", label: "Column 2", children: [] },
        { type: "instance" as const, id: col3Id, component: "shadcn:Col", label: "Column 3", children: [] },
        { type: "instance" as const, id: col4Id, component: "shadcn:Col", label: "Column 4", children: [] },
      ],
      props: {
        [`${col1Id}:span`]: { id: `${col1Id}:span`, instanceId: col1Id, name: "span", type: "number" as const, value: 3 },
        [`${col2Id}:span`]: { id: `${col2Id}:span`, instanceId: col2Id, name: "span", type: "number" as const, value: 3 },
        [`${col3Id}:span`]: { id: `${col3Id}:span`, instanceId: col3Id, name: "span", type: "number" as const, value: 3 },
        [`${col4Id}:span`]: { id: `${col4Id}:span`, instanceId: col4Id, name: "span", type: "number" as const, value: 3 },
      },
    };
  },
});

registerComponent({
  id: "shadcn:Container",
  displayName: "Container",
  category: "Layout",
  keywords: ["box", "flex", "container", "wrapper", "div"],
  description: "Flex layout box / container.",
  preview: () => (
    <div className="w-[185px] border border-dashed border-border rounded p-2 flex flex-col gap-1 text-[8px] text-muted-foreground bg-accent/10 text-left h-[45px]">
      <span className="font-semibold text-foreground">Container</span>
    </div>
  ),
  createInstance: (id) => defaultBuilder(id, "shadcn:Container", "Container"),
});

registerComponent({
  id: "shadcn:Section",
  displayName: "Section",
  category: "Layout",
  keywords: ["section", "semantic", "layout", "block", "wrap"],
  description: "Semantic page layout section block.",
  preview: () => (
    <div className="w-[185px] border border-dashed border-border rounded p-2 text-[8px] text-muted-foreground bg-accent/5 text-center h-[40px] flex items-center justify-center font-bold">
      Semantic Section
    </div>
  ),
  createInstance: (id) => defaultBuilder(id, "shadcn:Section", "Section"),
});

registerComponent({
  id: "shadcn:FlexRow",
  displayName: "Flex Row",
  category: "Layout",
  keywords: ["flex", "row", "layout", "horizontal", "wrap"],
  description: "Horizontal flex alignment row.",
  preview: () => (
    <div className="w-[185px] border border-dashed border-border rounded p-1.5 flex gap-2 text-[8px] text-muted-foreground bg-accent/15 items-center justify-start h-[35px]">
      <span className="bg-background border border-border px-1.5 py-0.5 rounded">item</span>
      <span className="bg-background border border-border px-1.5 py-0.5 rounded">item</span>
    </div>
  ),
  createInstance: (id) => defaultBuilder(id, "shadcn:FlexRow", "FlexRow"),
});

registerComponent({
  id: "shadcn:Spacer",
  displayName: "Spacer",
  category: "Layout",
  keywords: ["spacer", "gap", "empty", "space", "padding"],
  description: "Empty space block element.",
  preview: () => (
    <div className="w-[185px] h-6 border border-dashed border-border rounded bg-accent/5 flex items-center justify-center text-[8px] text-muted-foreground/60 select-none">
      Spacer (24px)
    </div>
  ),
  createInstance: (id) => defaultBuilder(id, "shadcn:Spacer", "Spacer"),
});
