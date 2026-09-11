"use client";

import { cn } from "cn";

import { AssetTile } from "@/components/features/files/asset-tile";
import type {
  PostChipData,
  PostEngagementPerson,
} from "@/components/features/calendar/post-chip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Icon, type IconName } from "@/components/ui/icon";

interface LinkedInPostEditorProps {
  post: PostChipData;
  body: string;
  onBodyChange: (body: string) => void;
}

const COUNT = new Intl.NumberFormat("en-US");

const ACTIONS: readonly {
  icon: IconName;
  label: string;
  count?: "reactions" | "comments" | "reposts";
}[] = [
  { icon: "thumbs-up", label: "Like", count: "reactions" },
  { icon: "comment", label: "Comment", count: "comments" },
  { icon: "arrows-rotate", label: "Repost", count: "reposts" },
  { icon: "paper-plane", label: "Send" },
];

function initials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function PersonAvatar({
  person,
  className,
}: {
  person: PostEngagementPerson;
  className?: string;
}) {
  return (
    <Avatar className={className}>
      {person.avatarUrl ? (
        <AvatarImage src={person.avatarUrl} alt={person.name} />
      ) : null}
      <AvatarFallback>{initials(person.name)}</AvatarFallback>
    </Avatar>
  );
}

export function LinkedInPostEditor({
  post,
  body,
  onBodyChange,
}: LinkedInPostEditorProps) {
  const preview = post.preview;
  if (preview === undefined) return null;

  const stats = preview.stats;
  const reactors = post.engagement?.reactors ?? [];
  const comments = post.engagement?.comments ?? [];
  const remainingReactions = Math.max(
    0,
    (stats?.reactions ?? 0) - reactors.length,
  );

  return (
    <div className="mx-auto w-full max-w-[680px]">
      <header className="flex items-start gap-s">
        <Avatar
          size="lg"
          shape={preview.author.kind === "company" ? "square" : "circle"}
        >
          {preview.author.avatarUrl ? (
            <AvatarImage
              src={preview.author.avatarUrl}
              alt={preview.author.name}
            />
          ) : null}
          <AvatarFallback>{initials(preview.author.name)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate type-body font-semibold">
            {preview.author.name}
          </p>
          <p className="truncate type-caption text-imagine-foreground-muted">
            {preview.author.headline}
          </p>
          <p className="flex items-center gap-xxs type-caption text-imagine-foreground-muted">
            {post.time}
            <span aria-hidden="true">·</span>
            <Icon name="users" size="s" aria-label="Anyone" />
          </p>
        </div>
        <Icon
          name="ellipsis"
          size="m"
          className="text-imagine-foreground-muted"
          aria-hidden="true"
        />
      </header>

      <textarea
        value={body}
        aria-label="Post body"
        onChange={(event) => {
          onBodyChange(event.target.value);
        }}
        className="mt-l field-sizing-content min-h-36 w-full resize-none bg-transparent type-body leading-relaxed outline-none placeholder:text-imagine-foreground-faint"
      />

      {preview.media && preview.media.length > 0 ? (
        <div
          className={cn(
            "mt-m grid gap-xs overflow-hidden rounded-control",
            preview.media.length > 1 ? "grid-cols-2" : "grid-cols-1",
          )}
        >
          {preview.media.slice(0, 2).map((asset) => (
            <AssetTile
              key={asset.id}
              asset={asset}
              className="aspect-[4/3] rounded-none"
            />
          ))}
        </div>
      ) : null}

      <div className="mt-l grid grid-cols-4 gap-xs">
        {ACTIONS.map((action) => {
          const count =
            action.count === undefined ? undefined : stats?.[action.count];
          return (
            <button
              key={action.label}
              type="button"
              className="flex min-w-0 items-center justify-center gap-xs rounded-control py-s type-small font-semibold text-imagine-foreground-muted transition-colors hover:bg-imagine-surface-raised hover:text-imagine-foreground"
            >
              <Icon name={action.icon} size="l" />
              <span className="hidden sm:inline">{action.label}</span>
              {count === undefined ? null : (
                <span className="tabular-nums">{COUNT.format(count)}</span>
              )}
            </button>
          );
        })}
      </div>

      {stats?.impressions === undefined ? null : (
        <div className="mt-m flex items-center justify-between gap-m">
          <span className="inline-flex items-center gap-xs type-small font-semibold tabular-nums">
            <Icon name="chart-simple" size="l" />
            {COUNT.format(stats.impressions)} impressions
          </span>
          <a
            href="/analytics"
            className="inline-flex items-center gap-xs type-small font-semibold text-imagine-secondary hover:underline"
          >
            View analytics
            <Icon name="arrow-right" size="s" />
          </a>
        </div>
      )}

      {post.engagement === undefined ? null : (
        <section className="mt-xl">
          <div className="mb-l flex items-center justify-between gap-m">
            <div className="flex min-w-0 items-center">
              {reactors.slice(0, 6).map((reactor, index) => (
                <div
                  key={`${reactor.id}:${reactor.reaction}`}
                  title={`${reactor.name} reacted ${reactor.reaction}`}
                  className={cn("relative", index > 0 && "-ml-xs")}
                >
                  <PersonAvatar
                    person={reactor}
                    className="size-8 ring-2 ring-imagine-surface"
                  />
                  <span
                    className={cn(
                      "absolute -right-0.5 -bottom-0.5 flex size-4 items-center justify-center rounded-full text-white ring-1 ring-imagine-surface",
                      reactor.reaction === "insightful"
                        ? "bg-amber-500"
                        : "bg-[#378fe9]",
                    )}
                  >
                    <Icon
                      name={
                        reactor.reaction === "insightful"
                          ? "lightbulb"
                          : "thumbs-up"
                      }
                      active
                      className="text-[8px]"
                    />
                  </span>
                </div>
              ))}
              <span className="ml-s truncate type-small text-imagine-foreground-muted">
                {remainingReactions > 0
                  ? `and ${COUNT.format(remainingReactions)} others`
                  : `${COUNT.format(reactors.length)} reactions`}
              </span>
            </div>
            <span className="shrink-0 type-small text-imagine-foreground-muted">
              {COUNT.format(stats?.comments ?? comments.length)} comments
            </span>
          </div>

          <div className="flex items-center gap-s">
            <Avatar className="size-9">
              {preview.author.avatarUrl ? (
                <AvatarImage
                  src={preview.author.avatarUrl}
                  alt={preview.author.name}
                />
              ) : null}
              <AvatarFallback>{initials(preview.author.name)}</AvatarFallback>
            </Avatar>
            <button
              type="button"
              className="min-h-10 flex-1 rounded-full bg-imagine-surface-raised px-m text-left type-small text-imagine-foreground-muted transition-colors hover:bg-imagine-border"
            >
              Add a comment…
            </button>
          </div>

          <div className="my-m flex items-center gap-xs type-small font-semibold">
            Most relevant
            <Icon
              name="chevron-down"
              size="s"
              className="text-imagine-foreground-muted"
            />
          </div>

          <div className="flex flex-col gap-l">
            {comments.map((comment) => (
              <article key={comment.id} className="flex items-start gap-s">
                <PersonAvatar
                  person={comment.author}
                  className="mt-xxs size-9 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="rounded-xl bg-imagine-surface-raised px-m py-s">
                    <div className="flex items-start justify-between gap-s">
                      <div className="min-w-0">
                        <p className="truncate type-small font-semibold">
                          {comment.author.name}
                        </p>
                        <p className="truncate type-caption text-imagine-foreground-muted">
                          {comment.author.headline}
                        </p>
                      </div>
                      <span className="shrink-0 type-caption text-imagine-foreground-muted">
                        {comment.when}
                      </span>
                    </div>
                    <p className="mt-s type-small whitespace-pre-line">
                      {comment.body}
                    </p>
                  </div>
                  <div className="mt-xs flex items-center gap-xs px-s type-caption font-semibold text-imagine-foreground-muted">
                    <button
                      type="button"
                      className="hover:text-imagine-foreground"
                    >
                      Like
                    </button>
                    <span aria-hidden="true">·</span>
                    <button
                      type="button"
                      className="hover:text-imagine-foreground"
                    >
                      Reply
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
