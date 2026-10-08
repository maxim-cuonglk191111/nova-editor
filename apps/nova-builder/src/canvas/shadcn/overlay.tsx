"use client";
// shadcn/ui canvas components — Overlays and feedback: sidebar, command, dialogs, popovers, drawers, toasts.
// Builder-injected props are destructured so they never reach raw HTML elements.

import { forwardRef } from "react";

// ─── Sidebar ────────────────────────────────────────────────────────────────
export const ShadcnSidebar = forwardRef<HTMLDivElement, {
  [key: string]: any;
}>(({ ...rest }, ref) => {
  return (
    <div ref={ref} className={`w-[220px] border-r border-border bg-card text-card-foreground flex flex-col p-3 text-xs font-semibold text-muted-foreground shadow-sm h-[140px] ${(rest.className as string) || ""}`} {...rest}>
      <div className="flex items-center gap-1.5 text-foreground mb-4 pb-1 border-b border-border/40">
        <span>⚡</span>
        <span className="font-bold">Nova Builder</span>
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2.5 bg-accent text-accent-foreground px-3 py-1.5 rounded cursor-pointer">
          <span>📁</span>
          <span>Projects</span>
        </div>
        <div className="flex items-center gap-2.5 px-3 py-1.5 hover:bg-accent/40 rounded cursor-pointer">
          <span>⚙️</span>
          <span>Settings</span>
        </div>
      </div>
    </div>
  );
});
ShadcnSidebar.displayName = "ShadcnSidebar";

// ─── Command ────────────────────────────────────────────────────────────────
export const ShadcnCommand = forwardRef<HTMLDivElement, {
  [key: string]: any;
}>(({ ...rest }, ref) => {
  return (
    <div ref={ref} className={`w-full max-w-[240px] border border-border bg-popover rounded-md flex flex-col p-2 text-xs shadow-md h-[120px] ${(rest.className as string) || ""}`} {...rest}>
      <input
        type="text"
        placeholder="Type a command..."
        className="w-full border-b border-border bg-transparent outline-none pb-2 mb-2 text-xs text-foreground placeholder:text-muted-foreground"
        readOnly
      />
      <div className="flex flex-col gap-1 font-semibold text-foreground">
        <div className="px-2 py-1.5 bg-accent rounded flex justify-between items-center cursor-pointer">
          <span>Search Files</span>
          <span className="text-[9px] text-muted-foreground">⌘P</span>
        </div>
        <div className="px-2 py-1.5 hover:bg-accent/40 rounded flex justify-between items-center cursor-pointer">
          <span>Open Settings</span>
          <span className="text-[9px] text-muted-foreground">⌘,</span>
        </div>
      </div>
    </div>
  );
});
ShadcnCommand.displayName = "ShadcnCommand";

// ─── Dialog ─────────────────────────────────────────────────────────────────
export const ShadcnDialog = forwardRef<HTMLDivElement, {
  [key: string]: any;
}>(({ ...rest }, ref) => {
  return (
    <div ref={ref} className={`w-full max-w-[240px] border border-border bg-popover text-popover-foreground rounded-lg p-4 shadow-lg text-left ${(rest.className as string) || ""}`} {...rest}>
      <span className="text-xs font-bold block mb-1">Edit Profile</span>
      <span className="text-[10px] text-muted-foreground block mb-3 leading-relaxed">
        {"Make changes here. Click save when you're done."}
      </span>
      <div className="flex justify-end gap-2 mt-2">
        <button className="px-3 py-1.5 border border-border rounded text-[10px] font-semibold hover:bg-accent">Cancel</button>
        <button className="px-3 py-1.5 bg-primary text-primary-foreground rounded text-[10px] font-semibold">Save</button>
      </div>
    </div>
  );
});
ShadcnDialog.displayName = "ShadcnDialog";

// ─── AlertDialog ────────────────────────────────────────────────────────────
export const ShadcnAlertDialog = forwardRef<HTMLDivElement, {
  [key: string]: any;
}>(({ ...rest }, ref) => {
  return (
    <div ref={ref} className={`w-full max-w-[240px] border border-destructive/20 bg-popover text-popover-foreground rounded-lg p-4 shadow-lg text-left ${(rest.className as string) || ""}`} {...rest}>
      <span className="text-xs font-bold block mb-1">Are you sure?</span>
      <span className="text-[10px] text-muted-foreground block mb-3 leading-relaxed">
        This action cannot be undone. Files will be deleted.
      </span>
      <div className="flex justify-end gap-2 mt-2">
        <button className="px-3 py-1.5 border border-border rounded text-[10px] font-semibold hover:bg-accent">Cancel</button>
        <button className="px-3 py-1.5 bg-destructive text-destructive-foreground rounded text-[10px] font-semibold">Delete</button>
      </div>
    </div>
  );
});
ShadcnAlertDialog.displayName = "ShadcnAlertDialog";

// ─── Popover ────────────────────────────────────────────────────────────────
export const ShadcnPopover = forwardRef<HTMLDivElement, {
  [key: string]: any;
}>(({ ...rest }, ref) => {
  return (
    <div ref={ref} className={`w-full max-w-[160px] border border-border bg-popover text-popover-foreground rounded-md p-2.5 shadow-md text-left text-[10px] leading-relaxed ${(rest.className as string) || ""}`} {...rest}>
      <span className="font-bold block mb-0.5 text-xs">Dimensions</span>
      <span className="text-muted-foreground">Adjust width & height sizes.</span>
    </div>
  );
});
ShadcnPopover.displayName = "ShadcnPopover";

// ─── Tooltip ────────────────────────────────────────────────────────────────
export const ShadcnTooltip = forwardRef<HTMLDivElement, {
  [key: string]: any;
}>(({ ...rest }, ref) => {
  return (
    <div ref={ref} className={`flex flex-col items-center gap-2 ${(rest.className as string) || ""}`} {...rest}>
      <div className="bg-foreground text-background px-3 py-1.5 rounded text-[10px] font-bold shadow">
        Add to library
      </div>
    </div>
  );
});
ShadcnTooltip.displayName = "ShadcnTooltip";

// ─── HoverCard ──────────────────────────────────────────────────────────────
export const ShadcnHoverCard = forwardRef<HTMLDivElement, {
  [key: string]: any;
}>(({ ...rest }, ref) => {
  return (
    <div ref={ref} className={`w-full max-w-[220px] border border-border bg-popover text-popover-foreground rounded-lg p-3 shadow-md flex gap-3 text-left text-xs leading-relaxed ${(rest.className as string) || ""}`} {...rest}>
      <div className="w-8 h-8 rounded-full bg-secondary shrink-0 font-bold flex items-center justify-center text-xs">N</div>
      <div className="flex flex-col gap-0.5">
        <span className="font-bold text-foreground">@nextjs</span>
        <span className="text-muted-foreground">React framework built for the web.</span>
      </div>
    </div>
  );
});
ShadcnHoverCard.displayName = "ShadcnHoverCard";

// ─── Drawer ─────────────────────────────────────────────────────────────────
export const ShadcnDrawer = forwardRef<HTMLDivElement, {
  [key: string]: any;
}>(({ ...rest }, ref) => {
  return (
    <div ref={ref} className={`w-full max-w-[240px] border border-border bg-popover rounded-t-xl shadow-lg flex flex-col justify-end p-3 border-b-0 h-[80px] relative overflow-hidden ${(rest.className as string) || ""}`} {...rest}>
      <div className="w-8 h-1 bg-border rounded-full mx-auto mb-2" />
      <span className="text-xs font-bold text-foreground block text-center">Settings Drawer</span>
      <span className="text-[9px] text-muted-foreground block text-center mb-1">Set project variables</span>
    </div>
  );
});
ShadcnDrawer.displayName = "ShadcnDrawer";

// ─── Sheet ──────────────────────────────────────────────────────────────────
export const ShadcnSheet = forwardRef<HTMLDivElement, {
  [key: string]: any;
}>(({ ...rest }, ref) => {
  return (
    <div ref={ref} className={`w-full max-w-[240px] border border-border bg-popover rounded-md shadow-lg flex justify-end h-[90px] relative overflow-hidden ${(rest.className as string) || ""}`} {...rest}>
      <div className="w-[80px] h-full border-l border-border bg-background p-2 flex flex-col justify-between text-[10px] font-semibold">
        <span>Details</span>
        <span className="text-muted-foreground">Properties list...</span>
      </div>
    </div>
  );
});
ShadcnSheet.displayName = "ShadcnSheet";

// ─── Sonner ─────────────────────────────────────────────────────────────────
export const ShadcnSonner = forwardRef<HTMLDivElement, {
  [key: string]: any;
}>(({ ...rest }, ref) => {
  return (
    <div ref={ref} className={`w-full max-w-[240px] border border-border bg-card text-card-foreground rounded-lg p-3 shadow-md flex justify-between items-center text-xs font-semibold ${(rest.className as string) || ""}`} {...rest}>
      <div>
        <span className="block font-bold">Event created</span>
        <span className="text-muted-foreground block text-[10px]">Monday, July 19 at 6:00 PM</span>
      </div>
      <button className="px-2.5 py-1 bg-accent border border-border rounded text-[9px] font-bold">Undo</button>
    </div>
  );
});
ShadcnSonner.displayName = "ShadcnSonner";

// ─── Toast ──────────────────────────────────────────────────────────────────
export const ShadcnToast = forwardRef<HTMLDivElement, {
  [key: string]: any;
}>(({ ...rest }, ref) => {
  return (
    <div ref={ref} className={`w-full max-w-[240px] border border-border bg-popover text-popover-foreground rounded-lg p-3 shadow-md text-left ${(rest.className as string) || ""}`} {...rest}>
      <span className="text-xs font-bold block mb-0.5">Scheduled successfully</span>
      <span className="text-[10px] text-muted-foreground leading-normal block">
        We have added the timeline events to logs.
      </span>
    </div>
  );
});
ShadcnToast.displayName = "ShadcnToast";
