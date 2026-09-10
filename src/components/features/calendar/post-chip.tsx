"use client";

import { cn } from "cn";
import { motion } from "motion/react";
import type { CSSProperties } from "react";

import {
  LinkedInPost,
  type LinkedInPostContent,
} from "@/components/features/agent/linkedin-post-draft";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Icon } from "@/components/ui/icon";
import { hoverLift, press } from "@/styles/motion";
import type { TagTone } from "@/styles/tokens";

export type PostChipStatus = "draft" | "scheduled" | "published" | "failed";

export type PostChipTone = TagTone;

export interface PostChipData {
  id: string;
  /** The first line of the post, for search results, rows, and labels. */
  title: string;
  /** "9:00". */
  time: string;
  /** Short profile label, e.g. initials or first name. */
  profile: string;
  status: PostChipStatus;
  /** The post's label, e.g. "Case study". Shown under the name. */
  label?: string;
  /** Which of the label accents colors the chip. Falls back to status. */
  tone?: PostChipTone;
  /** When present, hovering the chip previews the post as it will appear. */
  preview?: LinkedInPostContent;
}

export type PostChipLines = 1 | 2 | 3 | 4;

interface PostChipProps {
  post: PostChipData;
  /**
   * `dense` for short cells: the composer preview and the week view. Drops
   * the label and time lines so the name and the post itself get the room.
   */
  dense?: boolean;
  /** How many lines of the post to show before it clips. */
  lines?: PostChipLines;
  selected?: boolean;
  onOpen?: (post: PostChipData) => void;
  className?: string;
}

interface ChipColor {
  color: string;
  /** Text color that reads on the color when the chip is solid. */
  contrast: string;
  /** The wash is already too deep for foreground text. */
  darkWash: boolean;
}

/** What a chip falls back to when the post has no label. */
const STATUS_COLOR = {
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
} as const satisfies Record<PostChipStatus, ChipColor>;

function chipColor(status: PostChipStatus, tone?: PostChipTone): ChipColor {
  if (tone === undefined) return STATUS_COLOR[status];
  return {
    color: `var(--imagine-tag-${String(tone)})`,
    contrast: "var(--imagine-secondary-foreground)",
    darkWash: false,
  };
}

/**
 * Exposes the chip's colors as `--chip-color` and `--chip-contrast` for
 * `chip-wash`, `chip-solid`, the rail, and anything else that echoes a post.
 * Labelled posts take their label's tone; the rest take their status color.
 */
export function postChipStyle(
  status: PostChipStatus,
  tone?: PostChipTone,
): CSSProperties {
  const { color, contrast } = chipColor(status, tone);
  const style: CSSProperties & {
    "--chip-color": string;
    "--chip-contrast": string;
  } = {
    "--chip-color": color,
    "--chip-contrast": contrast,
  };
  return style;
}

const LINE_CLAMP: Record<PostChipLines, string> = {
  1: "line-clamp-1",
  2: "line-clamp-2",
  3: "line-clamp-3",
  4: "line-clamp-4",
};

/** The post as one run of text, so the clamp measures lines, not paragraphs. */
function toExcerpt(post: PostChipData): string {
  const body = post.preview?.body ?? post.title;
  return body
    .replace(/^draft:\s*/i, "")
    .split(/\s*\n+\s*/)
    .filter((line) => line !== "")
    .join(" ");
}

/**
 * A post inside a calendar cell, laid out like a card: who it goes out from,
 * the label, as much of the post as the cell allows, and the time. Every chip
 * has a solid left rail and a gradient wash of its color, deepest at the rail.
 * The color is the label's tone, so a month reads as a mix of what is going
 * out rather than a wall of one accent. Status is a glyph beside the name:
 * a check once published, a warning when it failed, a dashed edge on drafts.
 * Selecting a chip fills it solid in its color and lifts it.
 */
export function PostChip({
  post,
  dense = false,
  lines = dense ? 2 : 3,
  selected = false,
  onOpen,
  className,
}: PostChipProps) {
  const inverted = selected || chipColor(post.status, post.tone).darkWash;
  const author = post.preview?.author;
  const muted = inverted ? "opacity-80" : "text-imagine-foreground-muted";
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
      style={postChipStyle(post.status, post.tone)}
      className={cn(
        "relative flex w-full min-w-0 flex-col gap-xxs overflow-hidden rounded-control px-s py-xs pl-m text-left transition-[box-shadow,color] outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-1 focus-visible:ring-offset-imagine-surface",
        // In a narrow cell (the chat column's composer preview) the chip
        // keeps only the avatar and the excerpt, and pulls its padding in.
        // The cell is the `chip` container; see the calendar grids.
        "@max-[6rem]/chip:pr-xs @max-[6rem]/chip:pl-s",
        selected ? "chip-solid shadow-raised" : "chip-wash shadow-control",
        inverted ? "text-[var(--chip-contrast)]" : "text-imagine-foreground",
        post.status === "draft" &&
          !selected &&
          "border border-dashed border-[var(--chip-color)]",
        className,
      )}
    >
      {selected ? null : (
        <span
          aria-hidden="true"
          className="absolute inset-y-0 left-0 w-1.5 bg-[var(--chip-color)]"
        />
      )}
      <span className="flex min-w-0 items-center gap-xs">
        {author?.avatarUrl === undefined ? null : (
          <Avatar
            shape={author.kind === "company" ? "square" : "circle"}
            className="size-4"
          >
            <AvatarImage src={author.avatarUrl} alt="" />
          </Avatar>
        )}
        <span className="min-w-0 flex-1 truncate type-caption font-semibold @max-[6rem]/chip:hidden">
          {post.profile}
        </span>
        {post.status === "published" ? (
          <Icon
            name="check"
            size="s"
            className={cn("shrink-0 @max-[6rem]/chip:hidden", muted)}
          />
        ) : null}
        {post.status === "failed" ? (
          <Icon
            name="triangle-exclamation"
            size="s"
            className={cn(
              "shrink-0 @max-[6rem]/chip:hidden",
              inverted ? "opacity-80" : "text-destructive",
            )}
          />
        ) : null}
      </span>
      {dense || post.label === undefined ? null : (
        <span className={cn("truncate type-caption italic", muted)}>
          {post.label}
        </span>
      )}
      <span className={cn("type-caption wrap-anywhere", LINE_CLAMP[lines])}>
        {toExcerpt(post)}
      </span>
      {dense ? null : (
        <span className={cn("type-caption tabular-nums", muted)}>
          {post.time}
        </span>
      )}
    </motion.button>
  );

  if (!post.preview) return chip;

  return (
    <HoverCard>
      <HoverCardTrigger asChild>{chip}</HoverCardTrigger>
      <HoverCardContent
        aria-label={`Preview of ${post.title}`}
        className="w-96"
      >
        <LinkedInPost
          {...post.preview}
          timestamp={post.time}
          className="shadow-none"
        />
      </HoverCardContent>
    </HoverCard>
  );
}
