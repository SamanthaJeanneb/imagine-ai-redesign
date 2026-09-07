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

/** Status color, and the text color that reads on it when the chip is solid. */
const CHIP = {
  draft: {
    color: "var(--imagine-foreground-muted)",
    contrast: "var(--imagine-surface)",
  },
  scheduled: {
    color: "var(--imagine-secondary)",
    contrast: "var(--imagine-secondary-foreground)",
  },
  published: {
    color: "var(--imagine-foreground)",
    contrast: "var(--imagine-surface)",
  },
  failed: { color: "var(--destructive)", contrast: "#ffffff" },
} as const satisfies Record<
  PostChipStatus,
  { color: string; contrast: string }
>;

/** Exposes the status colors to `chip-wash`, `chip-solid`, and the rail. */
function chipStyle(status: PostChipStatus): CSSProperties {
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
 * light wash that fades to the surface, with regular text on top. Selecting a
 * chip fills it solid in its status color and lifts it. Color is the only
 * status signal. No badges.
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
      data-selected={selected || undefined}
      aria-current={selected ? "true" : undefined}
      aria-label={`${post.title}, ${post.time}, ${post.profile}, ${post.status}`}
      style={chipStyle(post.status)}
      className={cn(
        "relative flex w-full min-w-0 flex-col gap-xxs overflow-hidden rounded-control text-left transition-[box-shadow,color] outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-1 focus-visible:ring-offset-imagine-surface",
        selected
          ? "chip-solid text-[var(--chip-contrast)] shadow-raised"
          : "chip-wash text-imagine-foreground shadow-control",
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
            selected ? "opacity-80" : "text-imagine-foreground-muted",
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
}
