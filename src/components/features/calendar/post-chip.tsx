"use client";

import { cn } from "cn";
import type { CSSProperties, ReactNode } from "react";

import { LinkedInPost } from "@/components/features/agent/linkedin-post-draft";
import {
  ChipHoverCard,
  ChipRail,
  ChipShell,
  chipStyle,
} from "@/components/features/calendar/chip-shell";
import { Icon } from "@/components/ui/icon";
import { PersonAvatar } from "@/components/ui/person-avatar";
import type { PostChipData, PostChipStatus } from "@/entities/post";

/** Re-exported for the components that already reach for it here. */
export type { PostChipData };

export type PostChipLines = 1 | 2 | 3 | 4;

export interface PostOpenOptions {
  /** Open without activating, like a browser tab opened with Command-click. */
  background?: boolean;
}

export interface PostChipBaseProps {
  post: PostChipData;
  selected?: boolean;
  onOpen?: (post: PostChipData, options?: PostOpenOptions) => void;
  className?: string;
}

interface PostChipProps extends PostChipBaseProps {
  /** How many lines of the post to show before it clips. */
  lines?: PostChipLines;
}

interface ChipColor {
  color: string;
  /** Text color that reads on the color when the chip is solid. */
  contrast: string;
}

/**
 * Color is status: rose for scheduled, blue for in review, green for
 * published, yellow for a draft still being written. Failed stays
 * destructive so it reads as broken. Events take the fifth color, plum.
 */
const STATUS_COLOR = {
  draft: {
    color: "var(--imagine-tag-4)",
    contrast: "var(--imagine-foreground)",
  },
  in_review: {
    color: "var(--imagine-tag-3)",
    contrast: "var(--imagine-secondary-foreground)",
  },
  scheduled: {
    color: "var(--imagine-secondary)",
    contrast: "var(--imagine-secondary-foreground)",
  },
  published: {
    color: "var(--imagine-tag-2)",
    contrast: "var(--imagine-secondary-foreground)",
  },
  failed: {
    color: "var(--destructive)",
    contrast: "var(--imagine-secondary-foreground)",
  },
} as const satisfies Record<PostChipStatus, ChipColor>;

/**
 * What each status is called wherever a post's state is spelled out: the
 * hover preview's pill, the editor's header, its status buttons. The words
 * follow the timeline's, so the same post reads the same everywhere.
 */
export const POST_STATUS_LABEL: Record<PostChipStatus, string> = {
  draft: "Draft",
  in_review: "In review",
  scheduled: "Scheduled",
  published: "Published",
  failed: "Failed",
};

/** A post's status as the `--chip-color` / `--chip-contrast` pair. */
export function postChipStyle(status: PostChipStatus): CSSProperties {
  const { color, contrast } = STATUS_COLOR[status];
  return chipStyle(color, contrast);
}

/**
 * The post's status as a pill: its name on a wash of the status color, so it
 * matches the chip that opened the preview. Sits in the LinkedIn card's
 * actor row, where the feed's menu would be.
 */
export function PostStatusPill({
  status,
  className,
}: {
  status: PostChipStatus;
  className?: string;
}) {
  return (
    <span
      data-slot="post-status-pill"
      data-status={status}
      style={postChipStyle(status)}
      className={cn(
        "inline-flex h-6 shrink-0 items-center rounded-full chip-wash px-s type-caption font-medium whitespace-nowrap text-imagine-foreground",
        className,
      )}
    >
      {POST_STATUS_LABEL[status]}
    </span>
  );
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

/** The muted text treatment: dimmed on a solid chip, muted on a wash. */
function mutedClass(selected: boolean): string {
  return selected ? "opacity-80" : "text-imagine-foreground-muted";
}

/** The author's picture, when the post knows who it goes out as. */
function PostChipAvatar({ post }: { post: PostChipData }) {
  const author = post.preview?.author;
  if (author === undefined) return null;
  return (
    <PersonAvatar
      name={author.name}
      avatarUrl={author.avatarUrl}
      shape={author.kind === "company" ? "square" : "circle"}
      size="sm"
      className="size-4"
    />
  );
}

/** A check once published, a warning when it failed. In review has no glyph: its color says so. */
function PostChipStatusIcon({
  post,
  selected,
}: {
  post: PostChipData;
  selected: boolean;
}) {
  if (post.status === "published") {
    return (
      <Icon
        name="check"
        size="s"
        className={cn("shrink-0 @max-[6rem]/chip:hidden", mutedClass(selected))}
      />
    );
  }
  if (post.status === "failed") {
    return (
      <Icon
        name="triangle-exclamation"
        size="s"
        className={cn(
          "shrink-0 @max-[6rem]/chip:hidden",
          selected ? "opacity-80" : "text-destructive",
        )}
      />
    );
  }
  return null;
}

/**
 * The chip's chrome, shared by every variant: the shell filled with a pastel
 * wash of the post's status and a solid rail of it at the left, so a month
 * reads as scheduled, in review, or published at a glance. Selecting a chip
 * fills it solid and lifts it. When the post has a preview, hovering the chip
 * shows it as it will appear on LinkedIn.
 */
function PostChipButton({
  post,
  selected = false,
  onOpen,
  className,
  children,
}: PostChipBaseProps & { children: ReactNode }) {
  const chip = (
    <ChipShell
      onClick={(event) => {
        onOpen?.(post, {
          background: event.metaKey || event.ctrlKey,
        });
      }}
      data-slot="post-chip"
      data-status={post.status}
      data-selected={selected || undefined}
      aria-current={selected ? "true" : undefined}
      aria-label={`${post.title}, ${post.time}, ${post.profile}, ${POST_STATUS_LABEL[post.status]}`}
      style={postChipStyle(post.status)}
      className={cn(
        "transition-[box-shadow,color]",
        selected
          ? "chip-solid text-[var(--chip-contrast)] shadow-raised"
          : "chip-wash text-imagine-foreground",
        className,
      )}
    >
      {selected ? null : <ChipRail />}
      {children}
    </ChipShell>
  );

  if (!post.preview) return chip;

  return (
    <ChipHoverCard
      chip={chip}
      label={`Preview of ${post.title}`}
      className="w-[32rem]"
    >
      <LinkedInPost
        {...post.preview}
        timestamp={post.time}
        marker={<PostStatusPill status={post.status} />}
        className="shadow-none"
      />
    </ChipHoverCard>
  );
}

/** The card's first line: the avatar, who it goes out as, and the status glyph. */
function PostChipHeader({
  post,
  selected,
}: {
  post: PostChipData;
  selected: boolean;
}) {
  return (
    <span className="flex min-w-0 items-center gap-xs">
      <PostChipAvatar post={post} />
      <span className="min-w-0 flex-1 truncate type-caption font-semibold @max-[6rem]/chip:hidden">
        {post.profile}
      </span>
      <PostChipStatusIcon post={post} selected={selected} />
    </span>
  );
}

/**
 * A post inside a calendar cell, laid out like a card: who it goes out from,
 * the label, as much of the post as the cell allows, and the time.
 */
export function PostChip({
  post,
  lines = 3,
  selected = false,
  onOpen,
  className,
}: PostChipProps) {
  const muted = mutedClass(selected);
  return (
    <PostChipButton
      post={post}
      selected={selected}
      onOpen={onOpen}
      className={cn("flex-col gap-xxs py-xs", className)}
    >
      <PostChipHeader post={post} selected={selected} />
      {post.labels?.[0] === undefined ? null : (
        <span className={cn("truncate type-caption italic", muted)}>
          {post.labels[0]}
        </span>
      )}
      <span className={cn("type-caption break-words", LINE_CLAMP[lines])}>
        {toExcerpt(post)}
      </span>
      <span className={cn("type-caption tabular-nums", muted)}>
        {post.time}
      </span>
    </PostChipButton>
  );
}

/**
 * The card for short cells: the composer preview and the week view. Drops
 * the label and time lines so the name and the post itself get the room.
 */
export function PostChipDense({
  post,
  lines = 2,
  selected = false,
  onOpen,
  className,
}: PostChipProps) {
  return (
    <PostChipButton
      post={post}
      selected={selected}
      onOpen={onOpen}
      className={cn("flex-col gap-xxs py-xs", className)}
    >
      <PostChipHeader post={post} selected={selected} />
      <span className={cn("type-caption break-words", LINE_CLAMP[lines])}>
        {toExcerpt(post)}
      </span>
    </PostChipButton>
  );
}

/**
 * One line: the rail, the avatar, and the start of the post, truncated. For
 * a cell with no height to spare; the hover card still shows the whole post.
 */
export function PostChipLine({
  post,
  selected = false,
  onOpen,
  className,
}: PostChipBaseProps) {
  return (
    <PostChipButton
      post={post}
      selected={selected}
      onOpen={onOpen}
      className={cn("items-center gap-xs py-xxs", className)}
    >
      <PostChipAvatar post={post} />
      <span className="min-w-0 flex-1 truncate type-caption">
        {toExcerpt(post)}
      </span>
      <PostChipStatusIcon post={post} selected={selected} />
    </PostChipButton>
  );
}
