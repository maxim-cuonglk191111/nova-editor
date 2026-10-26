"use client";
// Serializes the full atom set → PATCH /api/projects/:id.
// The single save path for the builder (Ctrl+S, Save button, autosave callers).

import { serializeWebstudioData } from "./schema";
import {
  $pages,
  $assets,
  $instances,
  $props,
  $dataSources,
  $resources,
  $breakpoints,
  $styles,
  $styleSources,
  $styleSourceSelections,
} from "./data-stores";
import { $cssVars, $interactions, $customCss } from "./nano-states";
import { $symbols } from "./symbols";
import { captureCurrentProjectThumbnail } from "./thumbnailCapture";
import { $docVersion, $saveStatus, discardQueuedPatches, withFullSaveLock } from "./saveQueue";

/** The server holds a newer version (another tab saved first); Update would overwrite it. */
export class SaveConflictError extends Error {}

/** The session is gone (signed out or expired); the request never reached the project. */
export class AuthRequiredError extends Error {}

/** Throws AuthRequiredError when a project API call was answered by the sign-in wall. */
export function assertSignedIn(res: Response): void {
  if (res.status === 401 || (res.redirected && new URL(res.url).pathname.startsWith("/login"))) {
    throw new AuthRequiredError("Sign-in required");
  }
}

export function saveProject(projectId: string): Promise<void> {
  return withFullSaveLock(() => saveFullDocument(projectId));
}

export function getSerializedProjectSchema() {
  const data = {
    pages: $pages.get()!,
    assets: $assets.get(),
    instances: $instances.get(),
    props: $props.get(),
    dataSources: $dataSources.get(),
    resources: $resources.get(),
    breakpoints: $breakpoints.get(),
    styles: $styles.get(),
    styleSources: $styleSources.get(),
    styleSourceSelections: $styleSourceSelections.get(),
  };
  const serialized = serializeWebstudioData(data);
  let thumbnail: string | undefined = undefined;
  try {
    thumbnail = captureCurrentProjectThumbnail();
  } catch {}
  return {
    schemaVersion: "5.0",
    metadata: {
      thumbnail,
    },
    data: serialized,
    cssVars: $cssVars.get(),
    interactions: $interactions.get(),
    customCss: $customCss.get(),
    symbols: $symbols.get(),
  };
}

async function saveFullDocument(projectId: string): Promise<void> {
  const schema_json = getSerializedProjectSchema();
  const res = await fetch(`/api/projects/${projectId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      baseVersion: $docVersion.get(),
      schema_json,
    }),
  });
  assertSignedIn(res);
  if (res.status === 409) {
    $saveStatus.set("conflict");
    throw new SaveConflictError("Save conflict: project changed elsewhere");
  }
  if (!res.ok) throw new Error(`Save failed: HTTP ${res.status}`);
  const json = (await res.json()) as { version?: number };
  if (typeof json.version === "number") $docVersion.set(json.version);
  // The full document is persisted — queued patches are already included.
  discardQueuedPatches();
  $saveStatus.set("saved");
}
