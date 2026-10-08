import { registerComponent, defaultBuilder } from "../registryCore";

// ── NAVIGATION ──────────────────────────────────────────────────────────────

registerComponent({
  id: "shadcn:Tabs",
  displayName: "Tabs",
  category: "Navigation",
  keywords: ["tabs", "navigation", "pills", "switch", "panels"],
  description: "Split content tabs menu switcher.",
  preview: () => (
    <div className="flex p-0.5 bg-secondary rounded-lg border border-border text-[10px] shadow-sm">
      <div className="px-3 py-1 bg-background text-foreground font-semibold rounded-md shadow-sm">Account</div>
      <div className="px-3 py-1 text-muted-foreground">Password</div>
    </div>
  ),
  createInstance: (id) => defaultBuilder(id, "shadcn:Tabs", "Tabs"),
});

registerComponent({
  id: "shadcn:Breadcrumb",
  displayName: "Breadcrumb",
  category: "Navigation",
  keywords: ["breadcrumb", "crumbs", "navigation", "path", "trail"],
  description: "Page hierarchy nav indicator.",
  preview: () => (
    <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-medium">
      <span className="hover:text-foreground">Home</span>
      <span>/</span>
      <span className="hover:text-foreground">Settings</span>
      <span>/</span>
      <span className="text-foreground font-semibold">History</span>
    </div>
  ),
  createInstance: (id) => defaultBuilder(id, "shadcn:Breadcrumb", "Breadcrumb"),
});

registerComponent({
  id: "shadcn:Pagination",
  displayName: "Pagination",
  category: "Navigation",
  keywords: ["pagination", "pager", "pages", "numbers", "nav"],
  description: "Sequential list pagination navigator.",
  preview: () => (
    <div className="flex items-center gap-1 text-[9px] font-semibold">
      <button className="px-2 py-1 border border-border bg-background rounded-md text-muted-foreground hover:bg-accent">
        ◀
      </button>
      <button className="w-5 h-5 bg-primary text-primary-foreground rounded-md flex items-center justify-center shadow-sm">
        1
      </button>
      <button className="w-5 h-5 border border-border bg-background text-foreground rounded-md flex items-center justify-center hover:bg-accent">
        2
      </button>
      <button className="px-2 py-1 border border-border bg-background rounded-md text-muted-foreground hover:bg-accent">
        ▶
      </button>
    </div>
  ),
  createInstance: (id) => defaultBuilder(id, "shadcn:Pagination", "Pagination"),
});

registerComponent({
  id: "shadcn:NavigationMenu",
  displayName: "Navigation Menu",
  category: "Navigation",
  keywords: ["navigation", "navbar", "menu", "header", "links"],
  description: "Horizontal drop-down menu items.",
  preview: () => (
    <div className="flex gap-4 text-xs font-semibold text-muted-foreground">
      <span className="text-foreground border-b-2 border-primary pb-0.5">Features</span>
      <span className="hover:text-foreground">Pricing</span>
      <span className="hover:text-foreground">Docs</span>
    </div>
  ),
  createInstance: (id) => defaultBuilder(id, "shadcn:NavigationMenu", "NavigationMenu"),
});

registerComponent({
  id: "shadcn:Menubar",
  displayName: "Menubar",
  category: "Navigation",
  keywords: ["menubar", "menu", "file", "actions", "list"],
  description: "Horizontal desktop application menubar.",
  preview: () => (
    <div className="w-[185px] flex gap-3 border border-border bg-background px-3 py-1 rounded-md text-[10px] font-semibold text-foreground shadow-sm">
      <span className="bg-accent px-1.5 py-0.5 rounded">File</span>
      <span className="hover:bg-accent px-1.5 py-0.5 rounded text-muted-foreground">Edit</span>
      <span className="hover:bg-accent px-1.5 py-0.5 rounded text-muted-foreground">View</span>
    </div>
  ),
  createInstance: (id) => defaultBuilder(id, "shadcn:Menubar", "Menubar"),
});

registerComponent({
  id: "shadcn:ContextMenu",
  displayName: "Context Menu",
  category: "Navigation",
  keywords: ["context", "menu", "right click", "popup", "action"],
  description: "Action overlay triggered on right click.",
  preview: () => (
    <div className="w-[160px] h-[50px] border border-dashed border-border bg-background rounded-md flex items-center justify-center text-[10px] text-muted-foreground font-semibold">
      Right click here
    </div>
  ),
  createInstance: (id) => defaultBuilder(id, "shadcn:ContextMenu", "ContextMenu"),
});

registerComponent({
  id: "shadcn:DropdownMenu",
  displayName: "Dropdown Menu",
  category: "Navigation",
  keywords: ["dropdown", "menu", "trigger", "options", "select"],
  description: "Action dropdown options menu list.",
  preview: () => (
    <div className="flex flex-col gap-1 w-[130px] border border-border bg-popover text-popover-foreground rounded-md p-1 shadow-md text-[10px] font-semibold">
      <div className="px-2 py-1 hover:bg-accent rounded">Profile Settings</div>
      <div className="px-2 py-1 hover:bg-accent rounded">Billing Info</div>
      <div className="border-t border-border/60 my-0.5" />
      <div className="px-2 py-1 hover:bg-destructive hover:text-destructive-foreground rounded">Logout</div>
    </div>
  ),
  createInstance: (id) => defaultBuilder(id, "shadcn:DropdownMenu", "DropdownMenu"),
});

registerComponent({
  id: "shadcn:Sidebar",
  displayName: "Sidebar",
  category: "Navigation",
  keywords: ["sidebar", "navigation", "layout", "menu", "dashboard"],
  description: "Collapsible vertical navigation sidebar.",
  preview: () => (
    <div className="w-[185px] border border-border bg-card rounded-md flex flex-col p-2 text-[9px] font-semibold text-muted-foreground shadow-sm h-[90px]">
      <div className="flex items-center gap-1.5 text-foreground mb-3 pb-1 border-b border-border/40">
        <span>⚡</span>
        <span className="font-bold">Nova Builder</span>
      </div>
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2 bg-accent text-accent-foreground px-2 py-1 rounded">
          <span>📁</span>
          <span>Projects</span>
        </div>
        <div className="flex items-center gap-2 px-2 py-1 hover:bg-accent/40 rounded">
          <span>⚙️</span>
          <span>Settings</span>
        </div>
      </div>
    </div>
  ),
  createInstance: (id) => defaultBuilder(id, "shadcn:Sidebar", "Sidebar"),
});

registerComponent({
  id: "shadcn:Command",
  displayName: "Command",
  category: "Navigation",
  keywords: ["command", "search", "palette", "k", "trigger"],
  description: "Search filter action command box.",
  preview: () => (
    <div className="w-[185px] border border-border bg-popover rounded-md flex flex-col p-1.5 text-[9px] shadow-md h-[95px]">
      <input
        type="text"
        placeholder="Type a command..."
        className="w-full border-b border-border bg-transparent outline-none pb-1.5 mb-1.5 text-[10px] text-foreground placeholder:text-muted-foreground"
        readOnly
      />
      <div className="flex flex-col gap-1 font-semibold text-foreground">
        <div className="px-2 py-1 bg-accent rounded flex justify-between items-center">
          <span>Search Files</span>
          <span className="text-[7px] text-muted-foreground">⌘P</span>
        </div>
        <div className="px-2 py-1 hover:bg-accent/40 rounded flex justify-between items-center">
          <span>Open Settings</span>
          <span className="text-[7px] text-muted-foreground">⌘,</span>
        </div>
      </div>
    </div>
  ),
  createInstance: (id) => defaultBuilder(id, "shadcn:Command", "Command"),
});
