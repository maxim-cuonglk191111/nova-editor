// Display names of components (Add panel, Layers, command palette). Keyed by component id;
// ids missing here fall back to the registry name, or the id without the "shadcn:" prefix.
export const enComponentNames: Record<string, string> = {
  Body: "Page",
  "shadcn:Row": "Row (Grid)",
  "shadcn:Col": "Column",
  "shadcn:Row2Cols": "2 Columns Row",
  "shadcn:Row3Cols": "3 Columns Row",
  "shadcn:Row4Cols": "4 Columns Row",
  "shadcn:FlexRow": "Flex Row",
  "shadcn:DataTable": "Data Table",
  "shadcn:RadioGroup": "Radio Group",
  "shadcn:DatePicker": "Date Picker",
  "shadcn:InputOTP": "Input OTP",
  "shadcn:ToggleGroup": "Toggle Group",
  "shadcn:ScrollArea": "Scroll Area",
  "shadcn:AspectRatio": "Aspect Ratio",
  "shadcn:NavigationMenu": "Navigation Menu",
  "shadcn:ContextMenu": "Context Menu",
  "shadcn:DropdownMenu": "Dropdown Menu",
  "shadcn:AlertDialog": "Alert Dialog",
  "shadcn:HoverCard": "Hover Card",
};
