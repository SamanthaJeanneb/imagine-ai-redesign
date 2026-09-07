"use client";

import { cn } from "cn";
import { motion } from "motion/react";
import type { CSSProperties } from "react";

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

const CHIP_COLOR = {
  draft: "var(--imagine-foreground-muted)",
  scheduled: "var(--imagine-secondary)",
  published: "var(--imagine-foreground)",
  failed: "var(--destructive)",
} as const satisfies Record<PostChipStatus, string>;

/** Exposes the status color to `chip-wash` and the rail as `--chip-color`. */
function chipStyle(status: PostChipStatus): CSSProperties {
  const style: CSSProperties & { "--chip-color": string } = {
    "--chip-color": CHIP_COLOR[status],
  };
  return style;
}

/**
 * A post inside a calendar cell. Every status uses a solid left rail and a
 * wash that fades to the surface. Color is the only status signal. No badges.
 */
export function PostChip({
  post,
  dense = false,
  selected = false,
  onOpen,
  className,
}: PostChipProps) {
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
      style={chipStyle(post.status)}
      className={cn(
        "relative flex w-full min-w-0 flex-col gap-xxs overflow-hidden rounded-control text-left shadow-control outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
        "chip-wash text-imagine-secondary-foreground",
        dense ? "px-s py-xs pl-m" : "px-s py-s pl-m",
        selected && "ring-2 ring-imagine-secondary/50",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="absolute inset-y-0 left-0 w-1.5 bg-[var(--chip-color)]"
      />
      <span className={cn("truncate font-medium", "type-small")}>
        {post.title}
      </span>
      {dense ? null : (
        <span className="flex items-center gap-xs type-small text-imagine-secondary-foreground/75">
          <span className="tabular-nums">{post.time}</span>
          <span aria-hidden="true">·</span>
          <span className="truncate">{post.profile}</span>
          {post.status === "published" ? (
            <Icon name="check" size="s" className="ml-auto" />
          ) : null}
          {post.status === "failed" ? (
            <Icon name="triangle-exclamation" size="s" className="ml-auto" />
          ) : null}
        </span>
      )}
    </motion.button>
  );
}
