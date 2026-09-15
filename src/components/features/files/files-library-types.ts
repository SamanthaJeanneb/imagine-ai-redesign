import type { AssetTileData } from "@/components/features/files/asset-tile";
import type { LibraryCardKind } from "@/components/features/files/library-card";
import type { FileNode } from "@/entities/files";

/** What the browser is looking at. */
export type Place =
  { kind: "root" } | { kind: "library"; sectionId: string; folderId?: string };

/** One thing the browser can show, whatever it came from. */
export interface BrowserItem {
  id: string;
  kind: LibraryCardKind;
  name: string;
  excerpt?: string;
  src?: string;
}

export type MediaItem = BrowserItem & { kind: "image" | "video" };

/** Which half of the library the rail and the browser are showing. */
export type Tab = "files" | "skills";

export type Filter = "all" | "documents" | "images";

export type Sort = "name-asc" | "name-desc";

/** Which library and folder something sits in. */
export interface ItemHome {
  sectionId: string;
  folderId?: string;
}

/** Enough to put a deleted item back where it was. */
export interface RemovedItem extends ItemHome {
  name: string;
  payload:
    { type: "node"; node: FileNode } | { type: "asset"; asset: AssetTileData };
}

export type DialogState =
  { kind: "new-folder" } | { kind: "rename"; id: string; name: string } | null;
