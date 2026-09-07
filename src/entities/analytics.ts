/**
 * Analytics shapes as `app/(with-sidebar)/analytics/_internal/types` has them,
 * so the redesigned screens read the same summary the app already computes.
 */

export type TimeRange = "7d" | "1m" | "3m" | "6m" | "1y" | "all";

export interface AnalyticsTotals {
  totalImpressions: number;
  avgEngagementRate: number;
  totalFollowersGained: number;
  totalProfileViews: number;
  totalPosts: number;
}

export interface AnalyticsSummary extends AnalyticsTotals {
  previousPeriod?: AnalyticsTotals;
}

/** Days behind "now" each range covers. `all` reaches back far enough to hold everything. */
export const RANGE_DAYS: Record<TimeRange, number> = {
  "7d": 7,
  "1m": 30,
  "3m": 90,
  "6m": 182,
  "1y": 365,
  all: 36_500,
};
