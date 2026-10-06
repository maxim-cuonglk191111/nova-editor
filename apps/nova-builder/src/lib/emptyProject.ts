// Returns a serialized NovaProjectJson (schemaVersion "5.0") representing an empty project.
// Used when creating a new project — seeded with one page, one Body instance, and
// Webstudio's default desktop-first breakpoints (Base + Tablet + two Mobile sizes)
// so responsive editing works out of the box.

import { uid } from "./uid";

export function emptyProjectSchema(name: string, now: string): Record<string, unknown> {
  const pageId = uid("page_");
  const folderId = uid("fold_");
  const rootInstanceId = uid("inst_");
  const breakpoints = [
    { id: uid("bp_"), label: "Base" },
    { id: uid("bp_"), label: "Tablet", maxWidth: 991 },
    { id: uid("bp_"), label: "Mobile landscape", maxWidth: 767 },
    { id: uid("bp_"), label: "Mobile portrait", maxWidth: 479 },
  ];

  return {
    schemaVersion: "5.0",
    meta: { name, createdAt: now, updatedAt: now },
    data: {
      pages: {
        homePageId: pageId,
        rootFolderId: folderId,
        pages: [
          [pageId, { id: pageId, name: "Home", path: "/", title: "Home", rootInstanceId }],
        ],
        folders: [
          [folderId, { id: folderId, name: "Root", slug: "", children: [pageId] }],
        ],
      },
      instances: [
        [rootInstanceId, { type: "instance", id: rootInstanceId, component: "Body", label: "Body", children: [] }],
      ],
      props: [],
      styles: [],
      styleSources: [],
      styleSourceSelections: [],
      breakpoints: breakpoints.map((bp) => [bp.id, bp]),
      assets: [],
      dataSources: [],
      resources: [],
    },
  };
}
