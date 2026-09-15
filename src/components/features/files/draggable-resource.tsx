"use client";

import { cn } from "cn";
import type { ReactNode } from "react";

import type { AssetTileData } from "@/components/features/files/asset-tile";
import {
  type DraggableResource as DraggableResourcePayload,
  type FileResource,
  writeResourceDrag,
} from "@/components/features/files/resource-drag";

/**
 * Wrap a file row or asset tile so it can be dragged into the chat composer.
 * Native HTML drag on a plain element; the wrapped content is untouched. Fades
 * while the drag is in flight.
 */
export function DraggableResource({
  resource,
  className,
  children,
}: {
  resource: DraggableResourcePayload;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      draggable
      title="Drag to attach to chat"
      data-slot="draggable-resource"
      onDragStart={(event) => {
        event.currentTarget.dataset["dragging"] = "true";
        writeResourceDrag(event, resource);
      }}
      onDragEnd={(event) => {
        delete event.currentTarget.dataset["dragging"];
      }}
      className={cn(
        "cursor-grab transition-opacity active:cursor-grabbing data-[dragging=true]:opacity-40",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function DraggableFile({
  file,
  className,
  children,
}: {
  file: FileResource;
  className?: string;
  children: ReactNode;
}) {
  return (
    <DraggableResource resource={{ kind: "file", file }} className={className}>
      {children}
    </DraggableResource>
  );
}

export function DraggableAsset({
  asset,
  className,
  children,
}: {
  asset: AssetTileData;
  className?: string;
  children: ReactNode;
}) {
  return (
    <DraggableResource
      resource={{ kind: "asset", asset }}
      className={className}
    >
      {children}
    </DraggableResource>
  );
}
