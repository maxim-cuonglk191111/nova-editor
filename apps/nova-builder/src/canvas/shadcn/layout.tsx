"use client";
// shadcn/ui canvas components — Layout: card, separator, scroll/aspect boxes, accordion, carousel, grid rows/cols, container, section.
// Builder-injected props are destructured so they never reach raw HTML elements.

import { forwardRef, useState, type ReactNode } from "react";

// ─── Card ───────────────────────────────────────────────────────────────────
export const ShadcnCard = forwardRef<HTMLDivElement, {
  children?: ReactNode;
  [key: string]: any;
}>(({ children, ...rest }, ref) => {
  return (
    <div
      ref={ref}
      className={`border border-border bg-card text-card-foreground rounded-xl p-4 shadow-sm ${(rest.className as string) || ""}`}
      {...rest}
    >
      {children ?? <div className="text-xs">Card Content</div>}
    </div>
  );
});
ShadcnCard.displayName = "ShadcnCard";

// ─── Separator ──────────────────────────────────────────────────────────────
export const ShadcnSeparator = forwardRef<HTMLHRElement, {
  orientation?: "horizontal" | "vertical";
  [key: string]: any;
}>(({ orientation = "horizontal", ...rest }, ref) => {
  return (
    <hr
      ref={ref}
      className={`${orientation === "horizontal" ? "w-full h-[1px] my-2" : "h-full w-[1px] mx-2"} bg-border border-none ${(rest.className as string) || ""}`}
      {...rest}
    />
  );
});
ShadcnSeparator.displayName = "ShadcnSeparator";

// ─── Resizable ──────────────────────────────────────────────────────────────
export const ShadcnResizable = forwardRef<HTMLDivElement, {
  [key: string]: any;
}>(({ ...rest }, ref) => {
  return (
    <div ref={ref} className={`w-full border border-border rounded-md flex overflow-hidden text-xs font-semibold text-center select-none shadow-sm h-[50px] ${(rest.className as string) || ""}`} {...rest}>
      <div className="w-[50%] bg-accent/30 flex items-center justify-center text-muted-foreground">Panel A</div>
      <div className="w-1.5 bg-border flex items-center justify-center text-[10px] text-muted-foreground cursor-col-resize">⋮</div>
      <div className="flex-1 flex items-center justify-center text-muted-foreground">Panel B</div>
    </div>
  );
});
ShadcnResizable.displayName = "ShadcnResizable";

// ─── ScrollArea ─────────────────────────────────────────────────────────────
export const ShadcnScrollArea = forwardRef<HTMLDivElement, {
  children?: ReactNode;
  [key: string]: any;
}>(({ children, ...rest }, ref) => {
  return (
    <div ref={ref} className={`w-full border border-border bg-background rounded-md p-2 overflow-hidden relative shadow-sm h-[60px] ${(rest.className as string) || ""}`} {...rest}>
      <div className="h-full overflow-y-auto pr-3 scrollbar-thin text-xs text-muted-foreground">
        {children ?? "Scrollable content list..."}
      </div>
    </div>
  );
});
ShadcnScrollArea.displayName = "ShadcnScrollArea";

// ─── AspectRatio ────────────────────────────────────────────────────────────
export const ShadcnAspectRatio = forwardRef<HTMLDivElement, {
  [key: string]: any;
}>(({ ...rest }, ref) => {
  return (
    <div ref={ref} className={`w-full aspect-video border border-dashed border-border bg-secondary/50 rounded flex items-center justify-center text-xs text-muted-foreground font-semibold ${(rest.className as string) || ""}`} {...rest}>
      16:9 Aspect Ratio
    </div>
  );
});
ShadcnAspectRatio.displayName = "ShadcnAspectRatio";

// ─── Collapsible ────────────────────────────────────────────────────────────
export const ShadcnCollapsible = forwardRef<HTMLDivElement, {
  children?: ReactNode;
  label?: string;
  [key: string]: any;
}>(({ children, label = "Settings panel", ...rest }, ref) => {
  const [open, setOpen] = useState(true);
  return (
    <div ref={ref} className={`w-full border border-border bg-background rounded-md p-2 text-xs font-semibold shadow-sm ${(rest.className as string) || ""}`} {...rest}>
      <div className="flex justify-between items-center cursor-pointer" onClick={() => setOpen(!open)}>
        <span>{label}</span>
        <span>{open ? "▼" : "▶"}</span>
      </div>
      {open && <div className="mt-2 border-t border-border/40 pt-1.5 text-muted-foreground">{children ?? "Content panel"}</div>}
    </div>
  );
});
ShadcnCollapsible.displayName = "ShadcnCollapsible";

// ─── Accordion ──────────────────────────────────────────────────────────────
export const ShadcnAccordion = forwardRef<HTMLDivElement, {
  [key: string]: any;
}>(({ ...rest }, ref) => {
  return (
    <div ref={ref} className={`w-full flex flex-col border border-border bg-background rounded-md p-2.5 text-xs font-semibold divide-y divide-border/40 shadow-sm text-left ${(rest.className as string) || ""}`} {...rest}>
      <div className="py-1 flex justify-between items-center text-primary cursor-pointer">
        <span>Is it responsive?</span>
        <span>▲</span>
      </div>
      <div className="py-1 pb-2 text-muted-foreground leading-normal">
        Yes, all components support responsive layout columns.
      </div>
      <div className="py-2 flex justify-between items-center text-foreground cursor-pointer">
        <span>Can I edit colors?</span>
        <span>▼</span>
      </div>
    </div>
  );
});
ShadcnAccordion.displayName = "ShadcnAccordion";

// ─── Carousel ───────────────────────────────────────────────────────────────
export const ShadcnCarousel = forwardRef<HTMLDivElement, {
  [key: string]: any;
}>(({ ...rest }, ref) => {
  return (
    <div ref={ref} className={`w-full border border-border bg-secondary rounded-lg flex items-center justify-between p-3 shadow-sm h-[70px] ${(rest.className as string) || ""}`} {...rest}>
      <button className="w-6 h-6 bg-background border border-border rounded-full text-xs flex items-center justify-center font-bold">◀</button>
      <span className="text-xs font-bold text-muted-foreground">Slide 1 of 3</span>
      <button className="w-6 h-6 bg-background border border-border rounded-full text-xs flex items-center justify-center font-bold">▶</button>
    </div>
  );
});
ShadcnCarousel.displayName = "ShadcnCarousel";

// ─── Row ────────────────────────────────────────────────────────────────────
export const ShadcnRow = forwardRef<HTMLDivElement, {
  children?: ReactNode;
  gap?: string;
  [key: string]: any;
}>(({ children, gap = "16px", ...rest }, ref) => {
  return (
    <div
      ref={ref}
      style={{ gap }}
      className={`grid grid-cols-12 w-full box-border min-h-[40px] ${(rest.className as string) || ""}`}
      {...rest}
    >
      {children}
    </div>
  );
});
ShadcnRow.displayName = "ShadcnRow";

// ─── Col ────────────────────────────────────────────────────────────────────
export const ShadcnCol = forwardRef<HTMLDivElement, {
  children?: ReactNode;
  span?: number;
  [key: string]: any;
}>(({ children, span = 6, ...rest }, ref) => {
  return (
    <div
      ref={ref}
      className={`col-span-${span} min-w-0 ${(rest.className as string) || ""}`}
      {...rest}
    >
      {children}
    </div>
  );
});
ShadcnCol.displayName = "ShadcnCol";

// ─── Container ──────────────────────────────────────────────────────────────
export const ShadcnContainer = forwardRef<HTMLDivElement, {
  children?: ReactNode;
  direction?: "row" | "column";
  justify?: "start" | "center" | "end" | "between" | "around" | "evenly";
  align?: "start" | "center" | "end" | "stretch" | "baseline";
  gap?: string;
  padding?: string;
  wrap?: "nowrap" | "wrap" | "wrap-reverse";
  [key: string]: any;
}>(({ children, direction = "column", justify = "start", align = "stretch", gap = "0px", padding = "16px", wrap = "nowrap", ...rest }, ref) => {
  const flexDir = direction === "row" ? "flex-row" : "flex-col";
  const flexJust = {
    start: "justify-start",
    center: "justify-center",
    end: "justify-end",
    between: "justify-between",
    around: "justify-around",
    evenly: "justify-evenly",
  }[justify] || "justify-start";
  const flexAlign = {
    start: "items-start",
    center: "items-center",
    end: "items-end",
    stretch: "items-stretch",
    baseline: "items-baseline",
  }[align] || "items-stretch";
  const flexWrap = wrap === "wrap" ? "flex-wrap" : wrap === "wrap-reverse" ? "flex-wrap-reverse" : "flex-nowrap";

  return (
    <div
      ref={ref}
      style={{ gap, padding }}
      className={`flex ${flexDir} ${flexJust} ${flexAlign} ${flexWrap} w-full box-border min-h-[40px] ${(rest.className as string) || ""}`}
      {...rest}
    >
      {children}
    </div>
  );
});
ShadcnContainer.displayName = "ShadcnContainer";

// ─── Section ────────────────────────────────────────────────────────────────
export const ShadcnSection = forwardRef<HTMLElement, {
  children?: ReactNode;
  padding?: string;
  maxWidth?: string;
  background?: string;
  [key: string]: any;
}>(({ children, padding = "48px 24px", maxWidth = "1200px", background = "transparent", ...rest }, ref) => {
  return (
    <section
      ref={ref}
      style={{ padding, background }}
      className={`w-full flex flex-col box-border min-h-[80px] ${(rest.className as string) || ""}`}
      {...rest}
    >
      <div style={{ maxWidth }} className="w-full mx-auto flex flex-col">
        {children}
      </div>
    </section>
  );
});
ShadcnSection.displayName = "ShadcnSection";

// ─── FlexRow ────────────────────────────────────────────────────────────────
export const ShadcnFlexRow = forwardRef<HTMLDivElement, {
  children?: ReactNode;
  gap?: string;
  justify?: "start" | "center" | "end" | "between" | "around";
  align?: "start" | "center" | "end" | "stretch";
  wrap?: "nowrap" | "wrap";
  [key: string]: any;
}>(({ children, gap = "12px", justify = "start", align = "center", wrap = "wrap", ...rest }, ref) => {
  const flexJust = {
    start: "justify-start",
    center: "justify-center",
    end: "justify-end",
    between: "justify-between",
    around: "justify-around",
  }[justify] || "justify-start";
  const flexAlign = {
    start: "items-start",
    center: "items-center",
    end: "items-end",
    stretch: "items-stretch",
  }[align] || "items-stretch";
  const flexWrap = wrap === "wrap" ? "flex-wrap" : "flex-nowrap";

  return (
    <div
      ref={ref}
      style={{ gap }}
      className={`flex flex-row ${flexJust} ${flexAlign} ${flexWrap} w-full box-border min-h-[32px] ${(rest.className as string) || ""}`}
      {...rest}
    >
      {children}
    </div>
  );
});
ShadcnFlexRow.displayName = "ShadcnFlexRow";

// ─── Spacer ─────────────────────────────────────────────────────────────────
export const ShadcnSpacer = forwardRef<HTMLDivElement, {
  height?: string;
  [key: string]: any;
}>(({ height = "24px", ...rest }, ref) => {
  return (
    <div
      ref={ref}
      style={{ height }}
      className={`w-full shrink-0 ${(rest.className as string) || ""}`}
      {...rest}
    />
  );
});
ShadcnSpacer.displayName = "ShadcnSpacer";
