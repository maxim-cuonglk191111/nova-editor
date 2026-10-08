import { registerComponent, defaultBuilder } from "../registryCore";

// ── DISPLAY ─────────────────────────────────────────────────────────────────

registerComponent({
  id: "shadcn:Avatar",
  displayName: "Avatar",
  category: "Display",
  keywords: ["avatar", "user", "profile", "image", "circle", "face"],
  description: "Profile circle photo with initials.",
  preview: () => (
    <div className="w-9 h-9 rounded-full bg-primary text-primary-foreground font-bold flex items-center justify-center text-xs shadow-sm">
      JD
    </div>
  ),
  createInstance: (id) => defaultBuilder(id, "shadcn:Avatar", "Avatar"),
});

registerComponent({
  id: "shadcn:Badge",
  displayName: "Badge",
  category: "Display",
  keywords: ["badge", "pill", "tag", "status", "indicator"],
  description: "Visual status indicator tag.",
  preview: () => (
    <span className="px-2.5 py-0.5 bg-primary text-primary-foreground font-semibold text-[9px] rounded-full shadow-sm">
      Active
    </span>
  ),
  createInstance: (id) => defaultBuilder(id, "shadcn:Badge", "Badge", ["Active"]),
});

registerComponent({
  id: "shadcn:Table",
  displayName: "Table",
  category: "Display",
  keywords: ["table", "rows", "grid", "data", "tabular"],
  description: "Display tabular grid list data.",
  preview: () => (
    <div className="w-[185px] border border-border rounded-lg overflow-hidden text-[8px] bg-background shadow-sm text-left">
      <div className="grid grid-cols-3 bg-secondary/80 px-2 py-1 font-bold text-foreground border-b border-border">
        <span>Invoice</span>
        <span>Status</span>
        <span className="text-right">Amount</span>
      </div>
      <div className="grid grid-cols-3 px-2 py-1 text-muted-foreground border-b border-border/40">
        <span className="font-semibold text-foreground">INV-001</span>
        <span>Paid</span>
        <span className="text-right">$250.00</span>
      </div>
      <div className="grid grid-cols-3 px-2 py-1 text-muted-foreground">
        <span className="font-semibold text-foreground">INV-002</span>
        <span>Pending</span>
        <span className="text-right">$120.00</span>
      </div>
    </div>
  ),
  createInstance: (id) => defaultBuilder(id, "shadcn:Table", "Table"),
});

registerComponent({
  id: "shadcn:Skeleton",
  displayName: "Skeleton",
  category: "Display",
  keywords: ["skeleton", "placeholder", "loading", "shimmer", "waiting"],
  description: "Pulsing content placeholder skeleton templates.",
  preview: () => (
    <div className="w-[180px] flex items-center gap-2.5">
      <div className="w-8 h-8 rounded-full bg-secondary shrink-0 animate-pulse" />
      <div className="w-full flex flex-col gap-1.5">
        <div className="h-2.5 w-[65%] bg-secondary rounded animate-pulse" />
        <div className="h-2 w-[85%] bg-secondary/80 rounded animate-pulse" />
      </div>
    </div>
  ),
  createInstance: (id) => defaultBuilder(id, "shadcn:Skeleton", "Skeleton"),
});

registerComponent({
  id: "shadcn:Progress",
  displayName: "Progress",
  category: "Display",
  keywords: ["progress", "bar", "percent", "loading", "percentage"],
  description: "Visual completion progress bar.",
  preview: () => (
    <div className="w-[180px] flex flex-col gap-1 text-[9px] text-muted-foreground font-semibold text-left">
      <div className="flex justify-between items-center">
        <span>Loading...</span>
        <span>60%</span>
      </div>
      <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
        <div className="h-full bg-primary w-[60%] rounded-full" />
      </div>
    </div>
  ),
  createInstance: (id) => defaultBuilder(id, "shadcn:Progress", "Progress"),
});
