import { atom } from "nanostores";

/** Ask the left sidebar to open a tab (the floating canvas toolbar's "Add" does). `n` makes a repeat request count. */
export const $sidebarTabRequest = atom<{ tab: "components"; n: number } | null>(null);

export const requestSidebarTab = (tab: "components") => {
  $sidebarTabRequest.set({ tab, n: ($sidebarTabRequest.get()?.n ?? 0) + 1 });
};
