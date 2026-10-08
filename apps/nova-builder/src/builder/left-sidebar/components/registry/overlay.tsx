import { registerComponent, defaultBuilder } from "../registryCore";

// ── OVERLAY ─────────────────────────────────────────────────────────────────

registerComponent({
  id: "shadcn:Dialog",
  displayName: "Dialog",
  category: "Overlay",
  keywords: ["dialog", "modal", "popup", "box", "overlay"],
  description: "Context dialog action popup card.",
  preview: () => (
    <div className="w-[185px] border border-border bg-popover text-popover-foreground rounded-lg p-3 shadow-lg text-left">
      <span className="text-[11px] font-bold block mb-1">Edit Profile</span>
      <span className="text-[9px] text-muted-foreground block mb-2 leading-tight">
        {"Make changes here. Click save when you're done."}
      </span>
      <div className="flex justify-end gap-1.5 mt-2">
        <button className="px-2.5 py-1.5 border border-border rounded text-[9px] font-semibold hover:bg-accent">
          Cancel
        </button>
        <button className="px-2.5 py-1.5 bg-primary text-primary-foreground rounded text-[9px] font-semibold">
          Save
        </button>
      </div>
    </div>
  ),
  createInstance: (id) => defaultBuilder(id, "shadcn:Dialog", "Dialog"),
});

registerComponent({
  id: "shadcn:AlertDialog",
  displayName: "Alert Dialog",
  category: "Overlay",
  keywords: ["alert", "dialog", "modal", "danger", "warning", "confirm"],
  description: "Danger action warning confirm modal.",
  preview: () => (
    <div className="w-[185px] border border-destructive/30 bg-popover text-popover-foreground rounded-lg p-3 shadow-lg text-left">
      <span className="text-[11px] font-bold block mb-1">Are you sure?</span>
      <span className="text-[9px] text-muted-foreground block mb-2 leading-tight">
        This action cannot be undone. Files will be deleted.
      </span>
      <div className="flex justify-end gap-1.5 mt-2">
        <button className="px-2.5 py-1.5 border border-border rounded text-[9px] font-semibold hover:bg-accent">
          Cancel
        </button>
        <button className="px-2.5 py-1.5 bg-destructive text-destructive-foreground rounded text-[9px] font-semibold">
          Delete
        </button>
      </div>
    </div>
  ),
  createInstance: (id) => defaultBuilder(id, "shadcn:AlertDialog", "AlertDialog"),
});

registerComponent({
  id: "shadcn:Popover",
  displayName: "Popover",
  category: "Overlay",
  keywords: ["popover", "card", "floating", "click", "hint"],
  description: "Trigger floating content panel.",
  preview: () => (
    <div className="w-[145px] border border-border bg-popover text-popover-foreground rounded-md p-2 shadow-md text-left text-[9px] leading-relaxed">
      <span className="font-bold block mb-0.5 text-[10px]">Dimensions</span>
      <span className="text-muted-foreground">Adjust width & height sizes.</span>
    </div>
  ),
  createInstance: (id) => defaultBuilder(id, "shadcn:Popover", "Popover"),
});

registerComponent({
  id: "shadcn:Tooltip",
  displayName: "Tooltip",
  category: "Overlay",
  keywords: ["tooltip", "hover", "info", "caption", "hint"],
  description: "Hover information hint box.",
  preview: () => (
    <div className="flex flex-col items-center gap-1.5">
      <div className="bg-foreground text-background px-2.5 py-1 rounded text-[9px] font-bold shadow">
        Add to library
      </div>
      <button className="px-3 py-1 border border-border text-[9px] font-semibold rounded hover:bg-accent">
        Hover me
      </button>
    </div>
  ),
  createInstance: (id) => defaultBuilder(id, "shadcn:Tooltip", "Tooltip"),
});

registerComponent({
  id: "shadcn:HoverCard",
  displayName: "Hover Card",
  category: "Overlay",
  keywords: ["hover", "card", "profile", "link", "info"],
  description: "Hover information overlay card.",
  preview: () => (
    <div className="w-[185px] border border-border bg-popover text-popover-foreground rounded-lg p-2.5 shadow-md flex gap-2.5 text-left text-[9px] leading-snug">
      <div className="w-7 h-7 rounded-full bg-secondary shrink-0 font-bold flex items-center justify-center text-[10px]">
        N
      </div>
      <div className="flex flex-col gap-0.5">
        <span className="font-bold text-foreground">@nextjs</span>
        <span className="text-muted-foreground">React framework built for the web.</span>
      </div>
    </div>
  ),
  createInstance: (id) => defaultBuilder(id, "shadcn:HoverCard", "HoverCard"),
});

registerComponent({
  id: "shadcn:Drawer",
  displayName: "Drawer",
  category: "Overlay",
  keywords: ["drawer", "slide", "sheet", "panel", "bottom"],
  description: "Slide-up bottom overlay panel.",
  preview: () => (
    <div className="w-[185px] h-[70px] border border-border bg-popover rounded-t-xl shadow-lg flex flex-col justify-end p-2 border-b-0 mt-3 relative overflow-hidden">
      <div className="w-8 h-1 bg-border rounded-full mx-auto mb-2" />
      <span className="text-[10px] font-bold text-foreground block text-center">Settings Drawer</span>
      <span className="text-[8px] text-muted-foreground block text-center mb-1">Set project variables</span>
    </div>
  ),
  createInstance: (id) => defaultBuilder(id, "shadcn:Drawer", "Drawer"),
});

registerComponent({
  id: "shadcn:Sheet",
  displayName: "Sheet",
  category: "Overlay",
  keywords: ["sheet", "slide", "drawer", "panel", "side"],
  description: "Slide-in side overlay panel.",
  preview: () => (
    <div className="w-[185px] h-[75px] border border-border bg-popover rounded-md shadow-lg flex justify-end relative overflow-hidden">
      <div className="w-[60px] h-full border-l border-border bg-background p-1.5 flex flex-col justify-between text-[8px] font-semibold">
        <span>Details</span>
        <span className="text-muted-foreground">Properties list...</span>
      </div>
    </div>
  ),
  createInstance: (id) => defaultBuilder(id, "shadcn:Sheet", "Sheet"),
});

registerComponent({
  id: "shadcn:Sonner",
  displayName: "Sonner",
  category: "Overlay",
  keywords: ["sonner", "toast", "alert", "notification"],
  description: "Event notification toast alert.",
  preview: () => (
    <div className="w-[185px] border border-border bg-card text-card-foreground rounded-lg p-2.5 shadow-md flex justify-between items-center text-[9px] font-semibold">
      <div>
        <span className="block font-bold">Event created</span>
        <span className="text-muted-foreground block">Monday, July 19 at 6:00 PM</span>
      </div>
      <button className="px-2 py-1 bg-accent border border-border rounded text-[8px] font-bold">Undo</button>
    </div>
  ),
  createInstance: (id) => defaultBuilder(id, "shadcn:Sonner", "Sonner"),
});

registerComponent({
  id: "shadcn:Toast",
  displayName: "Toast",
  category: "Overlay",
  keywords: ["toast", "notification", "alert", "popup"],
  description: "Trigger alert notification box.",
  preview: () => (
    <div className="w-[185px] border border-border bg-popover text-popover-foreground rounded-lg p-2.5 shadow-md text-left">
      <span className="text-[10px] font-bold block mb-0.5">Scheduled successfully</span>
      <span className="text-[8px] text-muted-foreground leading-tight block">
        We have added the timeline events to logs.
      </span>
    </div>
  ),
  createInstance: (id) => defaultBuilder(id, "shadcn:Toast", "Toast"),
});
