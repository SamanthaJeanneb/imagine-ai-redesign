"use client";

import { cn } from "cn";
import { motion } from "motion/react";

import { Icon } from "@/components/ui/icon";
import { hoverLift, press } from "@/styles/motion";

export interface AssetTileData {
  id: string;
  kind: "image" | "video";
  /** Omit for a placeholder tile. */
  src?: string;
  caption?: string;
  /** Attached to at least one post. */
  inUse?: boolean;
}

const TILE_CLASS =
  "group/asset relative aspect-square overflow-hidden rounded-control bg-imagine-surface-raised outline-none";

/** The thumbnail itself: the image, or a placeholder mark, plus a video badge. */
function AssetTileContent({ asset }: { asset: AssetTileData }) {
  return (
    <>
      {asset.src ? (
        // Mock assets come from arbitrary hosts; next/image needs a domain list.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={asset.src}
          alt={asset.caption ?? ""}
          className="size-full object-cover"
          loading="lazy"
        />
      ) : (
        <span className="flex size-full items-center justify-center text-imagine-foreground-faint">
          <Icon name={asset.kind === "video" ? "video" : "image"} size="l" />
        </span>
      )}
      {asset.kind === "video" && asset.src ? (
        <span className="absolute right-xs bottom-xs flex size-5 items-center justify-center rounded-xs bg-imagine-foreground/70 text-imagine-primary-foreground">
          <Icon name="video" size="s" active />
        </span>
      ) : null}
    </>
  );
}

/**
 * A square media thumbnail. Videos get a small play mark; placeholders use
 * the raised surface. Static: use `AssetTileButton` when it can be picked.
 */
export function AssetTile({
  asset,
  className,
}: {
  asset: AssetTileData;
  className?: string;
}) {
  return (
    <div
      data-slot="asset-tile"
      data-kind={asset.kind}
      className={cn(TILE_CLASS, className)}
    >
      <AssetTileContent asset={asset} />
    </div>
  );
}

/** A selectable tile. A ring is its only selected chrome. */
export function AssetTileButton({
  asset,
  selected = false,
  onSelect,
  className,
}: {
  asset: AssetTileData;
  selected?: boolean;
  onSelect: (asset: AssetTileData) => void;
  className?: string;
}) {
  return (
    <motion.button
      type="button"
      aria-pressed={selected}
      aria-label={asset.caption ?? "Select asset"}
      onClick={() => {
        onSelect(asset);
      }}
      whileTap={press.whileTap}
      whileHover={hoverLift.whileHover}
      transition={press.transition}
      data-slot="asset-tile"
      data-kind={asset.kind}
      className={cn(
        TILE_CLASS,
        "focus-visible:ring-2 focus-visible:ring-ring/40",
        selected &&
          "ring-2 ring-imagine-foreground ring-offset-2 ring-offset-imagine-surface",
        className,
      )}
    >
      <AssetTileContent asset={asset} />
    </motion.button>
  );
}
