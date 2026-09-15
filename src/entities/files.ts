/**
 * The workspace library as the file panes read it: a section per organization
 * or person, holding documents, folders, and asset groups. Built by
 * `services/files` from `workspace_files` and the client's assets.
 */
import type { AssetTileData } from "@/entities/asset";

export type FileNode =
  | {
      type: "file";
      id: string;
      name: string;
      /** Opening lines of the document, for card previews. */
      excerpt?: string;
    }
  | { type: "folder"; id: string; name: string; children: readonly FileNode[] }
  | {
      type: "assets";
      id: string;
      name: string;
      assets: readonly AssetTileData[];
    };

export interface FileSection {
  id: string;
  title: string;
  kind: "organization" | "person";
  avatarUrl?: string;
  nodes: readonly FileNode[];
}

export interface DocumentMeta {
  title: string;
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  /** The instructions behind the skill, e.g. "calendar-gap.md". */
  fileName: string;
}
