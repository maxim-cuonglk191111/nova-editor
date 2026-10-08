import { registerComponent, defaultBuilder } from "../registryCore";

// ── ADVANCED ────────────────────────────────────────────────────────────────

registerComponent({
  id: "shadcn:DataTable",
  displayName: "Data Table",
  category: "Advanced",
  keywords: ["datatable", "table", "data", "pagination", "search", "filter"],
  description: "Tabular data with search filter and pagination.",
  preview: () => (
    <div className="w-[185px] border border-border bg-background rounded-lg p-2 flex flex-col gap-1.5 shadow-sm text-left">
      <div className="flex justify-between items-center border-b border-border/40 pb-1.5">
        <div className="border border-border rounded px-1.5 py-0.5 text-[7px] text-muted-foreground">Filter emails...</div>
        <div className="text-[7px] text-muted-foreground">Columns ▼</div>
      </div>
      <div className="text-[7px] font-semibold divide-y divide-border/30">
        <div className="grid grid-cols-2 py-1 text-foreground">
          <span>jane.doe@example.com</span>
          <span className="text-right">Success</span>
        </div>
        <div className="grid grid-cols-2 py-1 text-foreground">
          <span>bob.smith@example.com</span>
          <span className="text-right">Pending</span>
        </div>
      </div>
      <div className="flex justify-between items-center pt-1 border-t border-border/40 text-[6px] text-muted-foreground">
        <span>Page 1 of 5</span>
        <div className="flex gap-1">
          <button className="border border-border px-1 py-0.5 rounded">Prev</button>
          <button className="border border-border px-1 py-0.5 rounded">Next</button>
        </div>
      </div>
    </div>
  ),
  createInstance: (id) => defaultBuilder(id, "shadcn:DataTable", "DataTable"),
});

registerComponent({
  id: "shadcn:Chart",
  displayName: "Chart",
  category: "Advanced",
  keywords: ["chart", "analytics", "bar", "line", "stats", "graph"],
  description: "Analytics statistics bar / line graph.",
  preview: () => (
    <div className="w-[185px] h-[75px] border border-border bg-card rounded-xl p-2.5 shadow-sm flex flex-col justify-between text-left">
      <div className="flex justify-between items-center text-[7px] font-bold text-foreground">
        <span>Visitors</span>
        <span className="text-[6px] text-muted-foreground">Last 7 days</span>
      </div>
      <div className="flex items-end justify-between gap-1.5 h-9 pt-1.5">
        <div className="w-full bg-primary/20 rounded-t h-4 hover:bg-primary transition-all" />
        <div className="w-full bg-primary/25 rounded-t h-7 hover:bg-primary transition-all" />
        <div className="w-full bg-primary rounded-t h-8 hover:bg-primary transition-all" />
        <div className="w-full bg-primary/40 rounded-t h-6 hover:bg-primary transition-all" />
        <div className="w-full bg-primary/30 rounded-t h-5 hover:bg-primary transition-all" />
        <div className="w-full bg-primary/50 rounded-t h-7 hover:bg-primary transition-all" />
        <div className="w-full bg-primary/75 rounded-t h-9 hover:bg-primary transition-all" />
      </div>
    </div>
  ),
  createInstance: (id) => defaultBuilder(id, "shadcn:Chart", "Chart"),
});
