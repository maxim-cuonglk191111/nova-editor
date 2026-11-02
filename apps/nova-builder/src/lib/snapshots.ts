// Restore points of a saved project (`project_snapshots`), shared by the History panel and the AI tab.
import { $isDirty } from "@/lib/nano-states";
import { $docVersion, discardQueuedPatches, flushPendingSave, withFullSaveLock } from "@/lib/saveQueue";

const SNAPSHOT_TIMEOUT_MS = 4000;

/**
 * Saves a restore point of the project as it is now, after the queued edits have landed. Resolves
 * to the snapshot id, or null when it could not be made (an unsaved project, a guest, offline):
 * the caller carries on without a restore point.
 */
export async function takeSnapshot(projectId: string, label: string): Promise<string | null> {
  const attempt = async (): Promise<string | null> => {
    await flushPendingSave();
    const res = await withFullSaveLock(() => fetch(`/api/projects/${projectId}/snapshots`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label }),
    }));
    if (!res.ok) return null;
    const json = (await res.json()) as { snapshot?: { id?: string } };
    return json.snapshot?.id ?? null;
  };
  try {
    return await Promise.race([attempt(), new Promise<null>((resolve) => setTimeout(() => resolve(null), SNAPSHOT_TIMEOUT_MS))]);
  } catch {
    return null;
  }
}

/**
 * Puts a snapshot back as the project. The caller reloads the page afterwards so the editor shows
 * it (the in-memory edits it replaced must not be autosaved back).
 */
export async function restoreSnapshot(projectId: string, snapshotId: string): Promise<boolean> {
  // An autosave still in flight must land before the restore, not on top of it.
  const res = await withFullSaveLock(() => fetch(`/api/projects/${projectId}/snapshots/${snapshotId}/restore`, { method: "POST" }));
  if (!res.ok) return false;
  const { version } = (await res.json()) as { version?: number };
  discardQueuedPatches();
  if (typeof version === "number") $docVersion.set(version);
  $isDirty.set(false);
  return true;
}
