"use client";

import { cn } from "cn";
import { useState } from "react";

import {
  AssetTile,
  type AssetTileData,
} from "@/components/features/files/asset-tile";
import { Stagger, StaggerItem } from "@/components/motion/stagger";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";

interface AssetPickerProps {
  prompt: string;
  assets: readonly AssetTileData[];
  selectedId?: string;
  onSelectedChange?: (id: string | undefined) => void;
  onConfirm?: (asset: AssetTileData) => void;
  onBrowse?: () => void;
  className?: string;
}

/**
 * The agent offering images for a post: a row of tiles, one selectable, and a
 * confirm action that only appears once something is picked.
 */
export function AssetPicker({
  prompt,
  assets,
  selectedId: controlledId,
  onSelectedChange,
  onConfirm,
  onBrowse,
  className,
}: AssetPickerProps) {
  const [uncontrolledId, setUncontrolledId] = useState<string | undefined>();
  const selectedId = controlledId ?? uncontrolledId;
  const selected = assets.find((asset) => asset.id === selectedId);

  return (
    <div
      data-slot="asset-picker"
      className={cn("flex w-full max-w-lg flex-col gap-m", className)}
    >
      <span className="type-body font-medium">{prompt}</span>
      <Stagger kind="grid" className="grid grid-cols-4 gap-s p-xs">
        {assets.map((asset) => (
          <StaggerItem key={asset.id}>
            <AssetTile
              asset={asset}
              selected={asset.id === selectedId}
              onSelect={(next) => {
                const id = next.id === selectedId ? undefined : next.id;
                setUncontrolledId(id);
                onSelectedChange?.(id);
              }}
            />
          </StaggerItem>
        ))}
      </Stagger>
      <div className="flex items-center gap-xs">
        <Button
          size="sm"
          disabled={!selected}
          onClick={() => {
            if (selected) onConfirm?.(selected);
          }}
        >
          Use this image
        </Button>
        <Button size="sm" variant="ghost" onClick={onBrowse}>
          <Icon name="folder" size="s" data-icon="inline-start" />
          Browse files
        </Button>
      </div>
    </div>
  );
}
