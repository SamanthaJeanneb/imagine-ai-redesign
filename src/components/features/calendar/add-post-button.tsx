"use client";

import { cn } from "cn";

import { Icon } from "@/components/ui/icon";

interface AddPostButtonProps {
  /** The day, and the hour when the cell has one: "Tue, 8 Sep at 14:00". */
  when: string;
  onClick: () => void;
  className?: string;
}

/**
 * The quiet way to start a post: a plus in the corner of a calendar cell,
 * there once the pointer is over the day it would go out on.
 */
export function AddPostButton({
  when,
  onClick,
  className,
}: AddPostButtonProps) {
  return (
    <button
      type="button"
      aria-label={`Add a post on ${when}`}
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      className={cn(
        "absolute top-xxs right-xxs flex size-5 items-center justify-center rounded-control text-imagine-foreground-muted opacity-0 transition-[opacity,color,background-color] group-hover/cell:opacity-100 hover:bg-imagine-foreground/8 hover:text-imagine-foreground focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring/40",
        className,
      )}
    >
      <Icon name="plus" size="s" />
    </button>
  );
}
