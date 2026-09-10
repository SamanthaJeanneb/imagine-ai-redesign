"use client";

import { cn } from "cn";
import { motion } from "motion/react";
import type { CSSProperties } from "react";

import {
  LinkedInPost,
  type LinkedInPostContent,
} from "@/components/features/agent/linkedin-post-draft";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
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
  /** When present, hovering the chip previews the post as it will appear. */
  preview?: LinkedInPostContent;
}

interface PostChipProps {
  post: PostChipData;
  /** `dense` for the composer preview, where cells are too short for two lines. */
  dense?: boolean;
  selected?: boolean;
  onOpen?: (post: PostChipData) => void;
  className?: string;
}

/**
 * Status color, the text color that reads on it when the chip is solid, and
 * whether the wash is already too deep for foreground text (`darkWash`).
 */
const CHIP = {
  draft: {
    color: "var(--imagine-foreground-muted)",
    contrast: "var(--imagine-surface)",
    darkWash: false,
  },
  scheduled: {
    color: "var(--imagine-secondary)",
    contrast: "var(--imagine-secondary-foreground)",
    darkWash: false,
  },
  published: {
    color: "var(--imagine-foreground)",
    contrast: "var(--imagine-surface)",
    darkWash: true,
  },
  failed: {
    color: "var(--destructive)",
    contrast: "var(--imagine-secondary-foreground)",
    darkWash: false,
  },
} as const satisfies Record<
  PostChipStatus,
  { color: string; contrast: string; darkWash: boolean }
>;

/**
 * Exposes the status colors as `--chip-color` and `--chip-contrast` for
 * `chip-wash`, `chip-solid`, the rail, and anything else that echoes a post.
 */
export function postChipStyle(status: PostChipStatus): CSSProperties {
  const style: CSSProperties & {
    "--chip-color": string;
    "--chip-contrast": string;
  } = {
    "--chip-color": CHIP[status].color,
    "--chip-contrast": CHIP[status].contrast,
  };
  return style;
}

/**
 * A post inside a calendar cell. Every status uses a solid left rail and a
 * gradient wash of its color, deepest at the rail. Light washes (draft,
 * scheduled, failed) take foreground text; the published wash is dark enough
 * to take contrast text. Selecting a chip fills it solid in its status color
 * and lifts it. Color is the only status signal. No badges.
 */
export function PostChip({
  post,
  dense = false,
  selected = false,
  onOpen,
  className,
}: PostChipProps) {
  const inverted = selected || CHIP[post.status].darkWash;
  const chip = (
    <motion.button
      type="button"
      whileTap={press.whileTap}
      whileHover={hoverLift.whileHover}
      transition={press.transition}
      onClick={() => onOpen?.(post)}
      data-slot="post-chip"
      data-status={post.status}
      data-selected={selected || undefined}
      aria-current={selected ? "true" : undefined}
      aria-label={`${post.title}, ${post.time}, ${post.profile}, ${post.status}`}
      style={postChipStyle(post.status)}
      className={cn(
        "relative flex w-full min-w-0 flex-col gap-xxs overflow-hidden rounded-control text-left transition-[box-shadow,color] outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-1 focus-visible:ring-offset-imagine-surface",
        selected ? "chip-solid shadow-raised" : "chip-wash shadow-control",
        inverted ? "text-[var(--chip-contrast)]" : "text-imagine-foreground",
        dense ? "px-s py-xs pl-m" : "px-s py-s pl-m",
        className,
      )}
    >
      {selected ? null : (
        <span
          aria-hidden="true"
          className="absolute inset-y-0 left-0 w-1.5 bg-[var(--chip-color)]"
        />
      )}
      <span className="truncate type-small font-medium">{post.title}</span>
      {dense ? null : (
        <span
          className={cn(
            "flex items-center gap-xs type-small",
            inverted ? "opacity-80" : "text-imagine-foreground-muted",
          )}
        >
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

  if (!post.preview) return chip;

  return (
    <HoverCard>
      <HoverCardTrigger asChild>{chip}</HoverCardTrigger>
      <HoverCardContent aria-label={`Preview of ${post.title}`}>
        <LinkedInPost
          {...post.preview}
          timestamp={post.time}
          className="p-m shadow-none"
        />
      </HoverCardContent>
    </HoverCard>
  );
}
