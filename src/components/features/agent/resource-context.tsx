"use client";

import { cn } from "cn";
import { motion } from "motion/react";

import type { DraggableResource } from "@/components/features/files/resource-drag";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { spring } from "@/styles/motion";

interface ResourceContextProps {
  resource: DraggableResource;
  onRemove?: () => void;
  className?: string;
}

/** A file or media asset attached to the next chat message. */
export function ResourceContext({
  resource,
  onRemove,
  className,
}: ResourceContextProps) {
  const isFile = resource.kind === "file";
  const title = isFile
    ? resource.file.title
    : (resource.asset.caption ?? "Untitled asset");

  return (
    <motion.div
      layout
      initial={{ opacity: 0, transform: "translateY(6px) scale(0.96)" }}
      animate={{ opacity: 1, transform: "translateY(0px) scale(1)" }}
      exit={{ opacity: 0, transform: "translateY(4px) scale(0.96)" }}
      transition={spring.snappy}
      data-slot="resource-context"
      data-kind={resource.kind}
      className={cn(
        "flex h-10 max-w-sm items-center gap-s rounded-control bg-imagine-surface-raised py-xs pr-xs pl-s shadow-control",
        className,
      )}
    >
      {isFile ? (
        <span className="flex size-7 shrink-0 items-center justify-center rounded-xs bg-imagine-surface text-imagine-foreground-muted">
          <Icon name="file-lines" size="s" />
        </span>
      ) : resource.asset.src ? (
        // Mock assets are intentionally served from arbitrary public hosts.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={resource.asset.src}
          alt=""
          className="size-7 shrink-0 rounded-xs object-cover"
        />
      ) : (
        <span className="flex size-7 shrink-0 items-center justify-center rounded-xs bg-imagine-surface text-imagine-foreground-muted">
          <Icon
            name={resource.asset.kind === "video" ? "video" : "image"}
            size="s"
          />
        </span>
      )}
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate type-small font-medium">{title}</span>
        <span className="text-xs text-imagine-foreground-muted">
          {isFile
            ? "Workspace file"
            : resource.asset.kind === "video"
              ? "Video asset"
              : "Image asset"}
        </span>
      </span>
      {onRemove ? (
        <Button
          size="icon-xs"
          variant="ghost"
          aria-label={`Remove ${title}`}
          onClick={onRemove}
          className="text-imagine-foreground-faint hover:text-imagine-foreground"
        >
          <Icon name="xmark" size="s" />
        </Button>
      ) : null}
    </motion.div>
  );
}
