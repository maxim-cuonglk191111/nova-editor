"use client";
// Canvas → builder postMessage bridge: selection, shortcuts, text editing,
// context menu, drag/resize/grid commits and asset drops. The canvas iframe is
// a follower (ADR-NB-018); every mutation it asks for is applied here.
import { useEffect, type RefObject } from "react";
import { nanoid } from "nanoid";
import { getRegistry } from "@/builder/left-sidebar/components/ComponentRegistry";
import { SHORTCUT_MESSAGE, type ForwardedShortcut } from "@/canvas/forwardShortcuts";
import { $instances } from "@/lib/data-stores";
import { $selectedInstanceSelector, $canvasZoom, $isDirty, $selectedPage } from "@/lib/nano-states";
import { updateData, replaceMap } from "@/lib/transactions";
import { parseRichHtml } from "@/lib/richText";
import { writeStyle } from "@/lib/styleInspectorWrite";
import type { AnyStyleDecl } from "@/lib/styleValueConversion";
import { applyReparent, buildParentMap, moveToNewParent } from "@/lib/treeMove";
import { deleteInstanceById } from "@/builder/commands";
import { writeGridSpan, writeGridColumnStart } from "@/lib/propWriteHelper";
import { writeGridColumnStyle } from "@/lib/styleWriteHelper";

export type CanvasContextMenuState = { instanceId: string; x: number; y: number };

export function useCanvasMessages({
  enabled,
  iframeRef,
  onContextMenu,
  onTextEditing,
}: {
  enabled: boolean;
  iframeRef: RefObject<HTMLIFrameElement | null>;
  onContextMenu: (menu: CanvasContextMenuState) => void;
  onTextEditing: (instanceId: string | null) => void;
}) {
  useEffect(() => {
    if (!enabled) return;
    const onMessage = (e: MessageEvent) => {
      // Canvas click-to-select: update builder's $selectedInstanceSelector directly.
      if (e.data?.type === "nova:select") {
        const { selector } = e.data as { selector: string[] | undefined };
        $selectedInstanceSelector.set(selector);
        return;
      }
      // Shortcut pressed while focus was inside the canvas iframe — replay it on
      // this window so useBuilderKeyboard / the command registry handle it.
      if (e.data?.type === SHORTCUT_MESSAGE && e.origin === window.location.origin) {
        const { key, code, ctrlKey, metaKey, shiftKey, altKey } = e.data as ForwardedShortcut;
        window.dispatchEvent(new KeyboardEvent("keydown", { key, code, ctrlKey, metaKey, shiftKey, altKey, bubbles: true, cancelable: true }));
        return;
      }
      if (e.data?.type === "nova:editingStart") {
        onTextEditing((e.data as { instanceId: string }).instanceId);
        return;
      }
      if (e.data?.type === "nova:editingEnd") {
        onTextEditing(null);
        return;
      }
      // Context menu: right-click on a canvas instance
      if (e.data?.type === "nova:contextMenu") {
        const { instanceId, clientX, clientY } = e.data as {
          instanceId: string; clientX: number; clientY: number;
        };
        const iframe = iframeRef.current;
        if (!iframe) return;
        const rect = iframe.getBoundingClientRect();
        const zoom = $canvasZoom.get();
        onContextMenu({
          instanceId,
          x: rect.left + clientX * zoom,
          y: rect.top + clientY * zoom,
        });
        return;
      }
      // Drag-reparent (FA-007): move an instance to a new parent/index.
      if (e.data?.type === "nova:reparent") {
        const { draggedId, targetId, position } = e.data as {
          draggedId: string; targetId: string; position: "above" | "below" | "into";
        };
        const instances = $instances.get();
        const draggedInst = instances.get(draggedId);
        const targetInst = instances.get(targetId);
        const parentMap = buildParentMap(instances);
        
        let isMovingToGridRow = false;
        if (position === "into") {
          isMovingToGridRow = targetInst?.component === "HeroUIRow";
        } else {
          const newParentId = parentMap.get(targetId);
          if (newParentId) {
            const newParent = instances.get(newParentId);
            isMovingToGridRow = newParent?.component === "HeroUIRow";
          }
        }

        if (draggedInst?.component === "HeroUICol" && isMovingToGridRow) {
          writeGridColumnStart(draggedId, null);
        }

        const next = applyReparent(instances, draggedId, targetId, position);
        if (next && next !== instances) {
          updateData(({ instances }) => replaceMap(instances, next));
        }
        return;
      }
      // Drag-to-delete: remove instance when dragged out of canvas.
      if (e.data?.type === "nova:deleteInstance") {
        const { instanceId } = e.data as { instanceId: string };
        deleteInstanceById(instanceId);
        return;
      }
      // Resize handles (FA-007): persist width/height to the active breakpoint.
      if (e.data?.type === "nova:resizeCommit") {
        const { instanceId, width, height } = e.data as {
          instanceId: string; width: number | null; height: number | null;
        };
        const writeDim = (property: "width" | "height", px: number) => {
          const decl = { property, breakpointId: "", styleSourceId: "" } as unknown as AnyStyleDecl;
          writeStyle(instanceId, decl, { type: "unit", value: px, unit: "px" });
        };
        if (typeof width === "number") writeDim("width", width);
        if (typeof height === "number") writeDim("height", height);
        return;
      }
      // Grid handles (E/W resizing for grid span).
      if (e.data?.type === "nova:gridSpanCommit") {
        const { instanceId, span } = e.data as { instanceId: string; span: number };
        writeGridSpan(instanceId, span);
        return;
      }
      // Grid handles (Move handles for grid start column).
      if (e.data?.type === "nova:gridMoveCommit") {
        const { instanceId, colStart, targetRowId, index } = e.data as { 
          instanceId: string; colStart: number | null; targetRowId?: string; index?: number;
        };
        writeGridColumnStart(instanceId, colStart);
        
        if (targetRowId && typeof index === "number") {
          const instances = $instances.get();
          const parentMap = buildParentMap(instances);
          const oldParentId = parentMap.get(instanceId);
          if (oldParentId) {
            const next = moveToNewParent(instances, instanceId, oldParentId, targetRowId, index);
            if (next && next !== instances) {
              updateData(({ instances }) => replaceMap(instances, next));
            }
          }
        }
        return;
      }
      // Grid column commit (canvas SelectionOverlay snap-resize + move handle).
      // Writes CSS `grid-column: colStart / span N` via the style engine so it
      // flows through SyncClient and the StyleInspector reflects it immediately.
      if (e.data?.type === "nova:gridColumnCommit") {
        const { instanceId, colStart, span } = e.data as {
          instanceId: string;
          colStart: number;
          span: number;
        };
        writeGridColumnStyle(instanceId, colStart, span);
        $isDirty.set(true);
        return;
      }
      // Reorder child within same parent (row move via move handle).
      if (e.data?.type === "nova:reorderChild") {
        const { parentId, childId, deltaIndex } = e.data as {
          parentId: string;
          childId: string;
          deltaIndex: number;
        };
        const instances = $instances.get();
        const parent = instances.get(parentId);
        if (!parent) return;
        const children = [...parent.children];
        const idx = children.findIndex(
          (c) => c.type === "id" && (c as { type: string; value: string }).value === childId
        );
        if (idx < 0) return;
        const newIdx = Math.max(0, Math.min(children.length - 1, idx + deltaIndex));
        children.splice(newIdx, 0, ...children.splice(idx, 1));
        updateData(({ instances }) => {
          const p = instances.get(parentId);
          if (p) instances.set(parentId, { ...p, children } as Parameters<typeof instances.set>[1]);
        });
        $isDirty.set(true);
        return;
      }
      // Legacy plain-text commit (still used as fallback)
      if (e.data?.type === "nova:textCommit") {
        const { instanceId, value, html } = e.data as { instanceId: string; value: string; html?: string };
        updateData(({ instances }) => {
          const inst = instances.get(instanceId);
          if (!inst) return;
          // Parse rich HTML if present; fall back to plain text.
          const newChildren = html ? parseRichHtml(html, instances) : [{ type: "text" as const, value }];
          instances.set(instanceId, { ...inst, children: newChildren } as Parameters<typeof instances.set>[1]);
        });
        onTextEditing(null);
        return;
      }
      // Lexical rich-text commit (M6) — carries full Instance[] tree.
      if (e.data?.type === "nova:textCommitLexical") {
        const { instanceId, instances: lexicalInstances } = e.data as {
          instanceId: string;
          instances: Array<{ id: string; component: string; tag?: string; children: unknown[] }>;
        };
        updateData(({ instances }) => {
          const rootInst = instances.get(instanceId);
          if (!rootInst || !Array.isArray(lexicalInstances)) return;
          for (const lexInst of lexicalInstances) {
            const existing = instances.get(lexInst.id);
            instances.set(lexInst.id, {
              ...(existing ?? { type: "instance" }),
              ...lexInst,
              // Preserve existing component/tag if not overridden
              component: existing?.component ?? lexInst.component,
            } as Parameters<typeof instances.set>[1]);
          }
        });
        onTextEditing(null);
        return;
      }
      // ── Asset image drag-and-drop commit (from canvas drop handler) ────────────
      // Canvas sends this after a native HTML5 drop of a "nova/asset-image" payload.
      // Two actions:
      //   "updateSrc" — dropped onto existing Image; just set the src prop.
      //   "insertImage" — dropped on container/empty; create new Image instance + props.
      if (e.data?.type === "nova:assetImageCommit") {
        const msg = e.data as {
          action: "updateSrc" | "insertImage";
          instanceId?: string;          // for updateSrc
          targetInstanceId?: string;    // for insertImage (parent or sibling)
          position?: "into" | "above" | "below"; // for insertImage
          assetId: string;
          url: string;
          name: string;
        };

        if (msg.action === "updateSrc" && msg.instanceId) {
          // Atomically update src prop of the existing Image instance.
          updateData(({ props }) => {
            // Find existing src prop(s) and consolidate to avoid duplicates
            const matching: string[] = [];
            for (const p of (props as Map<string, { instanceId: string; name: string }>).values()) {
              if (p.instanceId === msg.instanceId && p.name === "src") matching.push((p as any).id);
            }
            const srcPropId = matching[0] ?? `${msg.instanceId}:src`;
            for (let i = 1; i < matching.length; i++) props.delete(matching[i]);
            props.set(srcPropId, {
              id: srcPropId,
              instanceId: msg.instanceId!,
              name: "src",
              type: "string" as const,
              value: msg.url,
            } as Parameters<typeof props.set>[1]);
          });
          $selectedInstanceSelector.set([msg.instanceId]);
        } else if (msg.action === "insertImage") {
          const instances = $instances.get();
          const activePage = $selectedPage.get(); // the open page, not always home
          if (!activePage) return;

          // Resolve parent + insertIdx from targetInstanceId + position.
          let parentId: string | null = msg.targetInstanceId ?? null;
          let insertIdx: number | null = null;

          if (msg.targetInstanceId && msg.position && msg.position !== "into") {
            // "above" or "below": targetInstanceId is the sibling
            for (const [id, inst] of instances.entries()) {
              const childIdx = inst.children.findIndex(
                (c) => c.type === "id" && c.value === msg.targetInstanceId
              );
              if (childIdx !== -1) {
                parentId = id;
                insertIdx = msg.position === "above" ? childIdx : childIdx + 1;
                break;
              }
            }
          }

          if (!parentId) parentId = activePage.rootInstanceId;
          if (parentId && insertIdx === null) {
            insertIdx = instances.get(parentId)?.children.length ?? 0;
          }

          const newId = nanoid();
          // Use the same registry-based creation used by the component panel.
          const regEntry = getRegistry().find((r) => r.id === "Image");
          const creationResult = regEntry
            ? regEntry.createInstance(newId)
            : {
                instance: {
                  type: "instance" as const,
                  id: newId,
                  component: "Image",
                  label: "Image", // i18n-ignore — instance label (user content)
                  children: [],
                },
              };

          updateData(({ instances: draft, props }) => {
            // 1. Register new instance
            draft.set(newId, creationResult.instance as Parameters<typeof draft.set>[1]);

            // 2. Register any child instances (unlikely for Image but defensive)
            creationResult.childInstances?.forEach((child) => {
              draft.set(child.id, child as Parameters<typeof draft.set>[1]);
            });

            // 3. Write default props from registry (width, height, alt etc.)
            if (creationResult.props) {
              Object.entries(creationResult.props).forEach(([propId, propVal]) => {
                props.set(propId, propVal as Parameters<typeof props.set>[1]);
              });
            }

            // 4. Override src with the actual asset URL (and record assetId)
            // Find the src prop created by the registry to avoid creating a duplicate
            let srcPropId: string | undefined;
            for (const p of (props as Map<string, { instanceId: string; name: string }>).values()) {
              if (p.instanceId === newId && p.name === "src") { srcPropId = (p as any).id; break; }
            }
            if (!srcPropId) srcPropId = `${newId}:src`;
            props.set(srcPropId, {
              id: srcPropId,
              instanceId: newId,
              name: "src",
              type: "string" as const,
              value: msg.url,
            } as Parameters<typeof props.set>[1]);

            // 5. Set alt to asset name if not already set
            const altPropId = `${newId}:alt`;
            if (!props.has(altPropId)) {
              props.set(altPropId, {
                id: altPropId,
                instanceId: newId,
                name: "alt",
                type: "string" as const,
                value: msg.name,
              } as Parameters<typeof props.set>[1]);
            }

            // 6. Link asset by storing assetId as a separate prop (mirrors $webstudio$canvasOnly$assetId)
            const assetPropId = `${newId}:$webstudio$canvasOnly$assetId`;
            props.set(assetPropId, {
              id: assetPropId,
              instanceId: newId,
              name: "$webstudio$canvasOnly$assetId",
              type: "string" as const,
              value: msg.assetId,
            } as Parameters<typeof props.set>[1]);

            // 7. Attach new instance to parent at the resolved index
            const parent = draft.get(parentId!);
            if (parent) {
              const newChildren = [...parent.children];
              newChildren.splice(insertIdx!, 0, { type: "id" as const, value: newId });
              draft.set(parentId!, { ...parent, children: newChildren } as Parameters<typeof draft.set>[1]);
            }
          });

          // Auto-select the new instance
          $selectedInstanceSelector.set([newId]);
        }
        return;
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [enabled, iframeRef, onContextMenu, onTextEditing]);
}
