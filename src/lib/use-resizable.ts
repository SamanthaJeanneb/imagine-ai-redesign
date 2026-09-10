"use client";

import { useRef, useState } from "react";

import type { Transition } from "motion/react";

import { spring } from "@/styles/motion";

/** Which edge of the panel the handle sits on; drag direction follows. */
export type ResizeEdge = "start" | "end";

interface ResizableOptions {
  defaultWidth: number;
  min: number;
  max: number;
  /** `end` for a panel on the left (handle on its right); `start` otherwise. */
  edge: ResizeEdge;
  /** How the panel otherwise moves: opening, collapsing. */
  transition?: Transition;
}

export interface ResizeHandleBinding {
  role: "separator";
  "aria-orientation": "vertical";
  "aria-valuenow": number;
  "aria-valuemin": number;
  "aria-valuemax": number;
  tabIndex: 0;
  onPointerDown: (event: React.PointerEvent<HTMLElement>) => void;
  onPointerMove: (event: React.PointerEvent<HTMLElement>) => void;
  onPointerUp: (event: React.PointerEvent<HTMLElement>) => void;
  onKeyDown: (event: React.KeyboardEvent<HTMLElement>) => void;
  onDoubleClick: () => void;
}

const KEY_STEP = 16;
const INSTANT: Transition = { duration: 0 };

/**
 * A draggable width for a sidebar or panel. The width follows the pointer
 * while dragging and keeps the given transition for everything else, so a
 * panel still opens and collapses the way it did. Arrow keys nudge it, Home
 * and End go to the limits, and a double-click on the handle puts the default
 * back. The width lives for the session; the shell keeps it across routes.
 */
export function useResizable({
  defaultWidth,
  min,
  max,
  edge,
  transition = spring.soft,
}: ResizableOptions): {
  width: number;
  dragging: boolean;
  /** Pass to the panel's `transition`; instant while dragging. */
  transition: Transition;
  handle: ResizeHandleBinding;
} {
  const [width, setWidth] = useState(defaultWidth);
  const [dragging, setDragging] = useState(false);
  const drag = useRef<{ startX: number; startWidth: number } | null>(null);
  const clamp = (value: number) =>
    Math.min(max, Math.max(min, Math.round(value)));

  const handle: ResizeHandleBinding = {
    role: "separator",
    "aria-orientation": "vertical",
    "aria-valuenow": width,
    "aria-valuemin": min,
    "aria-valuemax": max,
    tabIndex: 0,
    onPointerDown: (event) => {
      if (event.button !== 0) return;
      event.preventDefault();
      // Keeps the move and release coming even once the pointer leaves the
      // strip. Synthetic events have no pointer to capture; the drag still
      // works while the pointer stays over the strip.
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {
        // See above.
      }
      drag.current = { startX: event.clientX, startWidth: width };
      setDragging(true);
    },
    onPointerMove: (event) => {
      if (drag.current === null) return;
      const delta = event.clientX - drag.current.startX;
      setWidth(
        clamp(drag.current.startWidth + (edge === "end" ? delta : -delta)),
      );
    },
    onPointerUp: (event) => {
      if (drag.current === null) return;
      drag.current = null;
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
      setDragging(false);
    },
    onKeyDown: (event) => {
      const grow = edge === "end" ? "ArrowRight" : "ArrowLeft";
      const shrink = edge === "end" ? "ArrowLeft" : "ArrowRight";
      if (event.key === grow) {
        event.preventDefault();
        setWidth((current) => clamp(current + KEY_STEP));
      } else if (event.key === shrink) {
        event.preventDefault();
        setWidth((current) => clamp(current - KEY_STEP));
      } else if (event.key === "Home") {
        event.preventDefault();
        setWidth(min);
      } else if (event.key === "End") {
        event.preventDefault();
        setWidth(max);
      }
    },
    onDoubleClick: () => {
      setWidth(defaultWidth);
    },
  };

  return {
    width,
    dragging,
    transition: dragging ? INSTANT : transition,
    handle,
  };
}
