"use client";

// Imagine: the grab strip on a panel's edge. Invisible until hovered or
// dragged, when a line shows along the edge. Sits inside a `relative` panel.

import { cn } from "cn";

import type { ResizeEdge, ResizeHandleBinding } from "@/lib/use-resizable";

interface ResizeHandleProps {
  edge: ResizeEdge;
  binding: ResizeHandleBinding;
  dragging: boolean;
  label: string;
  className?: string;
}

export function ResizeHandle({
  edge,
  binding,
  dragging,
  label,
  className,
}: ResizeHandleProps) {
  return (
    <div
      data-slot="resize-handle"
      data-dragging={dragging || undefined}
      aria-label={label}
      {...binding}
      className={cn(
        // Inside the edge, so panels that clip their overflow keep it.
        "group/handle absolute inset-y-0 z-20 w-2 cursor-col-resize touch-none outline-none select-none",
        edge === "end" ? "right-0" : "left-0",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "absolute inset-y-0 w-0.5 bg-imagine-secondary opacity-0 transition-opacity group-hover/handle:opacity-60 group-focus-visible/handle:opacity-100",
          edge === "end" ? "right-0" : "left-0",
          dragging && "opacity-100",
        )}
      />
    </div>
  );
}
