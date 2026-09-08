"use client";

import { cn } from "cn";

import type { PostChipData } from "@/components/features/calendar/post-chip";
import { type AssetTileData } from "@/components/features/files/asset-tile";
import { Stagger, StaggerItem } from "@/components/motion/stagger";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";

export interface TopPost {
  id: string;
  title: string;
  /** "Sarah Chen · 3 Sep". */
  meta: string;
  thumbnail?: AssetTileData;
  /** The same post shape the chat attaches from the calendar. */
  post?: PostChipData;
  metrics: readonly { label: string; value: string }[];
}

interface TopPostsProps {
  items: readonly TopPost[];
  onOpen?: (post: TopPost) => void;
  onViewAll?: () => void;
  selectedId?: string;
  className?: string;
}

/**
 * Ranked posts with three metrics each. Rows, not cards; hover lifts the
 * background only.
 */
export function TopPosts({
  items,
  onOpen,
  onViewAll,
  selectedId,
  className,
}: TopPostsProps) {
  return (
    <div
      data-slot="top-posts"
      className={cn(
        "@container flex flex-col gap-m border border-imagine-border bg-imagine-surface p-l",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <span className="type-heading">Top posts</span>
        {onViewAll ? (
          <Button
            variant="ghost"
            size="xs"
            className="text-imagine-foreground-muted"
            onClick={onViewAll}
          >
            View all
          </Button>
        ) : null}
      </div>
      <Stagger kind="list" className="flex flex-col">
        {items.map((post, index) => (
          <StaggerItem key={post.id}>
            <div
              className={cn(
                "group/row -mx-s flex items-center gap-m rounded-control px-s py-s transition-colors hover:bg-imagine-surface-raised",
                post.id === selectedId && "bg-imagine-surface-raised",
              )}
            >
              <span className="w-4 shrink-0 text-center type-small text-imagine-foreground-faint tabular-nums">
                {index + 1}
              </span>
              <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-control bg-imagine-surface text-imagine-foreground-faint">
                {post.thumbnail?.src ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={post.thumbnail.src}
                    alt=""
                    className="size-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <Icon name="file-lines" />
                )}
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate type-body font-medium">
                  {post.title}
                </span>
                <span className="truncate type-small text-imagine-foreground-muted">
                  {post.meta}
                </span>
              </span>
              <dl className="hidden items-center gap-l @2xl:flex">
                {post.metrics.map((metric) => (
                  <div
                    key={metric.label}
                    className="flex w-16 flex-col text-right"
                  >
                    <dt className="type-micro text-imagine-foreground-faint">
                      {metric.label}
                    </dt>
                    <dd className="type-small tabular-nums">{metric.value}</dd>
                  </div>
                ))}
              </dl>
              {onOpen ? (
                <Button
                  size="sm"
                  variant="soft"
                  onClick={() => {
                    onOpen(post);
                  }}
                >
                  {post.id === selectedId ? "Attached" : "Open"}
                </Button>
              ) : null}
            </div>
          </StaggerItem>
        ))}
      </Stagger>
    </div>
  );
}
