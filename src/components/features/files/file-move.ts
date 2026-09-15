import type { DragEvent } from "react";

import type { AssetTileData } from "@/components/features/files/asset-tile";
import type {
  FileNode,
  FileSection,
} from "@/components/features/files/file-tree";

export const FILE_MOVE_TYPE = "application/x-imagine-file-move";

export interface FileMoveDest {
  sectionId: string;
  folderId?: string;
}

type FolderNode = Extract<FileNode, { type: "folder" }>;

/** Browsers hide custom MIME types during dragover; this is the live payload. */
let movingId: string | null = null;

export function beginFileMove(event: DragEvent<HTMLElement>, id: string) {
  movingId = id;
  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData(FILE_MOVE_TYPE, id);
  event.dataTransfer.setData("text/plain", id);
}

export function endFileMove() {
  movingId = null;
}

export function fileMoveId(): string | null {
  return movingId;
}

export function isFileMove(types: readonly string[]): boolean {
  return movingId !== null || types.includes(FILE_MOVE_TYPE);
}

export function findFolder(
  nodes: readonly FileNode[],
  id: string,
): FolderNode | undefined {
  for (const node of nodes) {
    if (node.type !== "folder") continue;
    if (node.id === id) return node;
    const nested = findFolder(node.children, id);
    if (nested !== undefined) return nested;
  }
  return undefined;
}

function folderContains(folder: FolderNode, id: string): boolean {
  for (const child of folder.children) {
    if (child.id === id) return true;
    if (child.type === "folder" && folderContains(child, id)) return true;
  }
  return false;
}

function mapNodes(
  nodes: readonly FileNode[],
  fn: (node: FileNode) => FileNode | null,
): FileNode[] {
  return nodes.flatMap((node) => {
    const next = fn(
      node.type === "folder"
        ? { ...node, children: mapNodes(node.children, fn) }
        : node,
    );
    return next === null ? [] : [next];
  });
}

function insertNode(
  nodes: readonly FileNode[],
  folderId: string | undefined,
  node: FileNode,
): FileNode[] {
  if (folderId === undefined) return [...nodes, node];
  return mapNodes(nodes, (current) =>
    current.type === "folder" && current.id === folderId
      ? { ...current, children: [...current.children, node] }
      : current,
  );
}

function insertAsset(
  nodes: readonly FileNode[],
  folderId: string | undefined,
  asset: AssetTileData,
): FileNode[] {
  const target =
    folderId === undefined
      ? nodes
      : (findFolder(nodes, folderId)?.children ?? []);
  const group = target.find((node) => node.type === "assets");
  if (group === undefined) {
    return insertNode(nodes, folderId, {
      id: `assets:${folderId ?? "root"}:${asset.id}`,
      type: "assets",
      name: "Images",
      assets: [asset],
    });
  }
  return mapNodes(nodes, (current) =>
    current.type === "assets" && current.id === group.id
      ? { ...current, assets: [...current.assets, asset] }
      : current,
  );
}

function extractNode(
  nodes: readonly FileNode[],
  id: string,
): { nodes: FileNode[]; taken?: FileNode } {
  let taken: FileNode | undefined;
  const next = nodes.flatMap((node) => {
    if (node.id === id) {
      taken = node;
      return [];
    }
    if (node.type === "folder") {
      const nested = extractNode(node.children, id);
      if (nested.taken !== undefined) {
        taken = nested.taken;
        return [{ ...node, children: nested.nodes }];
      }
    }
    return [node];
  });
  return taken === undefined ? { nodes: next } : { nodes: next, taken };
}

function extractAsset(
  nodes: readonly FileNode[],
  assetId: string,
): { nodes: FileNode[]; taken?: AssetTileData } {
  let taken: AssetTileData | undefined;
  const next = mapNodes(nodes, (current) => {
    if (current.type !== "assets") return current;
    const asset = current.assets.find((entry) => entry.id === assetId);
    if (asset === undefined) return current;
    taken = asset;
    const assets = current.assets.filter((entry) => entry.id !== assetId);
    return assets.length === 0 ? null : { ...current, assets };
  });
  return taken === undefined ? { nodes: next } : { nodes: next, taken };
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

export function canMoveLibraryItem(
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

  const nodeTake = extractNode(source.nodes, itemId);
  const assetTake =
    nodeTake.taken === undefined
      ? extractAsset(source.nodes, itemId)
      : undefined;
  if (nodeTake.taken === undefined && assetTake?.taken === undefined) {
    return null;
  }

  const name =
    nodeTake.taken?.name ??
    assetTake?.taken.caption ??
    "Untitled";

  const emptied =
    nodeTake.taken !== undefined ? nodeTake.nodes : (assetTake?.nodes ?? []);

  const filled =
    dest.sectionId === from.sectionId
      ? nodeTake.taken !== undefined
        ? insertNode(emptied, dest.folderId, nodeTake.taken)
        : insertAsset(emptied, dest.folderId, assetTake!.taken!)
      : dest.sectionId === destination.id
        ? nodeTake.taken !== undefined
          ? insertNode(destination.nodes, dest.folderId, nodeTake.taken)
          : insertAsset(destination.nodes, dest.folderId, assetTake!.taken!)
        : destination.nodes;

  const next = sections.map((section) => {
    if (section.id === from.sectionId && section.id === dest.sectionId) {
      return { ...section, nodes: filled };
    }
    if (section.id === from.sectionId) {
      return { ...section, nodes: emptied };
    }
    if (section.id === dest.sectionId) {
      return { ...section, nodes: filled };
    }
    return section;
  });

  return { sections: next, name, destName };
}

export function preventFileMove(event: DragEvent<HTMLElement>) {
  if (!isFileMove(Array.from(event.dataTransfer.types))) return false;
  event.preventDefault();
  event.dataTransfer.dropEffect = "move";
  return true;
}

export function isLeavingDropTarget(event: DragEvent<HTMLElement>): boolean {
  const next = event.relatedTarget;
  return !(next instanceof Node && event.currentTarget.contains(next));
}
