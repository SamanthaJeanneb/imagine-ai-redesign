import type { AssetTileData } from "@/components/features/files/asset-tile";
import type { FileNode } from "@/components/features/files/file-tree";

export type FolderNode = Extract<FileNode, { type: "folder" }>;

/** Everything that is not a folder, with the nesting flattened away. */
export function leaves(nodes: readonly FileNode[]): readonly FileNode[] {
  return nodes.flatMap((node) =>
    node.type === "folder" ? leaves(node.children) : [node],
  );
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

export function folderContains(folder: FolderNode, id: string): boolean {
  for (const child of folder.children) {
    if (child.id === id) return true;
    if (child.type === "folder" && folderContains(child, id)) return true;
  }
  return false;
}

/** Rebuilds the tree, replacing each node with the result, dropping `null`. */
export function mapNodes(
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

export function insertNode(
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

/** Adds to the folder's existing assets row, or starts one if it has none. */
export function insertAsset(
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

export function removeAsset(
  nodes: readonly FileNode[],
  assetId: string,
): FileNode[] {
  return mapNodes(nodes, (current) => {
    if (current.type !== "assets") return current;
    const assets = current.assets.filter((asset) => asset.id !== assetId);
    return assets.length === 0 ? null : { ...current, assets };
  });
}

/** Takes a node out of the tree, and hands back both halves. */
export function extractNode(
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

/** The same, for one asset out of an assets row. */
export function extractAsset(
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
