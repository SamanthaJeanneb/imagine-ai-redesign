"use client";

import type { ReactNode } from "react";

import type { AssetTileData } from "@/components/features/files/asset-tile";
import {
  type DraggableResource,
  type FileResource,
  writeResourceDrag,
} from "@/components/features/files/resource-drag";

/**
 * Wrap a file row or asset tile so it can be dragged into the chat composer.
 * Native HTML drag on a plain element; the wrapped content is untouched. Fades
 * while the drag is in flight.
 */
function ResourceDragSource({
  resource,
  children,
}: {
  resource: DraggableResource;
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
      className="cursor-grab transition-opacity active:cursor-grabbing data-[dragging=true]:opacity-40"
    >
      {children}
    </div>
  );
}

export function DraggableFile({
  file,
  children,
}: {
  file: FileResource;
  children: ReactNode;
}) {
  return (
    <ResourceDragSource resource={{ kind: "file", file }}>
      {children}
    </ResourceDragSource>
  );
}

export function DraggableAsset({
  asset,
  children,
}: {
  asset: AssetTileData;
  children: ReactNode;
}) {
  return (
    <ResourceDragSource resource={{ kind: "asset", asset }}>
      {children}
    </ResourceDragSource>
  );
}
