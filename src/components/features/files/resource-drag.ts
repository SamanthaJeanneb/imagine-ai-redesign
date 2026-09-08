import type { DragEvent } from "react";

import type { AssetTileData } from "@/components/features/files/asset-tile";

export const RESOURCE_DRAG_TYPE = "application/x-imagine-resource";

export interface FileResource {
  id: string;
  title: string;
}

export type DraggableResource =
  | { kind: "file"; file: FileResource }
  | { kind: "asset"; asset: AssetTileData };

export function resourceTitle(resource: DraggableResource): string {
  return resource.kind === "file"
    ? resource.file.title
    : (resource.asset.caption ?? "Untitled asset");
}

/** Adds the typed payload the composer accepts, plus a useful plain-text fallback. */
export function writeResourceDrag(
  event: DragEvent<HTMLElement>,
  resource: DraggableResource,
) {
  event.dataTransfer.effectAllowed = "copy";
  event.dataTransfer.setData(RESOURCE_DRAG_TYPE, JSON.stringify(resource));
  event.dataTransfer.setData("text/plain", resourceTitle(resource));
}

export function hasResourceDrag(types: readonly string[]): boolean {
  return types.includes(RESOURCE_DRAG_TYPE);
}

/** Treat drag payloads as untrusted input even though the current source is local. */
export function readResourceDrag(
  dataTransfer: DataTransfer,
): DraggableResource | null {
  const encoded = dataTransfer.getData(RESOURCE_DRAG_TYPE);
  if (encoded === "") return null;

  try {
    const value: unknown = JSON.parse(encoded);
    if (typeof value !== "object" || value === null || !("kind" in value)) {
      return null;
    }
    if (value.kind === "file" && "file" in value) {
      const file = value.file;
      if (
        typeof file === "object" &&
        file !== null &&
        "id" in file &&
        "title" in file &&
        typeof file.id === "string" &&
        typeof file.title === "string"
      ) {
        return { kind: "file", file: { id: file.id, title: file.title } };
      }
    }
    if (value.kind === "asset" && "asset" in value) {
      const asset = value.asset;
      if (
        typeof asset === "object" &&
        asset !== null &&
        "id" in asset &&
        "kind" in asset &&
        typeof asset.id === "string" &&
        (asset.kind === "image" || asset.kind === "video")
      ) {
        return {
          kind: "asset",
          asset: {
            id: asset.id,
            kind: asset.kind,
            ...("src" in asset && typeof asset.src === "string"
              ? { src: asset.src }
              : {}),
            ...("caption" in asset && typeof asset.caption === "string"
              ? { caption: asset.caption }
              : {}),
          },
        };
      }
    }
  } catch {
    return null;
  }

  return null;
}
