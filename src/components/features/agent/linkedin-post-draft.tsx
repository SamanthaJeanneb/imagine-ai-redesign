"use client";

import { cn } from "cn";
import { motion } from "motion/react";

import {
  AssetTile,
  type AssetTileData,
} from "@/components/features/files/asset-tile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Icon, type IconName } from "@/components/ui/icon";
import { spring } from "@/styles/motion";

export interface PostAuthor {
  name: string;
  headline: string;
  avatarUrl?: string;
  /** Company pages get a square avatar, as on LinkedIn. Default `person`. */
  kind?: "person" | "company";
}

/** Everything needed to render a post the way LinkedIn will. */
export interface LinkedInPostContent {
  author: PostAuthor;
  body: string;
  media?: readonly AssetTileData[];
}

interface LinkedInPostProps extends LinkedInPostContent {
  /** "Now", "2h", or a scheduled time like "Tue 9:00". */
  timestamp?: string;
  /** Turns the body into an editable field. */
  editing?: boolean;
  onBodyChange?: (body: string) => void;
  className?: string;
}

interface LinkedInPostDraftProps extends Omit<LinkedInPostProps, "timestamp"> {
  /** Actions rendered under the post (Schedule, Edit, Regenerate). */
  footer?: React.ReactNode;
}

const REACTIONS: readonly { icon: IconName; label: string }[] = [
  { icon: "thumbs-up", label: "Like" },
  { icon: "comment", label: "Comment" },
  { icon: "arrows-rotate", label: "Repost" },
  { icon: "paper-plane", label: "Send" },
];

function initials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

/**
 * A post rendered the way it will look on LinkedIn: avatar, name, headline,
 * time, body, one or two media tiles, and the reaction row. Used for drafts
 * in the thread and for the hover preview on calendar chips.
 */
export function LinkedInPost({
  author,
  body,
  media = [],
  timestamp = "Now",
  editing = false,
  onBodyChange,
  className,
}: LinkedInPostProps) {
  return (
    <motion.article
      layout
      transition={spring.settle}
      data-slot="linkedin-post"
      className={cn(
        "flex flex-col gap-m overflow-hidden rounded-panel bg-imagine-surface p-l shadow-raised transition-shadow",
        editing && "ring-2 ring-ring/30",
        className,
      )}
    >
      <header className="flex items-start gap-m">
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
          <span className="truncate type-body font-semibold">
            {author.name}
          </span>
          <span className="truncate type-small text-imagine-foreground-muted">
            {author.headline}
          </span>
          <span className="inline-flex items-center gap-xs type-small text-imagine-foreground-faint">
            {timestamp}
            <span aria-hidden="true">·</span>
            <Icon name="link" size="s" />
          </span>
        </div>
        <Icon
          name="ellipsis"
          size="s"
          aria-hidden="true"
          className="mt-xxs text-imagine-foreground-faint"
        />
      </header>

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
        <p className="type-body whitespace-pre-line">{body}</p>
      )}

      {media.length > 0 ? (
        <div
          className={cn(
            "grid gap-xxs overflow-hidden rounded-control",
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

      <footer className="flex items-center justify-between pt-xxs text-imagine-foreground-muted">
        {REACTIONS.map((reaction) => (
          <span
            key={reaction.label}
            className="inline-flex h-7 items-center gap-xs rounded-control px-s type-small transition-colors hover:bg-imagine-surface-raised hover:text-imagine-foreground"
          >
            <Icon name={reaction.icon} size="s" />
            {reaction.label}
          </span>
        ))}
      </footer>
    </motion.article>
  );
}

/**
 * A draft in the thread: the post plus the actions under it. The body can be
 * edited in place.
 */
export function LinkedInPostDraft({
  footer,
  className,
  ...post
}: LinkedInPostDraftProps) {
  return (
    <div className={cn("flex w-full max-w-lg flex-col gap-s", className)}>
      <LinkedInPost {...post} />
      {footer ? (
        <div className="flex flex-wrap items-center gap-xs">{footer}</div>
      ) : null}
    </div>
  );
}
