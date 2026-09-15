"use client";

import { cn } from "cn";
import { motion } from "motion/react";
import Link from "next/link";
import { createContext, useContext, useState, type ReactNode } from "react";

import {
  LinkedInReactionCluster,
  type LinkedInReactionType,
} from "@/components/features/agent/linkedin-reaction";
import {
  AssetTile,
  type AssetTileData,
} from "@/components/features/files/asset-tile";
import { useLayoutLocked } from "@/components/motion/layout-lock";
import { Button } from "@/components/ui/button";
import { Icon, type IconName } from "@/components/ui/icon";
import { PersonAvatar } from "@/components/ui/person-avatar";
import { Separator } from "@/components/ui/separator";
import type { LinkedInPostContent, LinkedInPostStats } from "@/entities/post";
import { fade } from "@/styles/motion";
import { COUNT } from "@/lib/format";

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

/**
 * The part of the body that shows before "…more". Cuts at the fold length,
 * on a word, or after the third line, whichever comes first.
 */
function foldBody(body: string): { shown: string; folded: boolean } {
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

/* -------------------------------------------------------------------------- */
/* Provider                                                                   */
/* -------------------------------------------------------------------------- */

interface LinkedInPostContextValue extends Omit<LinkedInPostContent, "media"> {
  /** Defaulted by the provider, so parts never re-check it. */
  media: readonly AssetTileData[];
  /** The whole body shows. LinkedIn folds a long post behind "…more". */
  expanded: boolean;
  setExpanded: (expanded: boolean) => void;
  /** The body is long enough to fold, so a fold control is worth showing. */
  foldable: boolean;
}

const LinkedInPostContext = createContext<LinkedInPostContextValue | null>(
  null,
);

function usePost(): LinkedInPostContextValue {
  const post = useContext(LinkedInPostContext);
  if (post === null) {
    throw new Error("LinkedIn post parts need a <LinkedInPostProvider>.");
  }
  return post;
}

interface LinkedInPostProviderProps extends LinkedInPostContent {
  /** Folded on mount unless set. The thread's drafts start open. */
  defaultExpanded?: boolean;
  children: ReactNode;
}

export function LinkedInPostProvider({
  author,
  body,
  media = [],
  stats,
  defaultExpanded = false,
  children,
}: LinkedInPostProviderProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <LinkedInPostContext.Provider
      value={{
        author,
        body,
        media,
        stats,
        expanded,
        setExpanded,
        foldable: foldBody(body).folded,
      }}
    >
      {children}
    </LinkedInPostContext.Provider>
  );
}

/* -------------------------------------------------------------------------- */
/* Frames                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * The card. Its height changes on "…more" and on entering edit with a short
 * ease-out, not a spring: nothing overshoots and nothing keeps settling. Size
 * layout interpolates width too, so the raised edit field can grow.
 */
export function LinkedInPostCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const layoutLocked = useLayoutLocked();

  return (
    // No `layoutDependency`: the card's height changes on the fold, on
    // entering edit, and as the field grows, so it measures every render.
    <motion.article
      layout={!layoutLocked}
      transition={fade.base}
      data-slot="linkedin-post"
      className={cn(
        "flex flex-col overflow-hidden rounded-panel bg-imagine-surface shadow-raised transition-shadow",
        className,
      )}
    >
      {children}
    </motion.article>
  );
}

/**
 * The calendar editor's card. It only eases sibling position, never its own
 * size, so typing does not reflow the body away from where LinkedIn put it.
 */
export function LinkedInPostPlainCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const layoutLocked = useLayoutLocked();

  return (
    <motion.article
      layout={layoutLocked ? false : "position"}
      transition={fade.base}
      data-slot="linkedin-post"
      className={cn(
        "flex flex-col overflow-hidden rounded-panel bg-imagine-surface shadow-raised transition-shadow",
        className,
      )}
    >
      {children}
    </motion.article>
  );
}

/* -------------------------------------------------------------------------- */
/* Parts                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * LinkedIn's actor row: 48px photo, 16px name, then the 12px headline and
 * timestamp stacked on the photo's height. Public posts use a globe, not a
 * people icon. No Premium badge.
 */
export function LinkedInPostActor({
  timestamp = "Now",
  edited = false,
  you = false,
  marker,
}: {
  /** "Now", "2h", "1mo", or a scheduled time like "Tue 9:00". */
  timestamp?: string;
  /** Changed after it went out: "1mo · Edited". */
  edited?: boolean;
  /** The viewer wrote it: "· You" after the name, as LinkedIn marks your own. */
  you?: boolean;
  /**
   * Sits at the trailing end of the row, where LinkedIn puts its menu: the
   * calendar's hover preview puts the post's status pill here.
   */
  marker?: ReactNode;
}) {
  const { author } = usePost();

  return (
    <header className="flex items-start gap-s px-l pt-l">
      <PersonAvatar
        name={author.name}
        {...(author.avatarUrl === undefined
          ? {}
          : { avatarUrl: author.avatarUrl })}
        shape={author.kind === "company" ? "square" : "circle"}
        className="size-12 after:hidden"
      />
      <div className="min-w-0 flex-1 leading-none">
        <p className="truncate type-body leading-5 font-semibold">
          {author.name}
          {you ? (
            <span className="font-normal text-imagine-foreground-muted">
              {" "}
              · You
            </span>
          ) : null}
        </p>
        <p className="mt-px truncate type-caption text-imagine-foreground-muted">
          {author.headline}
        </p>
        <p className="mt-px flex items-center gap-xs type-caption text-imagine-foreground-muted">
          {timestamp}
          {edited ? (
            <>
              <span aria-hidden="true">•</span>
              <span>Edited</span>
            </>
          ) : null}
          <span aria-hidden="true">•</span>
          <Icon
            name="globe"
            size="s"
            className="[font-size:var(--imagine-text-caption-size)]"
          />
        </p>
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

/** The body as the feed shows it, folded behind "…more" until it is opened. */
export function LinkedInPostBody() {
  const { body, expanded, setExpanded } = usePost();
  const fold = foldBody(body);
  const folded = !expanded && fold.folded;

  return (
    <div className="min-w-0 px-l pt-s">
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
    </div>
  );
}

/** The thread's draft field: the body in a raised box that grows as it fills. */
export function LinkedInPostField({
  onBodyChange,
}: {
  onBodyChange: (body: string) => void;
}) {
  const { body } = usePost();

  return (
    <div className="min-w-0 px-l pt-s">
      <textarea
        value={body}
        aria-label="Post body"
        rows={1}
        onChange={(event) => {
          onBodyChange(event.target.value);
        }}
        className="field-sizing-content w-full min-w-0 resize-none rounded-control bg-imagine-surface-raised/60 px-s py-xs type-body outline-none"
      />
    </div>
  );
}

/**
 * The calendar editor's body: the feed paragraph sizes the wrap and a
 * borderless textarea sits on top, so typing does not reflow words the way a
 * field would.
 */
export function LinkedInPostPlainField({
  onBodyChange,
}: {
  onBodyChange: (body: string) => void;
}) {
  const { body } = usePost();

  return (
    <div className="min-w-0 px-l pt-s">
      <div className="relative">
        <p
          aria-hidden="true"
          className="invisible type-body whitespace-pre-line"
        >
          {`${body}\n`}
        </p>
        <textarea
          value={body}
          aria-label="Post body"
          rows={1}
          placeholder="What do you want to talk about?"
          onChange={(event) => {
            onBodyChange(event.target.value);
          }}
          className="absolute inset-0 size-full resize-none overflow-hidden border-0 bg-transparent p-0 font-sans type-body whitespace-pre-line outline-none placeholder:text-imagine-foreground-faint"
        />
      </div>
    </div>
  );
}

/** LinkedIn's preview shows at most two images, edge to edge. */
function MediaGrid({ children }: { children: ReactNode }) {
  const { media } = usePost();
  const layoutLocked = useLayoutLocked();

  return (
    <motion.div
      layout={layoutLocked ? false : "position"}
      transition={fade.base}
      className={cn(
        "mt-s grid gap-px overflow-hidden",
        media.length > 1 ? "grid-cols-2" : "grid-cols-1",
      )}
    >
      {children}
    </motion.div>
  );
}

export function LinkedInPostMedia() {
  const { media } = usePost();
  if (media.length === 0) return null;

  return (
    <MediaGrid>
      {media.slice(0, 2).map((asset) => (
        <AssetTile
          key={asset.id}
          asset={asset}
          className="aspect-[4/3] rounded-none"
        />
      ))}
    </MediaGrid>
  );
}

/** The same media, each tile with a remove control on hover. */
export function LinkedInPostEditableMedia({
  onRemoveMedia,
}: {
  onRemoveMedia: (id: string) => void;
}) {
  const { media } = usePost();
  if (media.length === 0) return null;

  return (
    <MediaGrid>
      {media.slice(0, 2).map((asset) => (
        <div key={asset.id} className="group/media relative">
          <AssetTile asset={asset} className="aspect-[4/3] rounded-none" />
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
      ))}
    </MediaGrid>
  );
}

/**
 * One row: the actions, each with its count, then LinkedIn's overlapping
 * reaction summary and its total.
 */
export function LinkedInPostActions() {
  const { stats } = usePost();
  const layoutLocked = useLayoutLocked();

  return (
    <motion.div
      layout={layoutLocked ? false : "position"}
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
  );
}

/** The impressions line, once the post has gone out. */
export function LinkedInPostImpressions() {
  const { stats } = usePost();
  const layoutLocked = useLayoutLocked();
  if (stats?.impressions === undefined) return null;

  return (
    <motion.div
      layout={layoutLocked ? false : "position"}
      transition={fade.base}
      className="flex flex-col"
    >
      <Separator />
      <div className="flex items-center justify-between gap-m px-l py-s">
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
      </div>
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/* Draft                                                                      */
/* -------------------------------------------------------------------------- */

/** The column a thread draft sits in: the card, then the actions under it. */
export function LinkedInPostDraft({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex w-full max-w-lg flex-col gap-s", className)}>
      {children}
    </div>
  );
}

/** The row under a draft where its actions sit. */
export function LinkedInPostDraftActions({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-center gap-xs", className)}>
      {children}
    </div>
  );
}

/**
 * Folds the draft the way the feed will, and opens it again. Renders nothing
 * when the body is short enough that the feed would not fold it.
 */
export function LinkedInPostFoldButton() {
  const { expanded, setExpanded, foldable } = usePost();
  if (!foldable) return null;

  return (
    <Button
      size="sm"
      variant="ghost"
      aria-pressed={!expanded}
      onClick={() => {
        setExpanded(!expanded);
      }}
      className="ml-auto text-imagine-foreground-muted"
    >
      {expanded ? "Preview" : "Show full post"}
    </Button>
  );
}

/* -------------------------------------------------------------------------- */
/* Read-only post                                                             */
/* -------------------------------------------------------------------------- */

/**
 * A post rendered the way it will look on LinkedIn: avatar, name, headline,
 * when and who can see it; the body folded behind "…more"; media edge to
 * edge; then one row of actions with their counts and the reactions it drew,
 * and the impressions line once it has gone out.
 *
 * This is the read-only assembly, used by the calendar and composer hover
 * previews. Editing a post means composing the parts instead — see
 * `AgentMessage`'s draft and `LinkedInPostEditor`.
 */
export function LinkedInPost({
  timestamp,
  edited,
  you,
  marker,
  className,
  ...content
}: LinkedInPostContent & {
  timestamp?: string;
  edited?: boolean;
  you?: boolean;
  marker?: ReactNode;
  className?: string;
}) {
  return (
    <LinkedInPostProvider {...content}>
      <LinkedInPostCard className={className}>
        <LinkedInPostActor
          timestamp={timestamp}
          edited={edited}
          you={you}
          marker={marker}
        />
        <LinkedInPostBody />
        <LinkedInPostMedia />
        <LinkedInPostActions />
        <LinkedInPostImpressions />
      </LinkedInPostCard>
    </LinkedInPostProvider>
  );
}
