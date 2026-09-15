import { findFolder } from "@/lib/file-tree-ops";
import type {
  BrowserItem,
  Filter,
  MediaItem,
  Place,
  Sort,
} from "@/components/features/files/files-library-types";
import type { FileNode, FileSection } from "@/entities/files";

/** How the browser is arranging whatever the location holds. */
export interface BrowseArrangement {
  filter: Filter;
  sort: Sort;
}

export interface BrowseResult {
  /** Everything that survived the filter, in sorted order. */
  shown: readonly BrowserItem[];
  folders: readonly BrowserItem[];
  docs: readonly BrowserItem[];
  media: readonly MediaItem[];
}

function toItems(nodes: readonly FileNode[]): BrowserItem[] {
  const items: BrowserItem[] = [];
  for (const node of nodes) {
    if (node.type === "folder") {
      items.push({
        id: node.id,
        kind: "folder",
        name: node.name,
      });
    } else if (node.type === "file") {
      items.push({
        id: node.id,
        kind: "document",
        name: node.name,
        ...(node.excerpt === undefined ? {} : { excerpt: node.excerpt }),
      });
    } else {
      for (const asset of node.assets) {
        items.push({
          id: asset.id,
          kind: asset.kind,
          name: asset.caption ?? "Untitled image",
          ...(asset.src === undefined ? {} : { src: asset.src }),
        });
      }
    }
  }
  return items;
}

/** The libraries themselves are the folders of the root location. */
function locationItems(
  place: Place,
  sections: readonly FileSection[],
): BrowserItem[] {
  if (place.kind === "root") {
    return sections.map((section) => ({
      id: section.id,
      kind: "folder",
      name: section.title,
    }));
  }
  const section = sections.find((entry) => entry.id === place.sectionId);
  if (section === undefined) return [];
  const folder =
    place.folderId === undefined
      ? undefined
      : findFolder(section.nodes, place.folderId);
  return toItems(folder?.children ?? section.nodes);
}

function passesFilter(item: BrowserItem, filter: Filter): boolean {
  switch (filter) {
    case "all":
      return true;
    case "documents":
      return item.kind === "document";
    case "images":
      return item.kind === "image" || item.kind === "video";
  }
}

/** What the browser draws for one location: filtered, sorted, and grouped. */
export function browseLocation(
  place: Place,
  sections: readonly FileSection[],
  arrangement: BrowseArrangement,
): BrowseResult {
  const shown = locationItems(place, sections)
    .filter((item) => passesFilter(item, arrangement.filter))
    .toSorted((a, b) => {
      const order = a.name.localeCompare(b.name);
      return arrangement.sort === "name-desc" ? -order : order;
    });

  return {
    shown,
    folders: shown.filter((item) => item.kind === "folder"),
    docs: shown.filter((item) => item.kind === "document"),
    media: shown.filter(
      (item): item is MediaItem =>
        item.kind === "image" || item.kind === "video",
    ),
  };
}
