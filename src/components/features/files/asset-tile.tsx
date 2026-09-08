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
}

interface AssetTileProps {
  asset: AssetTileData;
  selected?: boolean;
  /** Renders as a button. */
  onSelect?: (asset: AssetTileData) => void;
  className?: string;
}

/**
 * A square media thumbnail. Videos get a small play mark; a selection ring is
 * the only chrome. Placeholders use the raised surface.
 */
export function AssetTile({
  asset,
  selected = false,
  onSelect,
  className,
}: AssetTileProps) {
  const classes = cn(
    "group/asset relative aspect-square overflow-hidden rounded-control bg-imagine-surface-raised outline-none",
    onSelect && "focus-visible:ring-2 focus-visible:ring-ring/40",
    selected &&
      "ring-2 ring-imagine-foreground ring-offset-2 ring-offset-imagine-surface",
    className,
  );

  const content = (
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

  if (!onSelect) {
    return (
      <div data-slot="asset-tile" data-kind={asset.kind} className={classes}>
        {content}
      </div>
    );
  }

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
      className={classes}
    >
      {content}
    </motion.button>
  );
}
