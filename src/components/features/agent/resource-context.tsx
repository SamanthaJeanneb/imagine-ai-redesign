"use client";

import { cn } from "cn";
import { motion } from "motion/react";
import type { ReactNode } from "react";

import type { AssetTileData } from "@/components/features/files/asset-tile";
import type { FileResource } from "@/components/features/files/resource-drag";
import { useLayoutLocked } from "@/components/motion/layout-lock";
import { Button } from "@/components/ui/button";
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

/** The chip's square: a thumbnail where there is one, an icon otherwise. */
function ContextChipGlyph({ children }: { children: ReactNode }) {
  return (
    <span className="flex size-7 shrink-0 items-center justify-center rounded-xs bg-imagine-surface text-imagine-foreground-muted">
      {children}
    </span>
  );
}

function ContextChipText({
  title,
  note,
}: {
  title: string;
  /** What kind of thing it is, under the name. */
  note: string;
}) {
  return (
    <span className="flex min-w-0 flex-1 flex-col">
      <span className="truncate type-small [line-height:1.15] font-medium">
        {title}
      </span>
      <span className="type-caption [line-height:1.15] text-imagine-foreground-muted">
        {note}
      </span>
    </span>
  );
}

/** Takes the thing back off the message. Omitted where it cannot be removed. */
function ContextChipRemove({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <Button
      size="icon-xs"
      variant="ghost"
      aria-label={`Remove ${label}`}
      onClick={onClick}
      className="text-imagine-foreground-faint hover:text-imagine-foreground"
    >
      <Icon name="xmark" size="s" />
    </Button>
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
      <ContextChipText title={file.title} note="Workspace file" />
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
      <ContextChipText
        title={title}
        note={video ? "Video asset" : "Image asset"}
      />
      {onRemove ? <ContextChipRemove label={title} onClick={onRemove} /> : null}
    </ContextChip>
  );
}
