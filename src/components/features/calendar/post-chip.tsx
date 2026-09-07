"use client";

import { cn } from "cn";
import { motion } from "motion/react";

import { Icon } from "@/components/ui/icon";
import { hoverLift, press } from "@/styles/motion";

export type PostChipStatus = "draft" | "scheduled" | "published" | "failed";

export interface PostChipData {
  id: string;
  title: string;
  /** "9:00". */
  time: string;
  /** Short profile label, e.g. initials or first name. */
  profile: string;
  status: PostChipStatus;
}

interface PostChipProps {
  post: PostChipData;
  /** `dense` for the two-week strip and the composer preview. */
  dense?: boolean;
  selected?: boolean;
  onOpen?: (post: PostChipData) => void;
  className?: string;
}

/**
 * A post inside a calendar cell. Scheduled chips carry the accent gradient.
 * Other statuses stay on the surface with a left-edge mark. No badges.
 */
export function PostChip({
  post,
  dense = false,
  selected = false,
  onOpen,
  className,
}: PostChipProps) {
  const scheduled = post.status === "scheduled";

  return (
    <motion.button
      type="button"
      whileTap={press.whileTap}
      whileHover={hoverLift.whileHover}
      transition={press.transition}
      onClick={() => onOpen?.(post)}
      data-slot="post-chip"
      data-status={post.status}
      aria-label={`${post.title}, ${post.time}, ${post.profile}, ${post.status}`}
      className={cn(
        "relative flex w-full min-w-0 flex-col gap-xxs overflow-hidden rounded-control text-left outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
        dense ? "px-s py-xs" : "px-s py-s pl-m",
        scheduled
          ? "chip-gradient text-imagine-foreground shadow-control"
          : post.status === "draft"
            ? "bg-imagine-surface-raised/80 text-imagine-foreground-muted"
            : "bg-imagine-surface shadow-control",
        selected && "ring-2 ring-imagine-secondary/50",
        className,
      )}
    >
      {scheduled ? null : (
        <span
          aria-hidden="true"
          className={cn(
            "absolute inset-y-xs left-0 w-0.5 rounded-full",
            post.status === "draft" && "bg-imagine-foreground-faint",
            post.status === "published" && "bg-imagine-foreground",
            post.status === "failed" && "bg-destructive",
          )}
        />
      )}
      <span className={cn("truncate font-medium", "type-small")}>
        {post.title}
      </span>
      {dense ? null : (
        <span className="flex items-center gap-xs type-small text-imagine-foreground-muted">
          <span className="tabular-nums">{post.time}</span>
          <span aria-hidden="true">·</span>
          <span className="truncate">{post.profile}</span>
          {post.status === "published" ? (
            <Icon name="check" size="s" className="ml-auto" />
          ) : null}
          {post.status === "failed" ? (
            <Icon
              name="triangle-exclamation"
              size="s"
              className="ml-auto text-destructive"
            />
          ) : null}
        </span>
      )}
    </motion.button>
  );
}
