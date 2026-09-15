"use client";

import { cn } from "cn";
import { AnimatePresence, motion } from "motion/react";
import { useId, useState } from "react";

import { AskButton } from "@/components/features/analytics/ask-imagine";
import { ChartSkeletonLine } from "@/components/features/analytics/chart-theme";
import { EngagementChartScene } from "@/components/features/analytics/engagement-chart-scene";
import type {
  ExplorerData,
  ExplorerMetric,
  ExplorerPost,
} from "@/components/features/analytics/engagement-explorer-types";
import {
  METRIC,
  MetricTabs,
} from "@/components/features/analytics/engagement-metric-tabs";
import { PostDetail } from "@/components/features/analytics/engagement-post-detail";
import { Panel } from "@/components/features/analytics/panel";
import { spring } from "@/styles/motion";

export {
  EXPLORER_METRICS,
  type ExplorerData,
  type ExplorerMetric,
  type ExplorerPoint,
  type ExplorerPost,
} from "@/components/features/analytics/engagement-explorer-types";

interface EngagementExplorerProps {
  data: ExplorerData;
  /** The window, e.g. "Last 30 days". */
  description?: string;
  /** The post attached to the conversation, if any. */
  selectedPostId?: string;
  /** Pressing a post, on the chart or in the rail. */
  onSelectPost?: (post: ExplorerPost) => void;
  onAsk?: (prompt: string, intent?: string) => void;
  /** Shared with the composer's analytics preview, for the morph. */
  layoutId?: string;
  className?: string;
}

/**
 * Engagement over the window and the posts behind it. One metric shows at a
 * time (the tabs). Hovering the chart scrubs through days and the detail rail
 * follows; hovering a post in the rail pins the chart to its day. Pressing a
 * post, on the chart or in the rail, attaches it.
 */
export function EngagementExplorer({
  data,
  description,
  selectedPostId,
  onSelectPost,
  onAsk,
  layoutId,
  className,
}: EngagementExplorerProps) {
  const clipId = useId().replace(/:/g, "");
  const [metric, setMetric] = useState<ExplorerMetric>("reach");
  const [hoverLabel, setHoverLabel] = useState<string | null>(null);
  const [pinned, setPinned] = useState<ExplorerPost | null>(null);

  const spec = METRIC[metric];
  const postsByLabel = new Map<string, ExplorerPost[]>();
  for (const post of data.posts) {
    const list = postsByLabel.get(post.label);
    if (list) list.push(post);
    else postsByLabel.set(post.label, [post]);
  }
  const labelIndex = new Map(
    data.points.map((point, index) => [point.label, index]),
  );

  const scrubbed =
    hoverLabel === null ? undefined : postsByLabel.get(hoverLabel)?.[0];
  const activePost =
    pinned ??
    scrubbed ??
    data.posts.find((post) => post.id === selectedPostId) ??
    data.posts.at(-1);
  const pinnedIndex =
    pinned === null ? undefined : labelIndex.get(pinned.label);
  const labelOf = new Map<string, string>([[metric, spec.label]]);

  return (
    <Panel
      title="Engagement"
      description={description}
      actions={
        <>
          <MetricTabs value={metric} onValueChange={setMetric} />
          {onAsk ? (
            <AskButton
              prompt={`Walk me through ${spec.label.toLowerCase()} over ${(description ?? "this window").toLowerCase()} and what drove it.`}
              onAsk={onAsk}
            />
          ) : null}
        </>
      }
      layoutId={layoutId}
      className={className}
    >
      <div className="grid min-w-0 gap-l @2xl/panel:grid-cols-[minmax(0,1fr)_16rem]">
        <div className="flex min-w-0 flex-col gap-m">
          <EngagementChartScene
            data={data}
            metric={metric}
            spec={spec}
            clipId={clipId}
            pinned={pinned}
            pinnedIndex={pinnedIndex}
            postsByLabel={postsByLabel}
            labelOf={labelOf}
            activePostId={activePost?.id}
            selectedPostId={selectedPostId}
            onHoverLabel={setHoverLabel}
            onHoverPost={setPinned}
            onSelectPost={onSelectPost}
          />
        </div>

        <aside
          className="flex min-w-0 flex-col gap-l xl:border-l xl:border-imagine-border xl:pl-l"
          onMouseLeave={() => {
            setPinned(null);
          }}
        >
          <AnimatePresence mode="wait" initial={false}>
            {activePost ? (
              <PostDetail
                key={activePost.id}
                post={activePost}
                selected={activePost.id === selectedPostId}
                onSelect={onSelectPost}
              />
            ) : (
              <p
                key="empty"
                className="type-small text-imagine-foreground-faint"
              >
                No posts in this window.
              </p>
            )}
          </AnimatePresence>
          {data.posts.length > 0 ? (
            <ul className="-mx-xs flex max-h-40 flex-col overflow-y-auto border-t border-imagine-border pt-s">
              {data.posts
                .slice()
                .reverse()
                .map((post) => {
                  const active = post.id === activePost?.id;
                  return (
                    <li key={post.id}>
                      <motion.button
                        type="button"
                        onMouseEnter={() => {
                          setPinned(post);
                        }}
                        onFocus={() => {
                          setPinned(post);
                        }}
                        onClick={() => onSelectPost?.(post)}
                        whileTap={{ scale: 0.985 }}
                        transition={spring.snappy}
                        className={cn(
                          "flex w-full items-center gap-s rounded-control px-xs py-xxs text-left transition-colors",
                          active
                            ? "bg-imagine-surface-raised"
                            : "hover:bg-imagine-surface-raised/60",
                        )}
                      >
                        <span className="w-12 shrink-0 type-small text-imagine-foreground-faint tabular-nums">
                          {post.label}
                        </span>
                        <span className="min-w-0 flex-1 truncate type-small">
                          {post.title}
                        </span>
                        <span className="shrink-0 type-small font-medium tabular-nums">
                          {metric === "posts"
                            ? String(post.comments)
                            : spec.format(post[metric])}
                        </span>
                      </motion.button>
                    </li>
                  );
                })}
            </ul>
          ) : null}
        </aside>
      </div>
    </Panel>
  );
}

/**
 * The same panel while the window is still being read: the header and the
 * metric switch stand, the curve and the post rail do not. The switch is
 * inert until there is a window for it to switch between.
 */
export function EngagementExplorerSkeleton({
  description,
  className,
}: {
  description?: string;
  className?: string;
}) {
  return (
    <Panel
      title="Engagement"
      description={description}
      actions={<MetricTabs value="reach" disabled />}
      className={className}
    >
      <ChartSkeletonLine height="h-72" />
    </Panel>
  );
}
