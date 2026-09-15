"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useId,
  useState,
} from "react";

import {
  METRIC,
  type MetricSpec,
} from "@/components/features/analytics/engagement-metric-tabs";
import type { ExplorerMetric, ExplorerPost } from "@/entities/engagement";
import type { ExplorerView } from "@/entities/engagement";

/**
 * What the explorer's parts share: which metric is showing, which post the
 * rail is on, and which day the chart is held at. Scrubbing the plot and
 * hovering the rail both move the same selection, and the metric switch sits
 * in the panel header, outside the chart, so all of it lives above them.
 */
interface EngagementExplorerValue {
  data: ExplorerView;
  metric: ExplorerMetric;
  spec: MetricSpec;
  /** Namespaces the gradient and clip ids to this panel instance. */
  clipId: string;
  /** The post whose day the chart is held on, if any. */
  pinned: ExplorerPost | null;
  /** That post's day in `data.points`. */
  pinnedIndex: number | undefined;
  /** The post the rail shows: pinned, scrubbed, attached, or the latest. */
  activePost: ExplorerPost | undefined;
  /** The post attached to the conversation, if any. */
  selectedPostId: string | undefined;
  setMetric: (metric: ExplorerMetric) => void;
  /** The day under the cursor on the plot. */
  scrub: (label: string | null) => void;
  /** Hold the chart on a post's day. */
  pin: (post: ExplorerPost | null) => void;
  /** Attach the post to the conversation. Absent where nothing can be attached. */
  select?: (post: ExplorerPost) => void;
}

const EngagementExplorerContext = createContext<EngagementExplorerValue | null>(
  null,
);

export function useEngagementExplorer(): EngagementExplorerValue {
  const value = useContext(EngagementExplorerContext);
  if (value === null) {
    throw new Error(
      "Engagement explorer parts render inside <EngagementExplorerProvider>.",
    );
  }
  return value;
}

interface EngagementExplorerProviderProps {
  data: ExplorerView;
  /** The post attached to the conversation, if any. */
  selectedPostId?: string;
  /** Pressing a post, on the chart or in the rail. */
  onSelectPost?: (post: ExplorerPost) => void;
  children: ReactNode;
}

export function EngagementExplorerProvider({
  data,
  selectedPostId,
  onSelectPost,
  children,
}: EngagementExplorerProviderProps) {
  const clipId = useId().replace(/:/g, "");
  const [metric, setMetric] = useState<ExplorerMetric>("reach");
  const [hoverLabel, setHoverLabel] = useState<string | null>(null);
  const [pinned, setPinned] = useState<ExplorerPost | null>(null);

  const scrubbed =
    hoverLabel === null ? undefined : data.postsByLabel.get(hoverLabel)?.[0];

  return (
    <EngagementExplorerContext.Provider
      value={{
        data,
        metric,
        spec: METRIC[metric],
        clipId,
        pinned,
        pinnedIndex:
          pinned === null ? undefined : data.labelIndex.get(pinned.label),
        activePost:
          pinned ??
          scrubbed ??
          data.posts.find((post) => post.id === selectedPostId) ??
          data.posts.at(-1),
        selectedPostId,
        setMetric,
        scrub: setHoverLabel,
        pin: setPinned,
        ...(onSelectPost === undefined ? {} : { select: onSelectPost }),
      }}
    >
      {children}
    </EngagementExplorerContext.Provider>
  );
}
