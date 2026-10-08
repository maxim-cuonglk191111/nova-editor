"use client";
// shadcn/ui canvas components — Controls and navigation: slider, toggles, tabs, breadcrumb, pagination, menus.
// Builder-injected props are destructured so they never reach raw HTML elements.

import { forwardRef, type ReactNode } from "react";

// ─── Slider ─────────────────────────────────────────────────────────────────
export const ShadcnSlider = forwardRef<HTMLDivElement, {
  defaultValue?: number;
  [key: string]: any;
}>(({ defaultValue = 50, ...rest }, ref) => {
  return (
    <div ref={ref} className={`w-full max-w-[200px] h-6 flex items-center relative select-none cursor-pointer ${(rest.className as string) || ""}`} {...rest}>
      <div className="w-full h-1 bg-secondary rounded-full">
        <div className="h-full bg-primary rounded-full relative" style={{ width: `${defaultValue}%` }}>
          <div className="w-3.5 h-3.5 rounded-full bg-background border border-primary absolute right-0 -top-1 shadow-md hover:scale-110 transition-transform" />
        </div>
      </div>
    </div>
  );
});
ShadcnSlider.displayName = "ShadcnSlider";

// ─── Toggle ─────────────────────────────────────────────────────────────────
export const ShadcnToggle = forwardRef<HTMLButtonElement, {
  children?: ReactNode;
  isPressed?: boolean;
  [key: string]: any;
}>(({ children, isPressed = false, ...rest }, ref) => {
  return (
    <button
      ref={ref}
      className={`p-2 border rounded-md text-xs font-semibold shadow-sm transition-colors ${
        isPressed ? "bg-accent text-accent-foreground border-border" : "bg-transparent text-foreground border-transparent hover:bg-accent/40"
      } ${(rest.className as string) || ""}`}
      {...rest}
    >
      {children ?? "⭐ Star"}
    </button>
  );
});
ShadcnToggle.displayName = "ShadcnToggle";

// ─── ToggleGroup ────────────────────────────────────────────────────────────
export const ShadcnToggleGroup = forwardRef<HTMLDivElement, {
  [key: string]: any;
}>(({ ...rest }, ref) => {
  return (
    <div ref={ref} className={`flex border border-border rounded-md overflow-hidden bg-background divide-x divide-border shadow-sm ${(rest.className as string) || ""}`} {...rest}>
      <button className="px-3 py-1.5 text-xs font-bold bg-accent text-accent-foreground">B</button>
      <button className="px-3 py-1.5 text-xs italic text-foreground hover:bg-accent/30">I</button>
      <button className="px-3 py-1.5 text-xs underline text-foreground hover:bg-accent/30">U</button>
    </div>
  );
});
ShadcnToggleGroup.displayName = "ShadcnToggleGroup";

// ─── Tabs ───────────────────────────────────────────────────────────────────
export const ShadcnTabs = forwardRef<HTMLDivElement, {
  [key: string]: any;
}>(({ ...rest }, ref) => {
  return (
    <div ref={ref} className={`flex p-1 bg-secondary rounded-lg border border-border text-xs shadow-sm max-w-fit ${(rest.className as string) || ""}`} {...rest}>
      <div className="px-4 py-1.5 bg-background text-foreground font-semibold rounded-md shadow-sm cursor-pointer">Account</div>
      <div className="px-4 py-1.5 text-muted-foreground hover:text-foreground rounded-md cursor-pointer">Password</div>
    </div>
  );
});
ShadcnTabs.displayName = "ShadcnTabs";

// ─── Breadcrumb ─────────────────────────────────────────────────────────────
export const ShadcnBreadcrumb = forwardRef<HTMLDivElement, {
  [key: string]: any;
}>(({ ...rest }, ref) => {
  return (
    <div ref={ref} className={`flex items-center gap-1.5 text-xs text-muted-foreground font-medium ${(rest.className as string) || ""}`} {...rest}>
      <span className="hover:text-foreground cursor-pointer">Home</span>
      <span>/</span>
      <span className="hover:text-foreground cursor-pointer">Settings</span>
      <span>/</span>
      <span className="text-foreground font-semibold">History</span>
    </div>
  );
});
ShadcnBreadcrumb.displayName = "ShadcnBreadcrumb";

// ─── Pagination ─────────────────────────────────────────────────────────────
export const ShadcnPagination = forwardRef<HTMLDivElement, {
  [key: string]: any;
}>(({ ...rest }, ref) => {
  return (
    <div ref={ref} className={`flex items-center gap-1 text-xs font-semibold ${(rest.className as string) || ""}`} {...rest}>
      <button className="px-2.5 py-1 border border-border bg-background rounded-md text-muted-foreground hover:bg-accent">◀</button>
      <button className="w-7 h-7 bg-primary text-primary-foreground rounded-md flex items-center justify-center shadow-sm">1</button>
      <button className="w-7 h-7 border border-border bg-background text-foreground rounded-md flex items-center justify-center hover:bg-accent">2</button>
      <button className="w-7 h-7 border border-border bg-background text-foreground rounded-md flex items-center justify-center hover:bg-accent">3</button>
      <button className="px-2.5 py-1 border border-border bg-background rounded-md text-muted-foreground hover:bg-accent">▶</button>
    </div>
  );
});
ShadcnPagination.displayName = "ShadcnPagination";

// ─── NavigationMenu ─────────────────────────────────────────────────────────
export const ShadcnNavigationMenu = forwardRef<HTMLDivElement, {
  [key: string]: any;
}>(({ ...rest }, ref) => {
  return (
    <div ref={ref} className={`flex gap-6 text-sm font-semibold text-muted-foreground ${(rest.className as string) || ""}`} {...rest}>
      <span className="text-foreground border-b-2 border-primary pb-1">Features</span>
      <span className="hover:text-foreground cursor-pointer">Pricing</span>
      <span className="hover:text-foreground cursor-pointer">Docs</span>
    </div>
  );
});
ShadcnNavigationMenu.displayName = "ShadcnNavigationMenu";

// ─── Menubar ────────────────────────────────────────────────────────────────
export const ShadcnMenubar = forwardRef<HTMLDivElement, {
  [key: string]: any;
}>(({ ...rest }, ref) => {
  return (
    <div ref={ref} className={`w-full border border-border bg-background px-4 py-1.5 rounded-md flex gap-4 text-xs font-semibold text-foreground shadow-sm ${(rest.className as string) || ""}`} {...rest}>
      <span className="bg-accent px-2 py-0.5 rounded cursor-pointer">File</span>
      <span className="hover:bg-accent px-2 py-0.5 rounded text-muted-foreground cursor-pointer">Edit</span>
      <span className="hover:bg-accent px-2 py-0.5 rounded text-muted-foreground cursor-pointer">View</span>
    </div>
  );
});
ShadcnMenubar.displayName = "ShadcnMenubar";

// ─── ContextMenu ────────────────────────────────────────────────────────────
export const ShadcnContextMenu = forwardRef<HTMLDivElement, {
  [key: string]: any;
}>(({ ...rest }, ref) => {
  return (
    <div ref={ref} className={`w-full max-w-[200px] h-[60px] border border-dashed border-border bg-background rounded-md flex items-center justify-center text-xs text-muted-foreground font-semibold ${(rest.className as string) || ""}`} {...rest}>
      Right click here
    </div>
  );
});
ShadcnContextMenu.displayName = "ShadcnContextMenu";

// ─── DropdownMenu ───────────────────────────────────────────────────────────
export const ShadcnDropdownMenu = forwardRef<HTMLDivElement, {
  [key: string]: any;
}>(({ ...rest }, ref) => {
  return (
    <div ref={ref} className={`flex flex-col gap-1 w-[160px] border border-border bg-popover text-popover-foreground rounded-md p-1 shadow-md text-xs font-semibold ${(rest.className as string) || ""}`} {...rest}>
      <div className="px-2 py-1.5 hover:bg-accent rounded cursor-pointer">Profile Settings</div>
      <div className="px-2 py-1.5 hover:bg-accent rounded cursor-pointer">Billing Info</div>
      <div className="border-t border-border/60 my-0.5" />
      <div className="px-2 py-1.5 hover:bg-destructive hover:text-destructive-foreground rounded cursor-pointer">Logout</div>
    </div>
  );
});
ShadcnDropdownMenu.displayName = "ShadcnDropdownMenu";
