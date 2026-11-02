"use client";
// The builder's icons, in one place. Phosphor (MIT licence, @phosphor-icons/react): rounded
// strokes and a bold/duotone weight that match the reference look. Panels ask for an icon by
// name, so changing the pack or one glyph is a one-line change here.
import {
  AppWindow, ArrowLeft, ArrowRight, FolderSimplePlus, PaperPlaneRight, Stop, ArrowUpRight, Bell, CaretDown, CaretRight, Check, CheckSquare, Compass, Copy,
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

export function Icon({ name, size = 20, weight = "regular", color }: { name: IconName; size?: number; weight?: IconWeight; color?: string }) {
  const Glyph = ICONS[name];
  return <Glyph size={size} weight={weight} color={color} aria-hidden="true" style={{ flexShrink: 0 }} />;
}
