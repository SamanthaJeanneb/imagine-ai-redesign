import type { AssetTileData } from "@/components/features/files/asset-tile";
import type {
  FileNode,
  FileSection,
} from "@/components/features/files/file-tree";
import type { Skill } from "@/components/features/files/skills-list";
import type { IconName } from "@/components/ui/icon";
import type { SearchBoxResult } from "@/components/ui/search-box";

export type FileSearchKind =
  | "folder"
  | "document"
  | "image"
  | "video"
  | "skill";

/** One hit in the shared search dropdown. Callers decide what a click does. */
export interface FileSearchHit {
  id: string;
  icon: IconName;
  title: string;
  detail?: string;
  kind: FileSearchKind;
  sectionId?: string;
  asset?: AssetTileData;
}

interface SearchFileOptions {
  /** Folders are listed on the Files page, not in the compact panel. */
  includeFolders?: boolean;
}

function matches(text: string | undefined, needle: string): boolean {
  return text?.toLowerCase().includes(needle) ?? false;
}

function walk(
  nodes: readonly FileNode[],
  needle: string,
  sectionId: string,
  sectionTitle: string,
  includeFolders: boolean,
): FileSearchHit[] {
  return nodes.flatMap((node) => {
    if (node.type === "folder") {
      const self: FileSearchHit[] =
        includeFolders && matches(node.name, needle)
          ? [
              {
                id: node.id,
                icon: "folder",
                title: node.name,
                detail: sectionTitle,
                kind: "folder",
                sectionId,
              },
            ]
          : [];
      return [
        ...self,
        ...walk(
          node.children,
          needle,
          sectionId,
          sectionTitle,
          includeFolders,
        ),
      ];
    }
    if (node.type === "file") {
      if (!matches(node.name, needle) && !matches(node.excerpt, needle)) {
        return [];
      }
      return [
        {
          id: node.id,
          icon: "file-lines",
          title: node.name,
          detail: sectionTitle,
          kind: "document",
          sectionId,
        },
      ];
    }
    return node.assets.flatMap((asset) => {
      const title = asset.caption ?? "Untitled image";
      if (!matches(title, needle) && !matches(asset.kind, needle)) return [];
      return [
        {
          id: asset.id,
          icon: asset.kind === "video" ? "video" : "image",
          title,
          detail: sectionTitle,
          kind: asset.kind,
          sectionId,
          asset,
        },
      ];
    });
  });
}

/** Folders, documents, and assets under the given libraries. */
export function searchFiles(
  sections: readonly FileSection[],
  query: string,
  options: SearchFileOptions = {},
): FileSearchHit[] {
  const needle = query.trim().toLowerCase();
  if (needle === "") return [];
  const includeFolders = options.includeFolders === true;
  return sections.flatMap((section) =>
    walk(section.nodes, needle, section.id, section.title, includeFolders),
  );
}

export function searchSkills(
  skills: readonly Skill[],
  query: string,
): FileSearchHit[] {
  const needle = query.trim().toLowerCase();
  if (needle === "") return [];
  return skills.flatMap((skill) =>
    matches(`${skill.name} ${skill.description} ${skill.fileName}`, needle)
      ? [
          {
            id: skill.id,
            icon: "puzzle-piece",
            title: skill.name,
            detail: skill.fileName,
            kind: "skill",
          },
        ]
      : [],
  );
}

export function toSearchResults(
  hits: readonly FileSearchHit[],
): SearchBoxResult[] {
  return hits.map((hit) => ({
    id: hit.id,
    icon: hit.icon,
    title: hit.title,
    ...(hit.detail === undefined ? {} : { detail: hit.detail }),
  }));
}
