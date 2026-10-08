import { registerComponent, defaultBuilder } from "../registryCore";

// ── INPUTS ──────────────────────────────────────────────────────────────────

registerComponent({
  id: "shadcn:Button",
  displayName: "Button",
  category: "Inputs",
  keywords: ["button", "save", "click", "trigger", "action", "primary"],
  description: "Primary action button.",
  preview: () => (
    <button className="px-4 py-2 bg-primary text-primary-foreground font-semibold text-xs rounded-md shadow hover:bg-primary/95 transition-all">
      Save
    </button>
  ),
  createInstance: (id) => defaultBuilder(id, "shadcn:Button", "Button", ["Click me"]),
});

registerComponent({
  id: "shadcn:Input",
  displayName: "Input",
  category: "Inputs",
  keywords: ["input", "text", "field", "search", "write", "collect"],
  description: "Text input field.",
  preview: () => (
    <div className="w-[180px] flex items-center border border-border bg-background rounded-md px-3 py-1.5 shadow-sm">
      <span className="text-[10px] text-muted-foreground mr-1.5 select-none">🔍</span>
      <input
        type="text"
        placeholder="Search..."
        className="w-full bg-transparent outline-none text-xs text-foreground placeholder:text-muted-foreground/70"
        readOnly
      />
    </div>
  ),
  createInstance: (id) => defaultBuilder(id, "shadcn:Input", "Input"),
});

registerComponent({
  id: "shadcn:Textarea",
  displayName: "Textarea",
  category: "Inputs",
  keywords: ["textarea", "input", "multiline", "long text", "comment", "field"],
  description: "Multi-line text input field.",
  preview: () => (
    <div className="w-[180px] border border-border bg-background rounded-md px-3 py-1.5 shadow-sm">
      <textarea
        placeholder="Type your message..."
        className="w-full h-10 bg-transparent outline-none text-xs text-foreground placeholder:text-muted-foreground/70 resize-none"
        readOnly
      />
    </div>
  ),
  createInstance: (id) => defaultBuilder(id, "shadcn:Textarea", "Textarea"),
});

registerComponent({
  id: "shadcn:Checkbox",
  displayName: "Checkbox",
  category: "Inputs",
  keywords: ["checkbox", "check", "toggle", "accept", "terms", "tick"],
  description: "Accept conditions or select items.",
  preview: () => (
    <div className="flex items-center gap-2">
      <div className="w-3.5 h-3.5 rounded border border-primary bg-primary text-primary-foreground flex items-center justify-center text-[8px] font-bold">
        ✓
      </div>
      <span className="text-xs text-foreground font-medium">Accept terms</span>
    </div>
  ),
  createInstance: (id) => defaultBuilder(id, "shadcn:Checkbox", "Checkbox", ["Accept terms"]),
});

registerComponent({
  id: "shadcn:Switch",
  displayName: "Switch",
  category: "Inputs",
  keywords: ["switch", "toggle", "on", "off", "active"],
  description: "Toggle switch slider.",
  preview: () => (
    <div className="flex items-center gap-2">
      <div className="w-8 h-4 rounded-full bg-primary relative p-0.5 transition-colors cursor-pointer">
        <div className="w-3 h-3 rounded-full bg-background absolute right-0.5 top-0.5 shadow-sm" />
      </div>
      <span className="text-xs text-foreground font-medium">Toggle</span>
    </div>
  ),
  createInstance: (id) => defaultBuilder(id, "shadcn:Switch", "Switch", ["Toggle switch"]),
});

registerComponent({
  id: "shadcn:RadioGroup",
  displayName: "Radio Group",
  category: "Inputs",
  keywords: ["radio", "group", "select", "options", "choose"],
  description: "Single option selector list.",
  preview: () => (
    <div className="flex flex-col gap-1.5 text-xs text-foreground">
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full border border-primary flex items-center justify-center">
          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
        </div>
        <span>Option A</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full border border-border" />
        <span>Option B</span>
      </div>
    </div>
  ),
  createInstance: (id) => defaultBuilder(id, "shadcn:RadioGroup", "RadioGroup"),
});

registerComponent({
  id: "shadcn:Select",
  displayName: "Select",
  category: "Inputs",
  keywords: ["select", "dropdown", "picker", "choose", "menu", "option"],
  description: "Trigger dropdown select option.",
  preview: () => (
    <div className="w-[185px] border border-border bg-background px-3 py-1.5 rounded-md flex justify-between items-center text-xs text-foreground shadow-sm">
      <span>Select theme</span>
      <span className="text-[8px] text-muted-foreground">▼</span>
    </div>
  ),
  createInstance: (id) => defaultBuilder(id, "shadcn:Select", "Select"),
});

registerComponent({
  id: "shadcn:Combobox",
  displayName: "Combobox",
  category: "Inputs",
  keywords: ["combobox", "autocomplete", "search", "select", "dropdown"],
  description: "Searchable dropdown autocomplete box.",
  preview: () => (
    <div className="w-[185px] border border-border bg-background px-3 py-1.5 rounded-md flex justify-between items-center text-xs text-foreground shadow-sm">
      <span className="text-muted-foreground/80">Select language...</span>
      <span className="text-[9px] text-muted-foreground">↕</span>
    </div>
  ),
  createInstance: (id) => defaultBuilder(id, "shadcn:Combobox", "Combobox"),
});

registerComponent({
  id: "shadcn:Calendar",
  displayName: "Calendar",
  category: "Inputs",
  keywords: ["calendar", "date", "month", "picker", "schedule"],
  description: "Month date selector view.",
  preview: () => (
    <div className="border border-border p-2 bg-background rounded-md text-[8px] w-[140px] text-foreground shadow-sm">
      <div className="flex justify-between items-center mb-1 font-semibold border-b border-border pb-1">
        <span>◀</span>
        <span>October 2026</span>
        <span>▶</span>
      </div>
      <div className="grid grid-cols-7 gap-0.5 text-center text-muted-foreground font-medium mb-1">
        <span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span>
      </div>
      <div className="grid grid-cols-7 gap-0.5 text-center">
        {Array.from({ length: 31 }, (_, i) => {
          const day = i + 1;
          const isSelected = day === 15;
          return (
            <span
              key={day}
              className={`p-0.5 rounded-sm ${
                isSelected ? "bg-primary text-primary-foreground font-bold" : "hover:bg-accent"
              }`}
            >
              {day}
            </span>
          );
        })}
      </div>
    </div>
  ),
  createInstance: (id) => defaultBuilder(id, "shadcn:Calendar", "Calendar"),
});

registerComponent({
  id: "shadcn:DatePicker",
  displayName: "Date Picker",
  category: "Inputs",
  keywords: ["date", "picker", "calendar", "time", "input"],
  description: "Trigger calendar selection input.",
  preview: () => (
    <div className="w-[185px] border border-border bg-background px-3 py-1.5 rounded-md flex justify-between items-center text-xs text-foreground shadow-sm">
      <div className="flex items-center gap-1.5">
        <span>📅</span>
        <span className="text-muted-foreground/80">Pick a date</span>
      </div>
    </div>
  ),
  createInstance: (id) => defaultBuilder(id, "shadcn:DatePicker", "DatePicker"),
});

registerComponent({
  id: "shadcn:InputOTP",
  displayName: "Input OTP",
  category: "Inputs",
  keywords: ["otp", "pin", "code", "digits", "verification", "input"],
  description: "One-Time Password grid inputs.",
  preview: () => (
    <div className="flex gap-1">
      {Array.from({ length: 6 }, (_, i) => (
        <div
          key={i}
          className={`w-6 h-8 border rounded-md bg-background flex items-center justify-center text-xs font-bold text-foreground ${
            i === 2 ? "border-primary ring-1 ring-primary" : "border-border"
          }`}
        >
          {i < 2 ? "9" : i === 2 ? "│" : ""}
        </div>
      ))}
    </div>
  ),
  createInstance: (id) => defaultBuilder(id, "shadcn:InputOTP", "InputOTP"),
});

registerComponent({
  id: "shadcn:Label",
  displayName: "Label",
  category: "Inputs",
  keywords: ["label", "text", "form", "title", "caption"],
  description: "Styled label element.",
  preview: () => <span className="text-xs font-semibold text-foreground tracking-wide">Username</span>,
  createInstance: (id) => defaultBuilder(id, "shadcn:Label", "Label", ["Username"]),
});

registerComponent({
  id: "shadcn:Slider",
  displayName: "Slider",
  category: "Inputs",
  keywords: ["slider", "range", "volume", "track", "control"],
  description: "Adjust value on track axis.",
  preview: () => (
    <div className="w-[180px] h-4 flex items-center relative select-none">
      <div className="w-full h-1 bg-secondary rounded-full">
        <div className="w-[70%] h-full bg-primary rounded-full relative">
          <div className="w-3 h-3 rounded-full bg-background border border-primary absolute right-0 -top-1 shadow-sm" />
        </div>
      </div>
    </div>
  ),
  createInstance: (id) => defaultBuilder(id, "shadcn:Slider", "Slider"),
});

registerComponent({
  id: "shadcn:Toggle",
  displayName: "Toggle",
  category: "Inputs",
  keywords: ["toggle", "button", "press", "active", "switch"],
  description: "Two-state action toggle button.",
  preview: () => (
    <button className="p-2 border border-border bg-accent text-accent-foreground rounded-md text-xs font-semibold shadow-sm">
      ⭐ Star
    </button>
  ),
  createInstance: (id) => defaultBuilder(id, "shadcn:Toggle", "Toggle", ["⭐ Star"]),
});

registerComponent({
  id: "shadcn:ToggleGroup",
  displayName: "Toggle Group",
  category: "Inputs",
  keywords: ["toggle", "group", "row", "buttons", "actions"],
  description: "Row of action toggle buttons.",
  preview: () => (
    <div className="flex border border-border rounded-md overflow-hidden bg-background divide-x divide-border shadow-sm">
      <button className="px-3 py-1.5 text-xs font-bold bg-accent text-accent-foreground">B</button>
      <button className="px-3 py-1.5 text-xs italic text-foreground hover:bg-accent/40">I</button>
      <button className="px-3 py-1.5 text-xs underline text-foreground hover:bg-accent/40">U</button>
    </div>
  ),
  createInstance: (id) => defaultBuilder(id, "shadcn:ToggleGroup", "ToggleGroup"),
});
