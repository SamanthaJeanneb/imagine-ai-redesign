"use client";

import {
  EXPLORER_METRICS,
  type ExplorerMetric,
  isExplorerMetric,
} from "@/components/features/analytics/engagement-explorer-types";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { formatCompact } from "@/lib/format";

export interface MetricSpec {
  label: string;
  short: string;
  format: (value: number) => string;
}

export const METRIC: Record<ExplorerMetric, MetricSpec> = {
  reach: { label: "Reach", short: "Reach", format: formatCompact },
  rate: {
    label: "Engagement rate",
    short: "Eng. rate",
    format: (value) => `${value.toFixed(1)}%`,
  },
  followers: {
    label: "Followers gained",
    short: "+ Followers",
    format: (value) => (value > 0 ? `+${formatCompact(value)}` : "0"),
  },
  posts: { label: "Posts", short: "Posts", format: (value) => String(value) },
};

/** The metric switch, so the panel and its skeleton carry the same header. */
export function MetricTabs({
  value,
  onValueChange,
  disabled,
}: {
  value: ExplorerMetric;
  onValueChange?: (metric: ExplorerMetric) => void;
  disabled?: boolean;
}) {
  return (
    <ToggleGroup
      size="sm"
      value={value}
      disabled={disabled}
      onValueChange={(next) => {
        if (isExplorerMetric(next)) onValueChange?.(next);
      }}
      aria-label="Metric"
    >
      {EXPLORER_METRICS.map((key) => (
        <ToggleGroupItem key={key} value={key}>
          {METRIC[key].short}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
