// Creating a page outside React (the AI site generator and the Pages panel share it).
// One updateData transaction: the page, its empty root Box and its folder entry undo together.
import type { Page } from "@webstudio-is/sdk";
import { updateData } from "./transactions";
import { uid } from "./uid";

/** Adds a page at `path`; returns its id, or null when another page already owns the path. */
export function createPageRecord(name: string, path: string): string | null {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const pageId = uid("page_");
  const rootInstId = uid("inst_");
  let created = false;

  updateData(({ pages, instances }) => {
    if (Array.from(pages.pages.values()).some((p) => p.path === normalizedPath)) return;

    instances.set(rootInstId, {
      type: "instance" as const,
      id: rootInstId,
      component: "Box",
      children: [],
    } as Parameters<typeof instances.set>[1]);

    pages.pages.set(pageId, {
      id: pageId,
      name,
      title: name,
      path: normalizedPath,
      rootInstanceId: rootInstId,
      meta: {},
    } as Page);

    if (pages.rootFolderId) {
      const rootFolder = pages.folders.get(pages.rootFolderId);
      if (rootFolder) rootFolder.children = [...(rootFolder.children ?? []), pageId];
    }
    created = true;
  });

  return created ? pageId : null;
}
