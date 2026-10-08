"use client";
// shadcn/ui canvas components — Display: avatar, badge, table, skeleton, progress, code, text, heading, link, data table, chart.
// Builder-injected props are destructured so they never reach raw HTML elements.

import { forwardRef, type ReactNode } from "react";

// ─── Avatar ─────────────────────────────────────────────────────────────────
export const ShadcnAvatar = forwardRef<HTMLDivElement, {
  src?: string;
  name?: string;
  [key: string]: any;
}>(({ src, name = "John Doe", ...rest }, ref) => {
  const initials = name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  return (
    <div ref={ref} className={`w-9 h-9 rounded-full bg-secondary text-foreground font-semibold flex items-center justify-center text-xs overflow-hidden shrink-0 shadow-sm border border-border ${(rest.className as string) || ""}`} {...rest}>
      {src ? <img src={src} alt={name} className="w-full h-full object-cover" /> : initials}
    </div>
  );
});
ShadcnAvatar.displayName = "ShadcnAvatar";

// ─── Badge ──────────────────────────────────────────────────────────────────
export const ShadcnBadge = forwardRef<HTMLSpanElement, {
  children?: ReactNode;
  variant?: "default" | "secondary" | "destructive" | "outline";
  [key: string]: any;
}>(({ children, variant = "default", ...rest }, ref) => {
  const base = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring";
  const variants = {
    default: "bg-primary text-primary-foreground hover:bg-primary/80",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/80",
    outline: "text-foreground border border-input",
  };
  return (
    <span ref={ref} className={`${base} ${variants[variant]} ${(rest.className as string) || ""}`} {...rest}>
      {children ?? "Badge"}
    </span>
  );
});
ShadcnBadge.displayName = "ShadcnBadge";

// ─── Table ──────────────────────────────────────────────────────────────────
export const ShadcnTable = forwardRef<HTMLDivElement, {
  [key: string]: any;
}>(({ ...rest }, ref) => {
  return (
    <div ref={ref} className={`w-full border border-border rounded-lg overflow-x-auto bg-background shadow-sm text-left text-xs ${(rest.className as string) || ""}`} {...rest}>
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-secondary border-b border-border text-foreground font-semibold">
            <th className="p-3 text-left">Invoice</th>
            <th className="p-3 text-left">Status</th>
            <th className="p-3 text-right">Amount</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60 text-muted-foreground">
          <tr>
            <td className="p-3 font-semibold text-foreground">INV-001</td>
            <td className="p-3">Paid</td>
            <td className="p-3 text-right">$250.00</td>
          </tr>
          <tr>
            <td className="p-3 font-semibold text-foreground">INV-002</td>
            <td className="p-3">Pending</td>
            <td className="p-3 text-right">$120.00</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
});
ShadcnTable.displayName = "ShadcnTable";

// ─── Skeleton ───────────────────────────────────────────────────────────────
export const ShadcnSkeleton = forwardRef<HTMLDivElement, {
  [key: string]: any;
}>(({ ...rest }, ref) => {
  return (
    <div ref={ref} className={`w-full flex items-center gap-3 ${(rest.className as string) || ""}`} {...rest}>
      <div className="w-9 h-9 rounded-full bg-secondary shrink-0 animate-pulse" />
      <div className="w-full flex flex-col gap-2">
        <div className="h-3 w-[60%] bg-secondary rounded animate-pulse" />
        <div className="h-2 w-[80%] bg-secondary/80 rounded animate-pulse" />
      </div>
    </div>
  );
});
ShadcnSkeleton.displayName = "ShadcnSkeleton";

// ─── Progress ───────────────────────────────────────────────────────────────
export const ShadcnProgress = forwardRef<HTMLDivElement, {
  value?: number;
  [key: string]: any;
}>(({ value = 60, ...rest }, ref) => {
  return (
    <div ref={ref} className={`w-full flex flex-col gap-1.5 text-xs text-muted-foreground font-semibold text-left ${(rest.className as string) || ""}`} {...rest}>
      <div className="flex justify-between">
        <span>Progress</span>
        <span>{value}%</span>
      </div>
      <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
});
ShadcnProgress.displayName = "ShadcnProgress";

// ─── Code ───────────────────────────────────────────────────────────────────
export const ShadcnCode = forwardRef<HTMLElement, {
  children?: ReactNode;
  [key: string]: any;
}>(({ children, ...rest }, ref) => {
  return (
    <code
      ref={ref}
      className={`px-2 py-1 bg-secondary text-foreground font-mono text-xs rounded border border-border ${(rest.className as string) || ""}`}
      {...rest}
    >
      {children ?? "const x = 5;"}
    </code>
  );
});
ShadcnCode.displayName = "ShadcnCode";

// ─── Kbd ────────────────────────────────────────────────────────────────────
export const ShadcnKbd = forwardRef<HTMLSpanElement, {
  children?: ReactNode;
  [key: string]: any;
}>(({ children, ...rest }, ref) => {
  return (
    <kbd
      ref={ref}
      className={`px-1.5 py-0.5 border border-border bg-secondary text-foreground font-semibold rounded text-[10px] shadow-sm select-none ${(rest.className as string) || ""}`}
      {...rest}
    >
      {children ?? "Ctrl + P"}
    </kbd>
  );
});
ShadcnKbd.displayName = "ShadcnKbd";

// ─── Text ───────────────────────────────────────────────────────────────────
export const ShadcnText = forwardRef<HTMLParagraphElement, {
  children?: ReactNode;
  fontSize?: string;
  fontWeight?: string;
  color?: string;
  textAlign?: "left" | "center" | "right" | "justify";
  [key: string]: any;
}>(({ children, fontSize = "16px", fontWeight = "400", color = "inherit", textAlign = "left", ...rest }, ref) => {
  return (
    <p
      ref={ref}
      style={{ fontSize, fontWeight, color, textAlign }}
      className={`leading-relaxed m-0 ${(rest.className as string) || ""}`}
      {...rest}
    >
      {children ?? "Generic text / paragraph element."}
    </p>
  );
});
ShadcnText.displayName = "ShadcnText";

// ─── Heading ────────────────────────────────────────────────────────────────
export const ShadcnHeading = forwardRef<HTMLHeadingElement, {
  children?: ReactNode;
  level?: number;
  textAlign?: "left" | "center" | "right";
  color?: string;
  [key: string]: any;
}>(({ children, level = 2, textAlign = "left", color = "inherit", ...rest }, ref) => {
  const Tag = `h${level}` as "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  const fontSizes = {
    1: "text-3xl font-extrabold tracking-tight",
    2: "text-2xl font-bold tracking-tight",
    3: "text-xl font-semibold tracking-tight",
    4: "text-lg font-semibold",
    5: "text-base font-medium",
    6: "text-sm font-medium",
  }[level] || "text-2xl font-bold";

  return (
    <Tag
      ref={ref as any}
      style={{ color, textAlign }}
      className={`${fontSizes} leading-tight m-0 ${(rest.className as string) || ""}`}
      {...rest}
    >
      {children ?? "Heading"}
    </Tag>
  );
});
ShadcnHeading.displayName = "ShadcnHeading";

// ─── Link ───────────────────────────────────────────────────────────────────
export const ShadcnLink = forwardRef<HTMLAnchorElement, {
  children?: ReactNode;
  href?: string;
  target?: "_self" | "_blank";
  color?: string;
  [key: string]: any;
}>(({ children, href = "#", target = "_self", color = "var(--ui-accent)", ...rest }, ref) => {
  return (
    <a
      ref={ref}
      href={href}
      target={target}
      style={{ color }}
      className={`underline underline-offset-4 hover:opacity-85 cursor-pointer ${(rest.className as string) || ""}`}
      {...rest}
    >
      {children ?? "Link text"}
    </a>
  );
});
ShadcnLink.displayName = "ShadcnLink";

// ─── DataTable ──────────────────────────────────────────────────────────────
export const ShadcnDataTable = forwardRef<HTMLDivElement, {
  [key: string]: any;
}>(({ ...rest }, ref) => {
  return (
    <div ref={ref} className={`w-full border border-border bg-background rounded-lg p-3.5 flex flex-col gap-3 shadow-sm text-left text-xs ${(rest.className as string) || ""}`} {...rest}>
      <div className="flex justify-between items-center border-b border-border/40 pb-2">
        <div className="border border-input rounded px-3 py-1 text-muted-foreground bg-background">Filter emails...</div>
        <div className="text-muted-foreground border border-input rounded px-2.5 py-1 bg-background cursor-pointer">Columns ▼</div>
      </div>
      <div className="divide-y divide-border/30">
        <div className="grid grid-cols-2 py-2 text-foreground font-semibold">
          <span>jane.doe@example.com</span>
          <span className="text-right text-emerald-500 font-bold">Success</span>
        </div>
        <div className="grid grid-cols-2 py-2 text-foreground font-semibold">
          <span>bob.smith@example.com</span>
          <span className="text-right text-amber-500 font-bold">Pending</span>
        </div>
      </div>
      <div className="flex justify-between items-center pt-2 border-t border-border/40 text-muted-foreground">
        <span>Page 1 of 5</span>
        <div className="flex gap-1.5">
          <button className="border border-border bg-background px-2.5 py-1 rounded hover:bg-accent">Prev</button>
          <button className="border border-border bg-background px-2.5 py-1 rounded hover:bg-accent">Next</button>
        </div>
      </div>
    </div>
  );
});
ShadcnDataTable.displayName = "ShadcnDataTable";

// ─── Chart ──────────────────────────────────────────────────────────────────
export const ShadcnChart = forwardRef<HTMLDivElement, {
  [key: string]: any;
}>(({ ...rest }, ref) => {
  return (
    <div ref={ref} className={`w-full max-w-[280px] border border-border bg-card rounded-xl p-4 shadow-sm flex flex-col justify-between text-left h-[130px] ${(rest.className as string) || ""}`} {...rest}>
      <div className="flex justify-between items-center text-xs font-bold text-foreground">
        <span>Weekly Visitors</span>
        <span className="text-[10px] text-muted-foreground">Last 7 days</span>
      </div>
      <div className="flex items-end justify-between gap-2.5 h-[65px] pt-2 border-b border-border/20 pb-1">
        <div className="w-full bg-primary/20 rounded-t h-[40%] hover:bg-primary transition-all cursor-pointer" title="Monday: 120" />
        <div className="w-full bg-primary/30 rounded-t h-[60%] hover:bg-primary transition-all cursor-pointer" title="Tuesday: 180" />
        <div className="w-full bg-primary rounded-t h-[90%] hover:bg-primary transition-all cursor-pointer" title="Wednesday: 270" />
        <div className="w-full bg-primary/45 rounded-t h-[70%] hover:bg-primary transition-all cursor-pointer" title="Thursday: 210" />
        <div className="w-full bg-primary/35 rounded-t h-[50%] hover:bg-primary transition-all cursor-pointer" title="Friday: 150" />
        <div className="w-full bg-primary/55 rounded-t h-[75%] hover:bg-primary transition-all cursor-pointer" title="Saturday: 230" />
        <div className="w-full bg-primary/80 rounded-t h-[95%] hover:bg-primary transition-all cursor-pointer" title="Sunday: 290" />
      </div>
    </div>
  );
});
ShadcnChart.displayName = "ShadcnChart";
