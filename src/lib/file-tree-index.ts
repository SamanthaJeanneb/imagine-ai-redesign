import type { AssetTileData } from "@/entities/asset";
import type { FileNode, FileSection } from "@/entities/files";

/** Which library and folder something sits in. */
export interface FileTreeLocation {
  sectionId: string;
  folderId?: string;
}

/** One node in reading order, with the library it was found under. */
export interface FileTreeEntry extends FileTreeLocation {
  node: FileNode;
  sectionTitle: string;
}

export interface FileTreeIndex {
  /** Every node and asset, keyed by id, with its library and parent folder. */
  home: ReadonlyMap<string, FileTreeLocation>;
  assetById: ReadonlyMap<string, AssetTileData>;
  /** The library, the folders below it, and the id itself: the way down. */
  pathById: ReadonlyMap<string, readonly string[]>;
  /** Depth first, parents before their children. */
  entries: readonly FileTreeEntry[];
}

/**
 * One walk over the libraries, for everything that needs to know where an
 * item lives: moving it, holding its row open, searching, and putting it back.
 */
export function buildFileTreeIndex(
  sections: readonly FileSection[],
): FileTreeIndex {
  const home = new Map<string, FileTreeLocation>();
  const assetById = new Map<string, AssetTileData>();
  const pathById = new Map<string, readonly string[]>();
  const entries: FileTreeEntry[] = [];

  const walk = (
    nodes: readonly FileNode[],
    section: FileSection,
    path: readonly string[],
    folderId?: string,
  ) => {
    const at: FileTreeLocation = {
      sectionId: section.id,
      ...(folderId === undefined ? {} : { folderId }),
    };
    for (const node of nodes) {
      const below = [...path, node.id];
      home.set(node.id, at);
      pathById.set(node.id, below);
      entries.push({ ...at, node, sectionTitle: section.title });
      if (node.type === "folder") {
        walk(node.children, section, below, node.id);
      } else if (node.type === "assets") {
        for (const asset of node.assets) {
          home.set(asset.id, at);
          pathById.set(asset.id, [...path, asset.id]);
          assetById.set(asset.id, asset);
        }
      }
    }
  };

  for (const section of sections) {
    pathById.set(section.id, [section.id]);
    walk(section.nodes, section, [section.id]);
  }

  return { home, assetById, pathById, entries };
}
