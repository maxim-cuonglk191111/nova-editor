"use client";
// shadcn/ui canvas components — Form inputs: button, text fields, choice controls, pickers, label.
// Builder-injected props are destructured so they never reach raw HTML elements.

import { forwardRef, useState, type ReactNode } from "react";

// ─── Button ─────────────────────────────────────────────────────────────────
export const ShadcnButton = forwardRef<HTMLButtonElement, {
  children?: ReactNode;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  isDisabled?: boolean;
  [key: string]: any;
}>(({ children, variant = "default", size = "default", isDisabled, ...rest }, ref) => {
  const base = "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:pointer-events-none";
  const variants = {
    default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm",
    destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm",
    outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground shadow-sm",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-sm",
    ghost: "hover:bg-accent hover:text-accent-foreground",
    link: "text-primary underline-offset-4 hover:underline",
  };
  const sizes = {
    default: "h-9 px-4 py-2",
    sm: "h-8 rounded-md px-3 text-xs",
    lg: "h-10 rounded-md px-8",
    icon: "h-9 w-9",
  };
  return (
    <button
      ref={ref}
      disabled={isDisabled}
      className={`${base} ${variants[variant]} ${sizes[size]} ${(rest.className as string) || ""}`}
      {...rest}
    >
      {children ?? "Button"}
    </button>
  );
});
ShadcnButton.displayName = "ShadcnButton";

// ─── Input ──────────────────────────────────────────────────────────────────
export const ShadcnInput = forwardRef<HTMLInputElement, {
  placeholder?: string;
  type?: string;
  isDisabled?: boolean;
  [key: string]: any;
}>(({ placeholder = "Search...", type = "text", isDisabled, ...rest }, ref) => {
  return (
    <input
      ref={ref}
      type={type}
      placeholder={placeholder}
      disabled={isDisabled}
      className={`flex h-9 w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${(rest.className as string) || ""}`}
      {...rest}
    />
  );
});
ShadcnInput.displayName = "ShadcnInput";

// ─── Textarea ───────────────────────────────────────────────────────────────
export const ShadcnTextarea = forwardRef<HTMLTextAreaElement, {
  placeholder?: string;
  isDisabled?: boolean;
  [key: string]: any;
}>(({ placeholder = "Type message...", isDisabled, ...rest }, ref) => {
  return (
    <textarea
      ref={ref}
      placeholder={placeholder}
      disabled={isDisabled}
      className={`flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${(rest.className as string) || ""}`}
      {...rest}
    />
  );
});
ShadcnTextarea.displayName = "ShadcnTextarea";

// ─── Checkbox ───────────────────────────────────────────────────────────────
export const ShadcnCheckbox = forwardRef<HTMLDivElement, {
  children?: ReactNode;
  isChecked?: boolean;
  isDisabled?: boolean;
  [key: string]: any;
}>(({ children, isChecked = true, isDisabled, ...rest }, ref) => {
  return (
    <div
      ref={ref}
      className={`flex items-center gap-2 select-none ${isDisabled ? "opacity-50 pointer-events-none" : ""} ${(rest.className as string) || ""}`}
      {...rest}
    >
      <div className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] font-bold transition-all ${isChecked ? "bg-primary border-primary text-primary-foreground" : "border-input bg-background"}`}>
        {isChecked && "✓"}
      </div>
      <span className="text-sm font-medium text-foreground">{children ?? "Accept terms"}</span>
    </div>
  );
});
ShadcnCheckbox.displayName = "ShadcnCheckbox";

// ─── Switch ─────────────────────────────────────────────────────────────────
export const ShadcnSwitch = forwardRef<HTMLDivElement, {
  children?: ReactNode;
  isChecked?: boolean;
  isDisabled?: boolean;
  [key: string]: any;
}>(({ children, isChecked = true, isDisabled, ...rest }, ref) => {
  return (
    <div
      ref={ref}
      className={`flex items-center gap-2 select-none ${isDisabled ? "opacity-50 pointer-events-none" : ""} ${(rest.className as string) || ""}`}
      {...rest}
    >
      <div className={`w-8 h-4 rounded-full relative p-0.5 transition-colors cursor-pointer ${isChecked ? "bg-primary" : "bg-muted"}`}>
        <div className={`w-3 h-3 rounded-full bg-background transition-transform shadow-sm ${isChecked ? "translate-x-4" : "translate-x-0"}`} />
      </div>
      {children && <span className="text-sm font-medium text-foreground">{children}</span>}
    </div>
  );
});
ShadcnSwitch.displayName = "ShadcnSwitch";

// ─── RadioGroup ─────────────────────────────────────────────────────────────
export const ShadcnRadioGroup = forwardRef<HTMLDivElement, {
  label?: string;
  defaultValue?: string;
  [key: string]: any;
}>(({ label = "Select option", defaultValue = "a", ...rest }, ref) => {
  const [val, setVal] = useState(defaultValue);
  return (
    <div ref={ref} className={`flex flex-col gap-2 text-xs text-foreground ${(rest.className as string) || ""}`} {...rest}>
      {label && <span className="font-semibold text-muted-foreground">{label}</span>}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setVal("a")}>
          <div className="w-3.5 h-3.5 rounded-full border border-primary flex items-center justify-center">
            {val === "a" && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
          </div>
          <span>Option A</span>
        </div>
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setVal("b")}>
          <div className="w-3.5 h-3.5 rounded-full border border-primary flex items-center justify-center">
            {val === "b" && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
          </div>
          <span>Option B</span>
        </div>
      </div>
    </div>
  );
});
ShadcnRadioGroup.displayName = "ShadcnRadioGroup";

// ─── Select ─────────────────────────────────────────────────────────────────
export const ShadcnSelect = forwardRef<HTMLDivElement, {
  placeholder?: string;
  defaultValue?: string;
  [key: string]: any;
}>(({ placeholder = "Select option", defaultValue = "Active", ...rest }, ref) => {
  return (
    <div
      ref={ref}
      className={`w-full max-w-[200px] border border-input bg-background px-3 py-1.5 rounded-md flex justify-between items-center text-sm text-foreground shadow-sm cursor-pointer hover:bg-accent/40 ${(rest.className as string) || ""}`}
      {...rest}
    >
      <span>{defaultValue || placeholder}</span>
      <span className="text-[10px] text-muted-foreground">▼</span>
    </div>
  );
});
ShadcnSelect.displayName = "ShadcnSelect";

// ─── Combobox ───────────────────────────────────────────────────────────────
export const ShadcnCombobox = forwardRef<HTMLDivElement, {
  placeholder?: string;
  [key: string]: any;
}>(({ placeholder = "Select item...", ...rest }, ref) => {
  return (
    <div
      ref={ref}
      className={`w-full max-w-[200px] border border-input bg-background px-3 py-1.5 rounded-md flex justify-between items-center text-sm text-foreground shadow-sm cursor-pointer hover:bg-accent/40 ${(rest.className as string) || ""}`}
      {...rest}
    >
      <span className="text-muted-foreground">{placeholder}</span>
      <span className="text-[10px] text-muted-foreground">↕</span>
    </div>
  );
});
ShadcnCombobox.displayName = "ShadcnCombobox";

// ─── Calendar ───────────────────────────────────────────────────────────────
export const ShadcnCalendar = forwardRef<HTMLDivElement, {
  [key: string]: any;
}>(({ ...rest }, ref) => {
  return (
    <div ref={ref} className={`border border-border p-3 bg-background rounded-md text-xs w-[180px] text-foreground shadow-sm ${(rest.className as string) || ""}`} {...rest}>
      <div className="flex justify-between items-center mb-1 font-semibold border-b border-border pb-1">
        <span>◀</span>
        <span>July 2026</span>
        <span>▶</span>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-muted-foreground font-medium mb-1">
        <span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {Array.from({ length: 31 }, (_, i) => {
          const day = i + 1;
          const isSelected = day === 19;
          return (
            <span
              key={day}
              className={`p-1 rounded-md cursor-pointer ${
                isSelected ? "bg-primary text-primary-foreground font-bold" : "hover:bg-accent"
              }`}
            >
              {day}
            </span>
          );
        })}
      </div>
    </div>
  );
});
ShadcnCalendar.displayName = "ShadcnCalendar";

// ─── DatePicker ─────────────────────────────────────────────────────────────
export const ShadcnDatePicker = forwardRef<HTMLDivElement, {
  placeholder?: string;
  [key: string]: any;
}>(({ placeholder = "Pick a date", ...rest }, ref) => {
  return (
    <div
      ref={ref}
      className={`w-full max-w-[200px] border border-input bg-background px-3 py-1.5 rounded-md flex items-center gap-2 text-sm text-foreground shadow-sm cursor-pointer hover:bg-accent/40 ${(rest.className as string) || ""}`}
      {...rest}
    >
      <span>📅</span>
      <span className="text-muted-foreground">{placeholder}</span>
    </div>
  );
});
ShadcnDatePicker.displayName = "ShadcnDatePicker";

// ─── InputOTP ───────────────────────────────────────────────────────────────
export const ShadcnInputOTP = forwardRef<HTMLDivElement, {
  [key: string]: any;
}>(({ ...rest }, ref) => {
  return (
    <div ref={ref} className={`flex gap-1.5 ${(rest.className as string) || ""}`} {...rest}>
      {Array.from({ length: 6 }, (_, i) => (
        <div
          key={i}
          className={`w-8 h-10 border border-input rounded-md bg-background flex items-center justify-center text-sm font-semibold text-foreground ${
            i === 2 ? "ring-2 ring-primary border-primary" : ""
          }`}
        >
          {i < 2 ? "1" : i === 2 ? "│" : ""}
        </div>
      ))}
    </div>
  );
});
ShadcnInputOTP.displayName = "ShadcnInputOTP";

// ─── Label ──────────────────────────────────────────────────────────────────
export const ShadcnLabel = forwardRef<HTMLSpanElement, {
  children?: ReactNode;
  [key: string]: any;
}>(({ children, ...rest }, ref) => {
  return (
    <span
      ref={ref}
      className={`text-xs font-semibold text-foreground tracking-wide select-none ${(rest.className as string) || ""}`}
      {...rest}
    >
      {children ?? "Username"}
    </span>
  );
});
ShadcnLabel.displayName = "ShadcnLabel";
