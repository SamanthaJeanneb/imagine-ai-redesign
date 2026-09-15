"use client";

import { cn } from "cn";
import {
  createContext,
  useContext,
  type DragEvent,
  type ReactNode,
} from "react";

const DragContext = createContext<{ dragging: boolean } | null>(null);
const DropContext = createContext<{ active: boolean } | null>(null);

/** Null where nothing above has made this row or card draggable. */
export function useFileDrag() {
  return useContext(DragContext);
}

/** Null where nothing above accepts a drop here. */
export function useFileDrop() {
  return useContext(DropContext);
}

/**
 * Makes whatever it wraps a native drag source, so it can be moved to another
 * library or folder. Plain element: motion's own drag props never see it.
 * The look while in flight is the caller's, off `data-dragging`.
 */
export function FileDragSource({
  dragging = false,
  onDragStart,
  onDragEnd,
  className,
  children,
}: {
  /** This one is in flight; it stops reacting to hover. */
  dragging?: boolean;
  onDragStart: (event: DragEvent<HTMLElement>) => void;
  onDragEnd: (event: DragEvent<HTMLElement>) => void;
  className?: string;
  children: ReactNode;
}) {
  return (
    <DragContext value={{ dragging }}>
      <div
        draggable
        data-slot="file-drag-source"
        data-dragging={dragging || undefined}
        onDragStart={(event) => {
          event.stopPropagation();
          onDragStart(event);
        }}
        onDragEnd={onDragEnd}
        className={cn("cursor-grab active:cursor-grabbing", className)}
      >
        {children}
      </div>
    </DragContext>
  );
}

/** Lets a library or folder accept a dragged item; `active` lights it up. */
export function FileDropTarget({
  active = false,
  onDragOver,
  onDragLeave,
  onDrop,
  className,
  children,
}: {
  active?: boolean;
  onDragOver: (event: DragEvent<HTMLElement>) => void;
  onDragLeave: (event: DragEvent<HTMLElement>) => void;
  onDrop: (event: DragEvent<HTMLElement>) => void;
  className?: string;
  children: ReactNode;
}) {
  return (
    <DropContext value={{ active }}>
      <div
        data-slot="file-drop-target"
        data-drop-active={active || undefined}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        {...(className === undefined ? {} : { className })}
      >
        {children}
      </div>
    </DropContext>
  );
}
