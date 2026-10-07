import { validateImportedProject } from "./validator";
import { deserializeProject } from "./deserializer";
import { showToast } from "@/lib/nano-states";
import { getActiveDictionary } from "@/lib/i18n/dictionaries";

export function importProject(fileContent: string): boolean {
  try {
    const validation = validateImportedProject(fileContent);
    if (!validation.valid || !validation.project) {
      showToast(validation.error || getActiveDictionary().chrome.toastImportFailed, "error");
      return false;
    }

    deserializeProject(validation.project.project);
    showToast(getActiveDictionary().chrome.toastImported, "success");
    return true;
  } catch (err) {
    console.error("Failed to import project:", err);
    showToast(getActiveDictionary().chrome.toastImportFailed, "error");
    return false;
  }
}
