"use client";

import { cn } from "cn";
import type { ReactNode } from "react";

import { type AssetTileData } from "@/components/features/files/asset-tile";
import { Stagger, StaggerItem } from "@/components/motion/stagger";

interface AssetGridFrameProps {
  className?: string;
  children: ReactNode;
}

/**
 * Thumbnails for the Files page: `AssetGridItem`s, optionally followed by an
 * `AssetGridOverflow` tile. Enter with `stagger.grid`.
 */
export function AssetGrid({ className, children }: AssetGridFrameProps) {
  return (
    <Stagger
      kind="grid"
      data-slot="asset-grid"
      className={cn(
        "grid grid-cols-[repeat(auto-fill,minmax(96px,1fr))] gap-s",
        className,
      )}
    >
      {children}
    </Stagger>
  );
}

/** The files tree's grid: smaller tiles, same parts. */
export function AssetGridSmall({ className, children }: AssetGridFrameProps) {
  return (
    <Stagger
      kind="grid"
      data-slot="asset-grid"
      className={cn(
        "grid grid-cols-[repeat(auto-fill,minmax(56px,1fr))] gap-s",
        className,
      )}
    >
      {children}
    </Stagger>
  );
}

/** One cell: the tile (an `AssetTile` or `AssetTileButton`) over its caption. */
export function AssetGridItem({
  asset,
  children,
}: {
  asset: AssetTileData;
  children: ReactNode;
}) {
  return (
    <StaggerItem>
      <div className="flex flex-col gap-xs">
        {children}
        {asset.caption ? (
          <span className="truncate px-xxs type-small text-imagine-foreground-muted">
            {asset.caption}
          </span>
        ) : null}
      </div>
    </StaggerItem>
  );
}

/** The dashed "+N" tile that stands in for the assets past the fold. */
export function AssetGridOverflow({
  count,
  onPress,
}: {
  count: number;
  onPress: () => void;
}) {
  return (
    <StaggerItem>
      <button
        type="button"
        onClick={onPress}
        className="flex aspect-square w-full items-center justify-center rounded-control border border-dashed border-imagine-foreground-faint/60 type-small text-imagine-foreground-muted transition-colors outline-none hover:border-imagine-foreground-muted hover:text-imagine-foreground focus-visible:ring-2 focus-visible:ring-ring/40"
      >
        +{count}
      </button>
    </StaggerItem>
  );
}
