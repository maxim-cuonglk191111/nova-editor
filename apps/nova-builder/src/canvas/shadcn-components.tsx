// Real shadcn/ui components for the Nova canvas, split by group under ./shadcn/.
// This barrel keeps the import path stable and builds the registration map.
"use client";

import { ShadcnButton, ShadcnInput, ShadcnTextarea, ShadcnCheckbox, ShadcnSwitch, ShadcnRadioGroup, ShadcnSelect, ShadcnCombobox, ShadcnCalendar, ShadcnDatePicker, ShadcnInputOTP, ShadcnLabel } from "./shadcn/inputs";
import { ShadcnSlider, ShadcnToggle, ShadcnToggleGroup, ShadcnTabs, ShadcnBreadcrumb, ShadcnPagination, ShadcnNavigationMenu, ShadcnMenubar, ShadcnContextMenu, ShadcnDropdownMenu } from "./shadcn/navigation";
import { ShadcnSidebar, ShadcnCommand, ShadcnDialog, ShadcnAlertDialog, ShadcnPopover, ShadcnTooltip, ShadcnHoverCard, ShadcnDrawer, ShadcnSheet, ShadcnSonner, ShadcnToast } from "./shadcn/overlay";
import { ShadcnCard, ShadcnSeparator, ShadcnResizable, ShadcnScrollArea, ShadcnAspectRatio, ShadcnCollapsible, ShadcnAccordion, ShadcnCarousel, ShadcnRow, ShadcnCol, ShadcnContainer, ShadcnSection, ShadcnFlexRow, ShadcnSpacer } from "./shadcn/layout";
import { ShadcnAvatar, ShadcnBadge, ShadcnTable, ShadcnSkeleton, ShadcnProgress, ShadcnCode, ShadcnKbd, ShadcnText, ShadcnHeading, ShadcnLink, ShadcnDataTable, ShadcnChart } from "./shadcn/display";
export { shadcnMetas } from "./shadcn/metas";

export const shadcnComponents: Record<string, unknown> = {
  ShadcnButton,
  ShadcnInput,
  ShadcnTextarea,
  ShadcnCheckbox,
  ShadcnSwitch,
  ShadcnRadioGroup,
  ShadcnSelect,
  ShadcnCombobox,
  ShadcnCalendar,
  ShadcnDatePicker,
  ShadcnInputOTP,
  ShadcnLabel,
  ShadcnSlider,
  ShadcnToggle,
  ShadcnToggleGroup,
  ShadcnTabs,
  ShadcnBreadcrumb,
  ShadcnPagination,
  ShadcnNavigationMenu,
  ShadcnMenubar,
  ShadcnContextMenu,
  ShadcnDropdownMenu,
  ShadcnSidebar,
  ShadcnCommand,
  ShadcnDialog,
  ShadcnAlertDialog,
  ShadcnPopover,
  ShadcnTooltip,
  ShadcnHoverCard,
  ShadcnDrawer,
  ShadcnSheet,
  ShadcnSonner,
  ShadcnToast,
  ShadcnCard,
  ShadcnSeparator,
  ShadcnResizable,
  ShadcnScrollArea,
  ShadcnAspectRatio,
  ShadcnCollapsible,
  ShadcnAccordion,
  ShadcnCarousel,
  ShadcnRow,
  ShadcnCol,
  ShadcnContainer,
  ShadcnSection,
  ShadcnFlexRow,
  ShadcnSpacer,
  ShadcnAvatar,
  ShadcnBadge,
  ShadcnTable,
  ShadcnSkeleton,
  ShadcnProgress,
  ShadcnCode,
  ShadcnKbd,
  ShadcnText,
  ShadcnHeading,
  ShadcnLink,
  ShadcnDataTable,
  ShadcnChart,
};

export * from "./shadcn/inputs";
export * from "./shadcn/navigation";
export * from "./shadcn/overlay";
export * from "./shadcn/layout";
export * from "./shadcn/display";
