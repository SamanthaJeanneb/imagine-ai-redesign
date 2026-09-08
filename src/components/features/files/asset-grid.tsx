"use client";

import { cn } from "cn";

import {
  AssetTile,
  type AssetTileData,
} from "@/components/features/files/asset-tile";
import { writeResourceDrag } from "@/components/features/files/resource-drag";
import { Stagger, StaggerItem } from "@/components/motion/stagger";

interface AssetGridProps {
  assets: readonly AssetTileData[];
  /** Tiles shown before the "+N" overflow tile. */
  limit?: number;
  selectedId?: string;
  onSelect?: (asset: AssetTileData) => void;
  onShowAll?: () => void;
  /** Tile size. `sm` is the files tree, `default` is the Files page. */
  size?: "sm" | "default";
  draggableResources?: boolean;
  className?: string;
}

/**
 * Thumbnails with a dashed "+N" tile when there are more than fit. Enter with
 * `stagger.grid`.
 */
export function AssetGrid({
  assets,
  limit,
  selectedId,
  onSelect,
  onShowAll,
  size = "default",
  draggableResources = false,
  className,
}: AssetGridProps) {
  const shown = limit === undefined ? assets : assets.slice(0, limit);
  const overflow = assets.length - shown.length;

  return (
    <Stagger
      kind="grid"
      data-slot="asset-grid"
      className={cn(
        "grid gap-s",
        size === "sm"
          ? "grid-cols-[repeat(auto-fill,minmax(56px,1fr))]"
          : "grid-cols-[repeat(auto-fill,minmax(96px,1fr))]",
        className,
      )}
    >
      {shown.map((asset) => (
        <StaggerItem key={asset.id}>
          <div
            draggable={draggableResources}
            title={draggableResources ? "Drag to attach to chat" : undefined}
            onDragStart={(event) => {
              if (!draggableResources) return;
              event.currentTarget.dataset["dragging"] = "true";
              writeResourceDrag(event, { kind: "asset", asset });
            }}
            onDragEnd={(event) => {
              delete event.currentTarget.dataset["dragging"];
            }}
            className="flex cursor-grab flex-col gap-xs transition-opacity active:cursor-grabbing data-[dragging=true]:opacity-40"
          >
            <AssetTile
              asset={asset}
              selected={asset.id === selectedId}
              onSelect={onSelect}
            />
            {asset.caption ? (
              <span className="truncate px-xxs type-small text-imagine-foreground-muted">
                {asset.caption}
              </span>
            ) : null}
          </div>
        </StaggerItem>
      ))}
      {overflow > 0 ? (
        <StaggerItem>
          <button
            type="button"
            onClick={onShowAll}
            className="flex aspect-square w-full items-center justify-center rounded-control border border-dashed border-imagine-foreground-faint/60 type-small text-imagine-foreground-muted transition-colors outline-none hover:border-imagine-foreground-muted hover:text-imagine-foreground focus-visible:ring-2 focus-visible:ring-ring/40"
          >
            +{overflow}
          </button>
        </StaggerItem>
      ) : null}
    </Stagger>
  );
}
