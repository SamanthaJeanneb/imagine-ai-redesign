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

export type PostChipStatus =
  "draft" | "in_review" | "scheduled" | "published" | "failed";

export interface PostEngagementPerson {
  id: string;
  name: string;
  headline: string;
  avatarUrl?: string;
}

export interface PostEngagementComment {
  id: string;
  author: PostEngagementPerson;
  body: string;
  when: string;
}

export interface PostEngagement {
  reactors: readonly (PostEngagementPerson & { reaction: string })[];
  comments: readonly PostEngagementComment[];
}

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
  /** When present, hovering the chip previews the post as it will appear. */
  preview?: LinkedInPostContent;
  /** Captured LinkedIn people and comments, available after publishing. */
  engagement?: PostEngagement;
}

export type PostChipLines = 1 | 2 | 3 | 4;

export interface PostOpenOptions {
  /** Open without activating, like a browser tab opened with Command-click. */
  background?: boolean;
}

interface PostChipProps {
  post: PostChipData;
  /**
   * `dense` for short cells: the composer preview and the week view. Drops
   * the label and time lines so the name and the post itself get the room.
   */
  dense?: boolean;
  /**
   * One line: the rail, the avatar, and the start of the post, truncated. For
   * a cell with no height to spare; the hover card still shows the whole post.
   */
  line?: boolean;
  /** How many lines of the post to show before it clips. */
  lines?: PostChipLines;
  selected?: boolean;
  onOpen?: (post: PostChipData, options?: PostOpenOptions) => void;
  className?: string;
}

interface ChipColor {
  color: string;
  /** Text color that reads on the color when the chip is solid. */
  contrast: string;
  /** The wash is already too deep for foreground text. */
  darkWash: boolean;
}

/**
 * Color is status: rose for scheduled, dusty blue for in review, sage for
 * published. Draft and failed stay muted and destructive so they still read
 * as unfinished or broken.
 */
const STATUS_COLOR = {
  draft: {
    color: "var(--imagine-foreground-muted)",
    contrast: "var(--imagine-surface)",
    darkWash: false,
  },
  in_review: {
    color: "var(--imagine-tag-3)",
    contrast: "var(--imagine-secondary-foreground)",
    darkWash: false,
  },
  scheduled: {
    color: "var(--imagine-secondary)",
    contrast: "var(--imagine-secondary-foreground)",
    darkWash: false,
  },
  published: {
    color: "var(--imagine-tag-2)",
    contrast: "var(--imagine-secondary-foreground)",
    darkWash: false,
  },
  failed: {
    color: "var(--destructive)",
    contrast: "var(--imagine-secondary-foreground)",
    darkWash: false,
  },
} as const satisfies Record<PostChipStatus, ChipColor>;

/**
 * Exposes the chip's colors as `--chip-color` and `--chip-contrast` for
 * `chip-wash`, `chip-solid`, the rail, and anything else that echoes a post.
 */
export function postChipStyle(status: PostChipStatus): CSSProperties {
  const { color, contrast } = STATUS_COLOR[status];
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
 * The color is the post's status, so a month reads as scheduled, in review,
 * or published at a glance. A check once published, a warning when it failed,
 * a dashed edge on drafts. Selecting a chip fills it solid and lifts it.
 */
export function PostChip({
  post,
  dense = false,
  line = false,
  lines = dense ? 2 : 3,
  selected = false,
  onOpen,
  className,
}: PostChipProps) {
  const inverted = selected || STATUS_COLOR[post.status].darkWash;
  const author = post.preview?.author;
  const muted = inverted ? "opacity-80" : "text-imagine-foreground-muted";
  const avatar =
    author?.avatarUrl === undefined ? null : (
      <Avatar
        shape={author.kind === "company" ? "square" : "circle"}
        className="size-4"
      >
        <AvatarImage src={author.avatarUrl} alt="" />
      </Avatar>
    );
  // In review has no glyph: its color says so.
  const statusIcon =
    post.status === "published" ? (
      <Icon
        name="check"
        size="s"
        className={cn("shrink-0 @max-[6rem]/chip:hidden", muted)}
      />
    ) : post.status === "failed" ? (
      <Icon
        name="triangle-exclamation"
        size="s"
        className={cn(
          "shrink-0 @max-[6rem]/chip:hidden",
          inverted ? "opacity-80" : "text-destructive",
        )}
      />
    ) : null;
  const chip = (
    <motion.button
      type="button"
      whileTap={press.whileTap}
      whileHover={hoverLift.whileHover}
      transition={press.transition}
      onClick={(event) => {
        onOpen?.(post, {
          background: event.metaKey || event.ctrlKey,
        });
      }}
      data-slot="post-chip"
      data-status={post.status}
      data-selected={selected || undefined}
      aria-current={selected ? "true" : undefined}
      aria-label={`${post.title}, ${post.time}, ${post.profile}, ${post.status}`}
      style={postChipStyle(post.status)}
      className={cn(
        "relative flex w-full min-w-0 overflow-hidden rounded-control px-s pl-m text-left transition-[box-shadow,color] outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-1 focus-visible:ring-offset-imagine-surface",
        line ? "items-center gap-xs py-xxs" : "flex-col gap-xxs py-xs",
        // In a narrow cell (the chat column's composer preview) the chip
        // keeps only the avatar and the excerpt, and pulls its padding in.
        // The cell is the `chip` container; see the calendar grids.
        "@max-[6rem]/chip:pl-s",
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
      {line ? (
        <>
          {avatar}
          <span className="min-w-0 flex-1 truncate type-caption">
            {toExcerpt(post)}
          </span>
          {statusIcon}
        </>
      ) : (
        <>
          <span className="flex min-w-0 items-center gap-xs">
            {avatar}
            <span className="min-w-0 flex-1 truncate type-caption font-semibold @max-[6rem]/chip:hidden">
              {post.profile}
            </span>
            {statusIcon}
          </span>
          {dense || post.label === undefined ? null : (
            <span className={cn("truncate type-caption italic", muted)}>
              {post.label}
            </span>
          )}
          <span className={cn("type-caption break-words", LINE_CLAMP[lines])}>
            {toExcerpt(post)}
          </span>
          {dense ? null : (
            <span className={cn("type-caption tabular-nums", muted)}>
              {post.time}
            </span>
          )}
        </>
      )}
    </motion.button>
  );

  if (!post.preview) return chip;

  return (
    <HoverCard>
      <HoverCardTrigger asChild>{chip}</HoverCardTrigger>
      <HoverCardContent
        aria-label={`Preview of ${post.title}`}
        className="w-[32rem]"
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
