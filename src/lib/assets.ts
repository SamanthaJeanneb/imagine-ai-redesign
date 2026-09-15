import type { AssetTileData } from "@/entities/asset";

/**
 * Picked files as asset tiles. The object URLs live only as long as the tab,
 * so whatever drops one has to revoke it.
 */

function mediaKind(file: File): AssetTileData["kind"] | null {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  return null;
}

/** The first `limit` images or videos among `files`, as tiles. */
export function assetsFromFiles(
  files: readonly File[],
  limit: number,
): AssetTileData[] {
  const assets: AssetTileData[] = [];
  for (const file of files) {
    if (assets.length >= limit) break;
    const kind = mediaKind(file);
    if (kind === null) continue;
    assets.push({
      id: `upload-${crypto.randomUUID()}`,
      kind,
      src: URL.createObjectURL(file),
      caption: file.name,
    });
  }
  return assets;
}

/** Frees the object URL behind an uploaded tile. Anything else is left alone. */
export function revokeBlobSrc(src: string | undefined) {
  if (src?.startsWith("blob:")) URL.revokeObjectURL(src);
}
