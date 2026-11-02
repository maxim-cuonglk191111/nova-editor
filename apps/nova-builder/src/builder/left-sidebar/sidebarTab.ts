import { atom } from "nanostores";

/** Ask the left sidebar to open a tab (the floating canvas toolbar's "Add" does). `n` makes a repeat request count. */
export const $sidebarTabRequest = atom<{ tab: "components"; n: number } | null>(null);

export const requestSidebarTab = (tab: "components") => {
  $sidebarTabRequest.set({ tab, n: ($sidebarTabRequest.get()?.n ?? 0) + 1 });
};

/** The Add tab's second column (thumbnails of one category). The sidebar widens by FLYOUT_WIDTH while it is open. */
export const FLYOUT_WIDTH = 288;
export const $addFlyoutOpen = atom(false);
/** Selected category of the Add tab; undefined until the tab is opened the first time. */
export const $addCategory = atom<string | null | undefined>(undefined);
