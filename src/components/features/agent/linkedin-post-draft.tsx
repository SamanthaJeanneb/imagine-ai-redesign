"use client";

import { cn } from "cn";
import { motion } from "motion/react";
import Link from "next/link";
import { useState } from "react";

import {
  AssetTile,
  type AssetTileData,
} from "@/components/features/files/asset-tile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  LinkedInReactionCluster,
  type LinkedInReactionType,
} from "@/components/features/agent/linkedin-reaction";
import { Icon, type IconName } from "@/components/ui/icon";
import { fade } from "@/styles/motion";

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
   * Sits at the trailing end of the actor row, where LinkedIn puts its menu:
   * the calendar's hover preview puts the post's status pill here.
   */
  marker?: React.ReactNode;
  /**
   * Whether the whole body shows. LinkedIn folds a long post behind "…more";
   * pressing it unfolds. Uncontrolled and folded when omitted.
   */
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  /** Turns the body into an editable field. */
  editing?: boolean;
  onBodyChange?: (body: string) => void;
  /**
   * Calendar editor: type in the body as LinkedIn shows it, without the
   * raised field used when editing a draft in chat.
   */
  plainEditing?: boolean;
  /** When set, a remove control appears on each media tile. */
  onRemoveMedia?: (id: string) => void;
  className?: string;
}

interface LinkedInPostDraftProps extends Omit<
  LinkedInPostProps,
  "timestamp" | "expanded" | "onExpandedChange"
> {
  /** Actions rendered under the post (Schedule, Edit). */
  footer?: React.ReactNode;
  /** Preview / Show full post under the card. Default on. */
  foldControl?: boolean;
}

/** The feed's overlapping trio when a post has reactions but no type breakdown. */
const FEED_REACTIONS: readonly LinkedInReactionType[] = [
  "like",
  "celebrate",
  "love",
];

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
 * LinkedIn's actor row: 48px photo, 14px name, then the 12px headline and
 * timestamp stacked with no extra gap. No Premium badge.
 */
export function LinkedInActor({
  author,
  timestamp,
  edited = false,
  you = false,
  marker,
}: {
  author: PostAuthor;
  timestamp?: string;
  edited?: boolean;
  you?: boolean;
  marker?: React.ReactNode;
}) {
  return (
    <header className="flex items-start gap-s">
      <Avatar
        className="size-12"
        shape={author.kind === "company" ? "square" : "circle"}
      >
        {author.avatarUrl ? (
          <AvatarImage src={author.avatarUrl} alt={author.name} />
        ) : null}
        <AvatarFallback>{initials(author.name)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="flex min-w-0 items-baseline gap-xs type-small font-semibold">
          <span className="truncate">{author.name}</span>
          {you ? (
            <span className="shrink-0 type-caption font-normal text-imagine-foreground-muted">
              · You
            </span>
          ) : null}
        </p>
        <p className="truncate type-caption text-imagine-foreground-muted">
          {author.headline}
        </p>
        {timestamp === undefined ? null : (
          <p className="flex items-center gap-xxs type-caption text-imagine-foreground-muted">
            {timestamp}
            {edited ? (
              <>
                <span aria-hidden="true">·</span>
                <span>Edited</span>
              </>
            ) : null}
            <span aria-hidden="true">·</span>
            <Icon name="users" size="s" aria-label="Anyone" />
          </p>
        )}
      </div>
      {marker ?? (
        <Icon
          name="ellipsis"
          size="m"
          aria-hidden="true"
          className="text-imagine-foreground-muted"
        />
      )}
    </header>
  );
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
 * A post rendered the way it will look on LinkedIn: avatar, name, headline,
 * when and who can see it; the body folded behind "…more";
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
  marker,
  expanded: expandedProp,
  onExpandedChange,
  editing = false,
  onBodyChange,
  plainEditing = false,
  onRemoveMedia,
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
    // The height change on "…more" and on entering edit is a short ease-out,
    // not a spring: nothing overshoots and nothing keeps settling. What sits
    // under the body slides down with `layout="position"` instead of being
    // stretched by the card's own size animation.
    <motion.article
      layout
      layoutDependency={`${String(expanded)}:${String(editing)}`}
      transition={fade.base}
      data-slot="linkedin-post"
      className={cn(
        "flex flex-col overflow-hidden rounded-panel bg-imagine-surface shadow-raised transition-shadow",
        editing && !plainEditing && "ring-2 ring-ring/30",
        className,
      )}
    >
      <div className="px-l pt-l">
        <LinkedInActor
          author={author}
          timestamp={timestamp}
          edited={edited}
          you={you}
          marker={marker}
        />
      </div>

      <div className="px-l pt-s">
        {editing ? (
          <textarea
            value={body}
            aria-label="Post body"
            onChange={(event) => {
              onBodyChange?.(event.target.value);
            }}
            {...(plainEditing
              ? { placeholder: "What do you want to talk about?" }
              : {})}
            className={cn(
              "field-sizing-content w-full resize-none type-body outline-none",
              plainEditing
                ? "bg-transparent p-0 whitespace-pre-line placeholder:text-imagine-foreground-faint"
                : "rounded-control bg-imagine-surface-raised/60 px-s py-xs",
            )}
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
        <motion.div
          layout="position"
          transition={fade.base}
          className={cn(
            "mt-s grid gap-px overflow-hidden",
            media.length > 1 ? "grid-cols-2" : "grid-cols-1",
          )}
        >
          {media.slice(0, 2).map((asset) =>
            onRemoveMedia === undefined ? (
              <AssetTile
                key={asset.id}
                asset={asset}
                className="aspect-[4/3] rounded-none"
              />
            ) : (
              <div key={asset.id} className="group/media relative">
                <AssetTile
                  asset={asset}
                  className="aspect-[4/3] rounded-none"
                />
                <button
                  type="button"
                  aria-label={`Remove ${asset.caption ?? "media"}`}
                  onClick={() => {
                    onRemoveMedia(asset.id);
                  }}
                  className="absolute top-xs right-xs flex size-7 items-center justify-center rounded-full bg-imagine-surface/80 text-imagine-foreground opacity-0 backdrop-blur transition-opacity group-hover/media:opacity-100 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring/40"
                >
                  <Icon name="xmark" size="s" />
                </button>
              </div>
            ),
          )}
        </motion.div>
      ) : null}

      {/* One row: the actions, each with its count, then LinkedIn's overlapping
          reaction summary and its total. */}
      <motion.div
        layout="position"
        transition={fade.base}
        className="flex items-center justify-between gap-m px-l py-m"
      >
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
                <Icon name={action.icon} size="m" />
                {count === undefined ? null : COUNT.format(count)}
              </span>
            );
          })}
        </div>
        {stats !== undefined && stats.reactions > 0 ? (
          <span
            aria-hidden="true"
            className="flex shrink-0 items-center gap-xs type-caption text-imagine-foreground-muted tabular-nums"
          >
            <LinkedInReactionCluster types={FEED_REACTIONS} />
            {COUNT.format(stats.reactions)}
          </span>
        ) : null}
      </motion.div>

      {stats?.impressions === undefined ? null : (
        <motion.div
          layout="position"
          transition={fade.base}
          className="flex items-center justify-between gap-m border-t border-imagine-border px-l py-s"
        >
          <span className="inline-flex items-center gap-xs type-small font-semibold tabular-nums">
            <Icon name="chart-simple" size="m" />
            {COUNT.format(stats.impressions)} impressions
          </span>
          <Link
            href="/analytics"
            className="group/analytics inline-flex items-center gap-xs rounded-[2px] type-small font-semibold text-imagine-secondary underline-offset-4 outline-none hover:text-imagine-secondary-strong hover:underline focus-visible:ring-2 focus-visible:ring-ring/40"
          >
            View analytics
            <Icon
              name="arrow-right"
              size="s"
              className="transition-transform duration-150 ease-out group-hover/analytics:translate-x-0.5"
            />
          </Link>
        </motion.div>
      )}
    </motion.article>
  );
}

/**
 * A draft in the thread: the post plus the actions under it. The body can be
 * edited in place. It starts unfolded, so the whole post reads. Preview folds
 * it the way the feed will, behind "…more".
 */
export function LinkedInPostDraft({
  footer,
  foldControl = true,
  className,
  ...post
}: LinkedInPostDraftProps) {
  const [expanded, setExpanded] = useState(true);
  const foldable = foldControl && foldBody(post.body).folded && !post.editing;

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
              {expanded ? "Preview" : "Show full post"}
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
