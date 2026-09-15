import { useState, type DragEvent } from "react";

import type { FileSection } from "@/components/features/files/file-tree";
import {
  extractAsset,
  extractNode,
  findFolder,
  folderContains,
  insertAsset,
  insertNode,
} from "@/components/features/files/file-tree-ops";
import type { FileNode } from "@/entities/files";

const FILE_MOVE_TYPE = "application/x-imagine-file-move";

export interface FileMoveDest {
  sectionId: string;
  folderId?: string;
}

/** Browsers hide custom MIME types during dragover; this is the live payload. */
let movingId: string | null = null;

function beginFileMove(event: DragEvent<HTMLElement>, id: string) {
  movingId = id;
  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData(FILE_MOVE_TYPE, id);
  event.dataTransfer.setData("text/plain", id);
}

function endFileMove() {
  movingId = null;
}

function fileMoveId(): string | null {
  return movingId;
}

function isFileMove(types: readonly string[]): boolean {
  return movingId !== null || types.includes(FILE_MOVE_TYPE);
}

function itemHome(
  sections: readonly FileSection[],
  itemId: string,
): FileMoveDest | undefined {
  const walk = (
    nodes: readonly FileNode[],
    sectionId: string,
    folderId?: string,
  ): FileMoveDest | undefined => {
    for (const node of nodes) {
      if (node.id === itemId) {
        return { sectionId, ...(folderId === undefined ? {} : { folderId }) };
      }
      if (node.type === "folder") {
        const nested = walk(node.children, sectionId, node.id);
        if (nested !== undefined) return nested;
      } else if (node.type === "assets") {
        if (node.assets.some((asset) => asset.id === itemId)) {
          return { sectionId, ...(folderId === undefined ? {} : { folderId }) };
        }
      }
    }
    return undefined;
  };
  for (const section of sections) {
    const found = walk(section.nodes, section.id);
    if (found !== undefined) return found;
  }
  return undefined;
}

function samePlace(a: FileMoveDest, b: FileMoveDest): boolean {
  return a.sectionId === b.sectionId && a.folderId === b.folderId;
}

function canMoveLibraryItem(
  sections: readonly FileSection[],
  itemId: string,
  dest: FileMoveDest,
): boolean {
  return moveLibraryItem(sections, itemId, dest) !== null;
}

/** Take a file, folder, or asset out of one folder and put it in another. */
export function moveLibraryItem(
  sections: readonly FileSection[],
  itemId: string,
  dest: FileMoveDest,
): { sections: FileSection[]; name: string; destName: string } | null {
  const from = itemHome(sections, itemId);
  if (from === undefined || samePlace(from, dest)) return null;
  if (dest.folderId === itemId) return null;

  const source = sections.find((section) => section.id === from.sectionId);
  const destination = sections.find((section) => section.id === dest.sectionId);
  if (source === undefined || destination === undefined) return null;

  const draggedFolder = findFolder(source.nodes, itemId);
  if (
    draggedFolder !== undefined &&
    dest.folderId !== undefined &&
    folderContains(draggedFolder, dest.folderId)
  ) {
    return null;
  }

  const destName =
    dest.folderId === undefined
      ? destination.title
      : (findFolder(destination.nodes, dest.folderId)?.name ??
        destination.title);

  /** `emptied` is the source library without the item; `put` adds it back. */
  const finish = (
    emptied: FileNode[],
    name: string,
    put: (nodes: readonly FileNode[]) => FileNode[],
  ) => {
    // Same library: the item goes back into the already-emptied tree.
    const filled = put(
      dest.sectionId === from.sectionId ? emptied : destination.nodes,
    );
    const next = sections.map((section) => {
      if (section.id === dest.sectionId) return { ...section, nodes: filled };
      if (section.id === from.sectionId) return { ...section, nodes: emptied };
      return section;
    });
    return { sections: next, name, destName };
  };

  // Take the item out of its library: a node first, else an asset.
  const nodeTake = extractNode(source.nodes, itemId);
  const movedNode = nodeTake.taken;
  if (movedNode !== undefined) {
    return finish(nodeTake.nodes, movedNode.name, (nodes) =>
      insertNode(nodes, dest.folderId, movedNode),
    );
  }
  const assetTake = extractAsset(source.nodes, itemId);
  const movedAsset = assetTake.taken;
  if (movedAsset === undefined) return null;
  return finish(assetTake.nodes, movedAsset.caption ?? "Untitled", (nodes) =>
    insertAsset(nodes, dest.folderId, movedAsset),
  );
}

function preventFileMove(event: DragEvent<HTMLElement>) {
  if (!isFileMove(Array.from(event.dataTransfer.types))) return false;
  event.preventDefault();
  event.dataTransfer.dropEffect = "move";
  return true;
}

function isLeavingDropTarget(event: DragEvent<HTMLElement>): boolean {
  const next = event.relatedTarget;
  return !(next instanceof Node && event.currentTarget.contains(next));
}

export interface FileMoveTargets {
  /** The item in flight, so its source can fade. */
  draggingId: string | null;
  /** Which target is lit; the caller names them. */
  dropKey: string | null;
  start: (id: string, event: DragEvent<HTMLElement>) => void;
  end: () => void;
  over: (
    dest: FileMoveDest,
    key: string,
    event: DragEvent<HTMLElement>,
  ) => void;
  leave: (key: string, event: DragEvent<HTMLElement>) => void;
  drop: (dest: FileMoveDest, event: DragEvent<HTMLElement>) => void;
}

/**
 * Dragging a file, folder, or image onto a library or folder. Holds what is
 * in flight and which target is lit; `onMove` is what actually moves it.
 */
export function useFileMoveTargets(
  sections: readonly FileSection[],
  onMove: (id: string, dest: FileMoveDest) => void,
): FileMoveTargets {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropKey, setDropKey] = useState<string | null>(null);

  return {
    draggingId,
    dropKey,
    start: (id, event) => {
      beginFileMove(event, id);
      setDraggingId(id);
    },
    end: () => {
      endFileMove();
      setDraggingId(null);
      setDropKey(null);
    },
    over: (dest, key, event) => {
      const id = fileMoveId();
      if (id === null || !isFileMove(Array.from(event.dataTransfer.types))) {
        return;
      }
      if (!canMoveLibraryItem(sections, id, dest)) {
        event.dataTransfer.dropEffect = "none";
        return;
      }
      preventFileMove(event);
      setDropKey(key);
    },
    leave: (key, event) => {
      if (!isFileMove(Array.from(event.dataTransfer.types))) return;
      if (!isLeavingDropTarget(event)) return;
      setDropKey((current) => (current === key ? null : current));
    },
    drop: (dest, event) => {
      const id = fileMoveId();
      // `dragleave` never fires after a drop, so the highlight has to go
      // whether or not the move turns out to be allowed.
      setDraggingId(null);
      setDropKey(null);
      if (id === null) return;
      event.preventDefault();
      onMove(id, dest);
    },
  };
}
