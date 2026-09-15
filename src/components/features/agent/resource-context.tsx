"use client";

import { cn } from "cn";
import { motion } from "motion/react";
import type { ReactNode } from "react";

import type { AssetTileData } from "@/components/features/files/asset-tile";
import type { FileResource } from "@/components/features/files/resource-drag";
import {
  ContextChipGlyph,
  ContextChipRemove,
  ContextChipStack,
} from "@/components/features/agent/context-chip";
import { useLayoutLocked } from "@/components/motion/layout-lock";
import { Icon } from "@/components/ui/icon";
import { fade } from "@/styles/motion";

interface ContextChipProps {
  /** `file` or `asset`, for styling hooks on the chip. */
  kind: string;
  className?: string;
  children: ReactNode;
}

/** The chip shape shared by everything attached to the next chat message. */
function ContextChip({ kind, className, children }: ContextChipProps) {
  const layoutLocked = useLayoutLocked();
  return (
    <motion.div
      layout={layoutLocked ? false : "position"}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={fade.fast}
      data-slot="resource-context"
      data-kind={kind}
      className={cn(
        "flex h-10 max-w-sm items-center gap-s rounded-control bg-imagine-surface-raised py-xs pr-xs pl-s shadow-control",
        className,
      )}
    >
      {children}
    </motion.div>
  );
}

/** A workspace file attached to the next chat message. */
export function FileContext({
  file,
  onRemove,
  className,
}: {
  file: FileResource;
  onRemove?: () => void;
  className?: string;
}) {
  return (
    <ContextChip kind="file" className={className}>
      <ContextChipGlyph>
        <Icon name="file-lines" size="s" />
      </ContextChipGlyph>
      <ContextChipStack title={file.title} note="Workspace file" />
      {onRemove ? (
        <ContextChipRemove label={file.title} onClick={onRemove} />
      ) : null}
    </ContextChip>
  );
}

/** A media asset attached to the next chat message. */
export function AssetContext({
  asset,
  onRemove,
  className,
}: {
  asset: AssetTileData;
  onRemove?: () => void;
  className?: string;
}) {
  const title = asset.caption ?? "Untitled asset";
  const video = asset.kind === "video";

  return (
    <ContextChip kind="asset" className={className}>
      {asset.src ? (
        // Mock assets are intentionally served from arbitrary public hosts.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={asset.src}
          alt=""
          className="size-7 shrink-0 rounded-xs object-cover"
        />
      ) : (
        <ContextChipGlyph>
          <Icon name={video ? "video" : "image"} size="s" />
        </ContextChipGlyph>
      )}
      <ContextChipStack
        title={title}
        note={video ? "Video asset" : "Image asset"}
      />
      {onRemove ? <ContextChipRemove label={title} onClick={onRemove} /> : null}
    </ContextChip>
  );
}
