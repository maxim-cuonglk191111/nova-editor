import { validateImportedProject } from "./validator";
import { deserializeProject } from "./deserializer";
import { showToast, $isDirty } from "@/lib/nano-states";
import { $projectMeta } from "@/lib/data-stores";
import { saveProject } from "@/lib/saveProject";
import { getActiveDictionary } from "@/lib/i18n/dictionaries";

export function importProject(fileContent: string): boolean {
  try {
    const validation = validateImportedProject(fileContent);
    if (!validation.valid || !validation.project) {
      showToast(validation.error || getActiveDictionary().chrome.toastImportFailed, "error");
      return false;
    }

    deserializeProject(validation.project.project);
    // The import replaces the stores outside immerhin transactions, so the patch
    // autosave never sees it — save the whole document right away.
    const id = $projectMeta.get()?.id;
    if (id && id !== "demo") {
      saveProject(id)
        .then(() => { $isDirty.set(false); showToast(getActiveDictionary().chrome.toastImported, "success"); })
        .catch(() => showToast(getActiveDictionary().chrome.toastUpdateFailed, "error"));
    } else {
      showToast(getActiveDictionary().chrome.toastImported, "success");
    }
    return true;
  } catch (err) {
    console.error("Failed to import project:", err);
    showToast(getActiveDictionary().chrome.toastImportFailed, "error");
    return false;
  }
}
