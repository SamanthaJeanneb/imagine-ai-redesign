import type { TimeRange } from "@/entities/analytics";
import type { AnalyticsSnapshot } from "@/services/analytics";

/** What the page shows before any snapshot matches: every chart empty. */
export const EMPTY_SNAPSHOT: AnalyticsSnapshot = {
  range: "1m",
  profileId: "all",
  overview: {
    stats: [],
    impressions: { data: [], series: [] },
    byLabel: { data: [], series: [] },
    byProfile: [],
    topPosts: [],
  },
  explorer: {
    points: [],
    posts: [],
    xTicks: [],
    totals: { reach: 0, rate: 0, followers: 0, posts: 0 },
    pipeline: { contacts: 0, opportunities: 0, amount: 0 },
  },
};

/**
 * The precomputed snapshot for a range and profile. The server ships the whole
 * small matrix, so changing a control is a lookup rather than a request.
 */
export function snapshotFor(
  snapshots: readonly AnalyticsSnapshot[],
  range: TimeRange,
  profileId: string,
): AnalyticsSnapshot {
  return (
    snapshots.find(
      (snapshot) =>
        snapshot.range === range && snapshot.profileId === profileId,
    ) ??
    snapshots[0] ??
    EMPTY_SNAPSHOT
  );
}

/** One CSV field, quoted so a comma or a quote in the text cannot break the row. */
export function csvCell(value: string | number): string {
  const text = String(value);
  return `"${text.replaceAll('"', '""')}"`;
}
