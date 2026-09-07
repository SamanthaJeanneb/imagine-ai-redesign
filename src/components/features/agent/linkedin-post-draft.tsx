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
}

interface LinkedInPostDraftProps {
  author: PostAuthor;
  body: string;
  media?: readonly AssetTileData[];
  /** Turns the body into an editable field. */
  editing?: boolean;
  onBodyChange?: (body: string) => void;
  /** Actions rendered under the post (Schedule, Edit, Regenerate). */
  footer?: React.ReactNode;
  className?: string;
}

const REACTIONS: readonly { icon: IconName; label: string }[] = [
  { icon: "thumbs-up", label: "Like" },
  { icon: "comment", label: "Comment" },
  { icon: "retweet", label: "Repost" },
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
 * A draft that reads like the real LinkedIn post it will become. The body can
 * be edited in place; media renders in a one or two tile grid.
 */
export function LinkedInPostDraft({
  author,
  body,
  media = [],
  editing = false,
  onBodyChange,
  footer,
  className,
}: LinkedInPostDraftProps) {
  return (
    <div className={cn("flex w-full max-w-lg flex-col gap-s", className)}>
      <motion.article
        layout
        transition={spring.soft}
        data-slot="linkedin-post-draft"
        className={cn(
          "flex flex-col gap-m overflow-hidden rounded-panel bg-imagine-surface p-l shadow-raised transition-shadow",
          editing && "ring-2 ring-ring/30",
        )}
      >
        <header className="flex items-center gap-m">
          <Avatar size="lg" className="rounded-full">
            {author.avatarUrl ? (
              <AvatarImage
                src={author.avatarUrl}
                alt={author.name}
                className="rounded-full"
              />
            ) : null}
            <AvatarFallback className="rounded-full">
              {initials(author.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-col">
            <span className="truncate type-body font-semibold">
              {author.name}
            </span>
            <span className="truncate type-small text-imagine-foreground-muted">
              {author.headline}
            </span>
            <span className="inline-flex items-center gap-xs type-small text-imagine-foreground-faint">
              Now
              <Icon name="globe" size="s" />
            </span>
          </div>
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
      {footer ? (
        <div className="flex flex-wrap items-center gap-xs">{footer}</div>
      ) : null}
    </div>
  );
}
