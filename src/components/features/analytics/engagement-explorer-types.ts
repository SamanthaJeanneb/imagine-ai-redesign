import type { ExplorerMetric } from "@/entities/engagement";

export const EXPLORER_METRICS: readonly ExplorerMetric[] = [
  "reach",
  "rate",
  "followers",
  "posts",
];

export function isExplorerMetric(value: string): value is ExplorerMetric {
  return EXPLORER_METRICS.some((metric) => metric === value);
}
