"use client";

import { cn } from "cn";
import { motion } from "motion/react";
import { useState } from "react";

import {
  AssetTile,
  type AssetTileData,
} from "@/components/features/files/asset-tile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Icon, type IconName } from "@/components/ui/icon";
import { spring } from "@/styles/motion";

export interface PostAuthor {
  name: string;
  headline: string;
  avatarUrl?: string;
  /** Company pages get a square avatar, as on LinkedIn. Default `person`. */
  kind?: "person" | "company";
}

/** Counts LinkedIn reports back after a post goes out. */
export interface LinkedInPostStats {
  reactions: number;
  comments: number;
  reposts: number;
  impressions?: number;
}

/** Everything needed to render a post the way LinkedIn will. */
export interface LinkedInPostContent {
  author: PostAuthor;
  body: string;
  media?: readonly AssetTileData[];
  /** Present once the post has gone out and LinkedIn has reported back. */
  stats?: LinkedInPostStats;
}

interface LinkedInPostProps extends LinkedInPostContent {
  /** "Now", "2h", "1mo", or a scheduled time like "Tue 9:00". */
  timestamp?: string;
  /** Changed after it went out: "1mo · Edited". */
  edited?: boolean;
  /** The viewer wrote it: "· You" after the name, as LinkedIn marks your own. */
  you?: boolean;
  /**
   * Whether the whole body shows. LinkedIn folds a long post behind "…more";
   * pressing it unfolds. Uncontrolled and folded when omitted.
   */
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  /** Turns the body into an editable field. */
  editing?: boolean;
  onBodyChange?: (body: string) => void;
  className?: string;
}

interface LinkedInPostDraftProps extends Omit<
  LinkedInPostProps,
  "timestamp" | "expanded" | "onExpandedChange"
> {
  /** Actions rendered under the post (Schedule, Edit, Regenerate). */
  footer?: React.ReactNode;
}

/** LinkedIn's own colors, for the parts of the card that are LinkedIn's. */
const LINKEDIN_BLUE = "#0a66c2";
const REACTION_LIKE = "#378fe9";
const REACTION_LOVE = "#df704d";

/**
 * Where LinkedIn folds a post: about two lines of the feed before "…more",
 * or three lines of the source with blank lines counted, whichever is first.
 */
const FOLD_CHARS = 140;
const FOLD_LINES = 3;

const ACTIONS: readonly {
  icon: IconName;
  label: string;
  count?: keyof Omit<LinkedInPostStats, "impressions">;
}[] = [
  { icon: "thumbs-up", label: "Like", count: "reactions" },
  { icon: "comment", label: "Comment", count: "comments" },
  { icon: "arrows-rotate", label: "Repost", count: "reposts" },
  { icon: "paper-plane", label: "Send" },
];

const COUNT = new Intl.NumberFormat("en-US");

function initials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

/**
 * The part of the body that shows before "…more". Cuts at the fold length,
 * on a word, or after the third line, whichever comes first.
 */
export function foldBody(body: string): { shown: string; folded: boolean } {
  let lineLimit = -1;
  let breaks = 0;
  for (let i = 0; i < body.length; i++) {
    if (body.charCodeAt(i) !== 10) continue;
    breaks++;
    if (breaks === FOLD_LINES) {
      lineLimit = i;
      break;
    }
  }
  const limit = Math.min(
    FOLD_CHARS,
    lineLimit === -1 ? Number.POSITIVE_INFINITY : lineLimit,
  );
  if (body.length <= limit) return { shown: body, folded: false };
  const cut = body.slice(0, limit);
  const word = cut.lastIndexOf(" ");
  return {
    shown: (word > limit / 2 ? cut.slice(0, word) : cut).trimEnd(),
    folded: true,
  };
}

/**
 * A post rendered the way it will look on LinkedIn: avatar, name with the
 * LinkedIn mark, headline, when and where; the body folded behind "…more";
 * media edge to edge; then one row of actions with their counts and the
 * reactions it drew, and the impressions line once it has gone out. Used for
 * drafts in the thread and for the hover preview on calendar chips.
 */
export function LinkedInPost({
  author,
  body,
  media = [],
  stats,
  timestamp = "Now",
  edited = false,
  you = false,
  expanded: expandedProp,
  onExpandedChange,
  editing = false,
  onBodyChange,
  className,
}: LinkedInPostProps) {
  const [expandedState, setExpandedState] = useState(false);
  const expanded = expandedProp ?? expandedState;
  const setExpanded = (next: boolean) => {
    setExpandedState(next);
    onExpandedChange?.(next);
  };
  const fold = foldBody(body);
  const folded = !expanded && fold.folded;

  return (
    <motion.article
      layout
      transition={spring.settle}
      data-slot="linkedin-post"
      className={cn(
        "flex flex-col overflow-hidden rounded-panel bg-imagine-surface shadow-raised transition-shadow",
        editing && "ring-2 ring-ring/30",
        className,
      )}
    >
      <header className="flex items-start gap-s px-l pt-l">
        <Avatar
          size="lg"
          shape={author.kind === "company" ? "square" : "circle"}
        >
          {author.avatarUrl ? (
            <AvatarImage src={author.avatarUrl} alt={author.name} />
          ) : null}
          <AvatarFallback>{initials(author.name)}</AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="flex min-w-0 items-center gap-xs type-body">
            <span className="truncate font-semibold">{author.name}</span>
            <span
              aria-label="LinkedIn"
              style={{ backgroundColor: LINKEDIN_BLUE }}
              className="flex size-3.5 shrink-0 items-center justify-center rounded-[2px] text-white"
            >
              <Icon name="linkedin-in" className="text-[8px]" />
            </span>
            {you ? (
              <span className="shrink-0 type-caption text-imagine-foreground-muted">
                · You
              </span>
            ) : null}
          </span>
          <span className="truncate type-caption text-imagine-foreground-muted">
            {author.headline}
          </span>
          <span className="inline-flex items-center gap-xxs type-caption text-imagine-foreground-muted">
            {timestamp}
            {edited ? (
              <>
                <span aria-hidden="true">·</span>
                <span>Edited</span>
              </>
            ) : null}
            <span aria-hidden="true">·</span>
            <Icon name="globe" size="s" aria-label="Anyone" />
          </span>
        </div>
        <Icon
          name="ellipsis"
          size="m"
          aria-hidden="true"
          className="mt-xxs text-imagine-foreground-muted"
        />
      </header>

      <div className="px-l pt-s">
        {editing ? (
          <textarea
            value={body}
            aria-label="Post body"
            onChange={(event) => {
              onBodyChange?.(event.target.value);
            }}
            className="field-sizing-content w-full resize-none rounded-control bg-imagine-surface-raised/60 px-s py-xs type-body outline-none"
          />
        ) : (
          <p className="type-body whitespace-pre-line">
            {folded ? fold.shown : body}
            {folded ? (
              <>
                …{" "}
                <button
                  type="button"
                  onClick={() => {
                    setExpanded(true);
                  }}
                  className="rounded-[2px] text-imagine-foreground-muted outline-none hover:text-imagine-foreground hover:underline focus-visible:ring-2 focus-visible:ring-ring/40"
                >
                  more
                </button>
              </>
            ) : null}
          </p>
        )}
      </div>

      {media.length > 0 ? (
        <div
          className={cn(
            "mt-s grid gap-px overflow-hidden",
            media.length > 1 ? "grid-cols-2" : "grid-cols-1",
          )}
        >
          {media.slice(0, 2).map((asset) => (
            <AssetTile
              key={asset.id}
              asset={asset}
              className="aspect-[4/3] rounded-none"
            />
          ))}
        </div>
      ) : null}

      {/* One row: the actions, each with its count, then the reactions it
          drew. No second like: the thumb here is both the button and the
          number. */}
      <div className="flex items-center justify-between gap-m px-l py-m">
        <div className="flex items-center gap-l">
          {ACTIONS.map((action) => {
            const count =
              action.count === undefined ? undefined : stats?.[action.count];
            return (
              <span
                key={action.label}
                aria-label={
                  count === undefined
                    ? action.label
                    : `${COUNT.format(count)} ${action.label.toLowerCase()}s`
                }
                className="inline-flex items-center gap-xs type-small font-medium text-imagine-foreground-muted tabular-nums"
              >
                <Icon name={action.icon} size="l" />
                {count === undefined ? null : COUNT.format(count)}
              </span>
            );
          })}
        </div>
        {stats !== undefined && stats.reactions > 0 ? (
          <span
            aria-hidden="true"
            className="flex shrink-0 items-center -space-x-1"
          >
            <span
              style={{ backgroundColor: REACTION_LIKE }}
              className="flex size-4 items-center justify-center rounded-full text-white ring-1 ring-imagine-surface"
            >
              <Icon name="thumbs-up" active className="text-[9px]" />
            </span>
            <span
              style={{ backgroundColor: REACTION_LOVE }}
              className="flex size-4 items-center justify-center rounded-full text-white ring-1 ring-imagine-surface"
            >
              <Icon name="heart" active className="text-[9px]" />
            </span>
          </span>
        ) : null}
      </div>

      {stats?.impressions === undefined ? null : (
        <div className="flex items-center justify-between gap-m border-t border-imagine-border px-l py-s">
          <span className="inline-flex items-center gap-xs type-small font-semibold tabular-nums">
            <Icon name="chart-simple" size="l" />
            {COUNT.format(stats.impressions)} impressions
          </span>
          <span
            style={{ color: LINKEDIN_BLUE }}
            className="type-small font-semibold"
          >
            View analytics
          </span>
        </div>
      )}
    </motion.article>
  );
}

/**
 * A draft in the thread: the post plus the actions under it. The body can be
 * edited in place. It starts unfolded, so the whole post reads, with a way to
 * see it the way the feed will cut it behind "…more".
 */
export function LinkedInPostDraft({
  footer,
  className,
  ...post
}: LinkedInPostDraftProps) {
  const [expanded, setExpanded] = useState(true);
  const foldable = foldBody(post.body).folded && !post.editing;

  return (
    <div className={cn("flex w-full max-w-lg flex-col gap-s", className)}>
      <LinkedInPost
        {...post}
        expanded={expanded}
        onExpandedChange={setExpanded}
      />
      {footer || foldable ? (
        <div className="flex flex-wrap items-center gap-xs">
          {footer}
          {foldable ? (
            <Button
              size="sm"
              variant="ghost"
              aria-pressed={!expanded}
              onClick={() => {
                setExpanded((current) => !current);
              }}
              className="ml-auto text-imagine-foreground-muted"
            >
              {expanded ? "Preview with …more" : "Show full post"}
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
