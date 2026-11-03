"use client";
// The builder's icons, in one place. Phosphor (MIT licence, @phosphor-icons/react): rounded
// strokes and a bold/duotone weight that match the reference look. Panels ask for an icon by
// name, so changing the pack or one glyph is a one-line change here.
import {
  AppWindow, ArrowLeft, ArrowRight, FolderSimplePlus, PaperPlaneRight, Stop,
  ArrowBendLeftUp, BoundingBox, SidebarSimple, Browser, ChartLineUp, EnvelopeSimple, ClipboardText, Command as CommandIcon, ClockCounterClockwise, Crown as CrownIcon, FloppyDisk, Gauge, Package, RocketLaunch, Link as LinkIcon, PersonArmsSpread, Scissors, TextB, TextItalic, TextUnderline, ArrowUpRight, Bell, CaretDown, CaretRight, Check, CheckSquare, Compass, Copy,
  CornersOut, Database, DotsThree, Eye, FilePlus, Files, FolderSimple, GearSix, House, ImageSquare,
  Layout, Lightning, MagnifyingGlass, MagnifyingGlassMinus, MagnifyingGlassPlus, Minus, Palette,
  Pencil, Plus, Rows, Sparkle, SquaresFour, Stack, TextAa, Trash, UploadSimple, X,
  ArrowCounterClockwise, ArrowsClockwise, ArrowUUpLeft, ArrowUUpRight, DownloadSimple, ListBullets,
  type Icon as PhosphorIcon, type IconWeight,
} from "@phosphor-icons/react";

const ICONS = {
  // left rail
  ai: Sparkle,
  add: SquaresFour,
  pages: Files,
  layers: Stack,
  assets: ImageSquare,
  templates: Layout,
  // Add tab categories
  catLayout: Rows,
  catTypography: TextAa,
  catDisplay: Palette,
  catInputs: CheckSquare,
  catNavigation: Compass,
  catFeedback: Bell,
  catOverlay: AppWindow,
  catAdvanced: Lightning,
  // actions and chrome
  back: ArrowLeft,
  site: Browser,
  analytics: ChartLineUp,
  mail: EnvelopeSimple,
  inspector: SidebarSimple,
  paste: ClipboardText,
  wrap: BoundingBox,
  parent: ArrowBendLeftUp,
  command: CommandIcon,
  floppy: FloppyDisk,
  package: Package,
  rocket: RocketLaunch,
  crown: CrownIcon,
  history: ClockCounterClockwise,
  gauge: Gauge,
  accessibility: PersonArmsSpread,
  crop: Scissors,
  bold: TextB,
  italic: TextItalic,
  underline: TextUnderline,
  link: LinkIcon,
  send: PaperPlaneRight,
  stop: Stop,
  arrowRight: ArrowRight,
  copy: Copy,
  trash: Trash,
  settings: GearSix,
  external: ArrowUpRight,
  search: MagnifyingGlass,
  zoomIn: MagnifyingGlassPlus,
  zoomOut: MagnifyingGlassMinus,
  fit: CornersOut,
  plus: Plus,
  minus: Minus,
  close: X,
  check: Check,
  caretDown: CaretDown,
  caretRight: CaretRight,
  more: DotsThree,
  home: House,
  edit: Pencil,
  folder: FolderSimple,
  folderPlus: FolderSimplePlus,
  newPage: FilePlus,
  upload: UploadSimple,
  database: Database,
  eye: Eye,
  undo: ArrowUUpLeft,
  redo: ArrowUUpRight,
  reset: ArrowCounterClockwise,
  replace: ArrowsClockwise,
  download: DownloadSimple,
  list: ListBullets,
} satisfies Record<string, PhosphorIcon>;

export type IconName = keyof typeof ICONS;

/** Registry category → icon of its tile in the Add tab. */
export const CATEGORY_ICON: Record<string, IconName> = {
  Layout: "catLayout", Typography: "catTypography", Display: "catDisplay", Inputs: "catInputs",
  Navigation: "catNavigation", Feedback: "catFeedback", Overlay: "catOverlay", Advanced: "catAdvanced",
};

const TEXT = new Set(["Heading", "Paragraph", "Text", "Span", "Label", "Blockquote", "List", "ListItem", "Link", "RichTextLink"]);
const MEDIA = new Set(["Image", "Video", "Picture", "Avatar", "Icon", "Svg", "Carousel"]);
const FORM = new Set(["Button", "Input", "Textarea", "Select", "Checkbox", "Switch", "RadioGroup", "Form", "Slider", "Toggle", "ToggleGroup", "InputOTP", "Combobox"]);
const NAV = new Set(["Navbar", "NavigationMenu", "Menu", "Tabs", "Breadcrumb", "Pagination", "Sidebar", "Menubar"]);

/** The icon a Layers row shows for a component (the part after "shadcn:" decides). */
export function componentIcon(component: string): IconName {
  const name = component.split(":").pop() ?? component;
  if (TEXT.has(name)) return "catTypography";
  if (MEDIA.has(name)) return "assets";
  if (FORM.has(name)) return "catInputs";
  if (NAV.has(name)) return "catNavigation";
  if (name === "Body" || name === "Box" || name === "Section" || name === "Container" || name === "Card" || name === "Row" || name.startsWith("Row") || name === "Grid" || name === "Flex") return "catLayout";
  return "catDisplay";
}

export function Icon({ name, size = 20, weight = "regular", color }: { name: IconName; size?: number; weight?: IconWeight; color?: string }) {
  const Glyph = ICONS[name];
  return <Glyph size={size} weight={weight} color={color} aria-hidden="true" style={{ flexShrink: 0 }} />;
}
