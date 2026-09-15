"use client";

import { cn } from "cn";
import type { ReactNode } from "react";

/**
 * The frame every workspace page sits in, after the header divider. Padding
 * lives on the scrollport, not the clip around it. `overflow-y-auto` makes
 * the inner box clip on x as well, and the landing composer sits flush to
 * that edge — its shadow and left radius disappear if the inset is outside.
 *
 * The scrollport is the `frame` container so a page can ask whether it is
 * running narrower than the frame (`@page/frame`) and drop a bleed that no
 * longer reaches an edge.
 */
export function WorkspacePageFrame({
  children,
  overlay,
  className,
}: {
  children: ReactNode;
  /** File tabs and the editor, over the page. */
  overlay?: ReactNode;
  className?: string;
}) {
  return (
    <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      {/* The overlay's tab strip; this spacer keeps the thread from sliding
          under it. */}
      {overlay === undefined ? null : (
        <div aria-hidden="true" className="h-9 shrink-0" />
      )}
      <div
        className={cn(
          "@container/frame flex min-h-0 min-w-0 flex-1 flex-col overflow-x-clip overflow-y-auto",
          className,
        )}
      >
        {children}
      </div>
      {overlay}
    </div>
  );
}

/**
 * The inset most pages start in. Pages do not set their own top or side
 * padding; this is the one frame. The side inset is `px-page`: the gutter on
 * a laptop, and on a wide monitor the space left over once the page is a
 * centered `max-w-page` column. The header above keeps its controls at the
 * frame's edges, as chrome does.
 */
export function WorkspaceInsetPage({
  children,
  overlay,
}: {
  children: ReactNode;
  overlay?: ReactNode;
}) {
  return (
    <WorkspacePageFrame
      {...(overlay === undefined ? {} : { overlay })}
      className="px-page pt-l pb-l md:pt-xxl md:pb-xxl"
    >
      {children}
    </WorkspacePageFrame>
  );
}

/** Pane-based workspaces, like files and the calendar, frame themselves. */
export function WorkspaceFlushPage({
  children,
  overlay,
}: {
  children: ReactNode;
  overlay?: ReactNode;
}) {
  return (
    <WorkspacePageFrame {...(overlay === undefined ? {} : { overlay })}>
      {children}
    </WorkspacePageFrame>
  );
}
