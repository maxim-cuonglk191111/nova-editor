"use client";
// Command registry (Tier P M1, ADR-NB-019 p1). ONE definition per editor
// command — keyboard shortcuts (useBuilderKeyboard), the ⌘K palette and
// context menus all consume this registry instead of re-declaring handlers.
// Simplified from reference/webstudio apps/builder/app/shared/commands-emitter.ts.
//
// All document mutations run through lib/transactions.updateData — undoable
// and synced to the canvas follower. Labels are i18n keys resolved by the
// consumer via t.commands[labelKey].

import { $instances, $props, $styleSources, $styleSourceSelections, $styles } from "@/lib/data-stores";
import {
  $selectedInstanceId,
  $selectedInstanceSelector,
  $multiSelectedInstanceIds,
  $clipboard,
  $aiPanelOpen,
  $commandPaletteOpen,
  $nestingWarning,
} from "@/lib/nano-states";
import { updateData, replaceMap, undo, redo } from "@/lib/transactions";
import {
  makeInstanceId,
  buildParentMap,
  deleteInstance,
  duplicateInstance,
  pasteInstance,
  deleteMultipleInstances,
  topLevelInstanceIds,
} from "@/lib/edit-operations";
import { copyToClipboard, readClipboard } from "@/lib/clipboard";
import { collectFragment, cloneAttachments, applyAttachments } from "@/lib/fragment-attachments";
import type { I18nCommandsDictionary } from "@/lib/i18n/types";

export type CommandName =
  | "undo"
  | "redo"
  | "copy"
  | "cut"
  | "paste"
  | "duplicate"
  | "delete"
  | "wrapInBox"
  | "openAI"
  | "commandPalette";

export type Command = {
  name: CommandName;
  /** i18n key into t.commands */
  labelKey: keyof I18nCommandsDictionary;
  /** "mod" = Ctrl/Cmd; e.g. "mod+shift+z". Display hint derives from the first. */
  hotkeys: string[];
  /** skip when focus is in an input/contenteditable (destructive/edit commands) */
  disableOnInputLike?: boolean;
  /** hide from the ⌘K palette (e.g. the palette toggle itself) */
  hiddenInPalette?: boolean;
  run: () => void;
};

// ── Handlers (multi-select aware, moved from useBuilderKeyboard/CommandPalette) ──

// Id-based actions shared by shortcuts, the canvas / navigator context menus and the topbar.
// Props and styles travel with the subtree (lib/fragment-attachments).

const currentDocument = () => ({
  instances: $instances.get(),
  props: $props.get(),
  styleSources: $styleSources.get(),
  styleSourceSelections: $styleSourceSelections.get(),
  styles: $styles.get(),
});

export const copyInstance = (instanceId: string) => {
  const data = collectFragment(instanceId, currentDocument());
  $clipboard.set(data);
  // Also write to the system clipboard so paste works across tabs / from HTML.
  void copyToClipboard(data);
};

export const deleteInstanceById = (instanceId: string) => {
  const { updated, deleted, nextSelectedId } = deleteInstance(instanceId, $instances.get());
  if (deleted) {
    updateData(({ instances }) => replaceMap(instances, updated));
    $selectedInstanceSelector.set(nextSelectedId ? [nextSelectedId] : undefined);
  }
};

export const cutInstance = (instanceId: string) => {
  copyInstance(instanceId);
  deleteInstanceById(instanceId);
};

/** Pastes after `targetId` (or into the root when undefined). */
export const pasteClipboard = (clipboard: ReturnType<typeof $clipboard.get>, targetId: string | undefined) => {
  if (!clipboard) return;
  const result = pasteInstance(clipboard, targetId, $instances.get());
  if (result?.violation) {
    $nestingWarning.set(result.violation.message);
    return;
  }
  if (result?.updated) {
    const att = cloneAttachments(clipboard, result.idMap, $styleSources.get());
    updateData((data) => {
      replaceMap(data.instances, result.updated);
      applyAttachments(data, att);
    });
    $selectedInstanceSelector.set([result.newRootId]);
  }
};

export const duplicateInstanceById = (instanceId: string) => {
  const doc = currentDocument();
  const result = duplicateInstance(instanceId, doc.instances);
  if (!result) return undefined;
  const att = cloneAttachments(collectFragment(instanceId, doc), result.idMap, doc.styleSources);
  updateData((data) => {
    replaceMap(data.instances, result.updated);
    applyAttachments(data, att);
  });
  return result.newRootId;
};

const copyCommand = () => {
  const selectedId = $selectedInstanceId.get();
  if (selectedId) copyInstance(selectedId);
};

const cutCommand = () => {
  const selectedId = $selectedInstanceId.get();
  if (selectedId) cutInstance(selectedId);
};

const applyPaste = (clipboard: ReturnType<typeof $clipboard.get>) => pasteClipboard(clipboard, $selectedInstanceId.get());

const pasteCommand = () => {
  // Prefer the system clipboard (cross-tab + HTML/design-tool paste); fall back
  // to the in-memory atom when it is empty or access is denied.
  readClipboard()
    .then((fromSystem) => applyPaste(fromSystem ?? $clipboard.get()))
    .catch(() => applyPaste($clipboard.get()));
};

const duplicateCommand = () => {
  const multiIds = $multiSelectedInstanceIds.get();
  if (multiIds.length > 1) {
    const newRootIds = topLevelInstanceIds(multiIds, $instances.get()).flatMap((id) => duplicateInstanceById(id) ?? []);
    if (newRootIds.length > 0) {
      $multiSelectedInstanceIds.set(newRootIds);
      $selectedInstanceSelector.set([newRootIds[0]]);
    }
    return;
  }
  const selectedId = $selectedInstanceId.get();
  if (!selectedId) return;
  const newRootId = duplicateInstanceById(selectedId);
  if (newRootId) $selectedInstanceSelector.set([newRootId]);
};

const deleteCommand = () => {
  const multiIds = $multiSelectedInstanceIds.get();
  if (multiIds.length > 1) {
    const { updated, deletedCount } = deleteMultipleInstances(multiIds, $instances.get());
    if (deletedCount > 0) {
      updateData(({ instances }) => replaceMap(instances, updated));
      $multiSelectedInstanceIds.set([]);
      $selectedInstanceSelector.set(undefined);
    }
    return;
  }
  const selectedId = $selectedInstanceId.get();
  if (selectedId) deleteInstanceById(selectedId);
};

const wrapInBoxCommand = () => {
  const instanceId = $selectedInstanceId.get();
  if (!instanceId) return;
  const parentId = buildParentMap($instances.get()).get(instanceId);
  if (!parentId) return;
  const boxId = makeInstanceId();
  updateData(({ instances }) => {
    const parent = instances.get(parentId);
    if (!parent) return;
    instances.set(boxId, {
      type: "instance" as const,
      id: boxId,
      component: "Box",
      children: [{ type: "id" as const, value: instanceId }],
    } as Parameters<typeof instances.set>[1]);
    instances.set(parentId, {
      ...parent,
      children: parent.children.map((c) =>
        c.type === "id" && c.value === instanceId ? { type: "id" as const, value: boxId } : c
      ),
    });
  });
  $selectedInstanceSelector.set([boxId]);
};

// ── Registry ──────────────────────────────────────────────────────────────────
// OCP fix: commands is no longer a static export. Use registerCommand() to extend
// and getCommands() to read — callers never mutate the array directly.

const _registry: Command[] = [
  { name: "undo", labelKey: "undo", hotkeys: ["mod+z"], run: undo },
  { name: "redo", labelKey: "redo", hotkeys: ["mod+shift+z", "mod+y"], run: redo },
  { name: "copy", labelKey: "copy", hotkeys: ["mod+c"], disableOnInputLike: true, run: copyCommand },
  { name: "cut", labelKey: "cut", hotkeys: ["mod+x"], disableOnInputLike: true, run: cutCommand },
  { name: "paste", labelKey: "paste", hotkeys: ["mod+v"], disableOnInputLike: true, run: pasteCommand },
  { name: "duplicate", labelKey: "duplicate", hotkeys: ["mod+d"], disableOnInputLike: true, run: duplicateCommand },
  { name: "delete", labelKey: "delete", hotkeys: ["delete", "backspace"], disableOnInputLike: true, run: deleteCommand },
  { name: "wrapInBox", labelKey: "wrapInBox", hotkeys: [], run: wrapInBoxCommand },
  { name: "openAI", labelKey: "openAI", hotkeys: ["mod+shift+a"], run: () => $aiPanelOpen.set(true) },
  {
    name: "commandPalette",
    labelKey: "commandPalette",
    hotkeys: ["mod+k"],
    hiddenInPalette: true,
    run: () => $commandPaletteOpen.set(!$commandPaletteOpen.get()),
  },
];

/** Read the full command list (built-in + any registered extensions). */
export const getCommands = (): readonly Command[] => _registry;

/**
 * Register an additional command at runtime.
 * Returns an unregister function for clean teardown.
 */
export const registerCommand = (cmd: Command): (() => void) => {
  _registry.push(cmd);
  return () => {
    const idx = _registry.indexOf(cmd);
    if (idx !== -1) _registry.splice(idx, 1);
  };
};

/** @deprecated use getCommands() — kept for backwards compat */
export const commands: readonly Command[] = _registry;

export const emitCommand = (name: CommandName) => {
  _registry.find((command) => command.name === name)?.run();
};

// ── Hotkey matching ───────────────────────────────────────────────────────────

const matchesHotkey = (event: KeyboardEvent, hotkey: string): boolean => {
  const parts = hotkey.split("+");
  const key = parts[parts.length - 1];
  const mods = new Set(parts.slice(0, -1));
  const wantMod = mods.has("mod");
  const wantShift = mods.has("shift");
  if (wantMod !== (event.ctrlKey || event.metaKey)) return false;
  if (wantShift !== event.shiftKey) return false;
  return event.key.toLowerCase() === key;
};

/** Returns the command matching a keydown event, or undefined. */
export const matchCommand = (event: KeyboardEvent): Command | undefined => {
  for (const command of commands) {
    if (command.hotkeys.some((hotkey) => matchesHotkey(event, hotkey))) {
      return command;
    }
  }
  return undefined;
};

/** Human-readable hint for the first hotkey ("⌘Z" style). */
export const hotkeyHint = (command: Command): string | undefined => {
  const hotkey = command.hotkeys[0];
  if (!hotkey) return undefined;
  return hotkey
    .split("+")
    .map((part) =>
      part === "mod" ? "⌘" : part === "shift" ? "⇧" : part === "delete" ? "Del" : part.toUpperCase()
    )
    .join("");
};
