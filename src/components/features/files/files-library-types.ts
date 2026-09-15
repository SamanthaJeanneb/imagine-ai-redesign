import type { LibraryCardKind } from "@/components/features/files/library-card";

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
