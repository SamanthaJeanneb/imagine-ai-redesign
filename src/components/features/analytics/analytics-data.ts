import type { ChartDatum, TimeRange } from "@/entities/analytics";
import type { ExplorerPoint } from "@/entities/engagement";
import type {
  AnalyticsSections,
  AnalyticsSnapshot,
} from "@/services/analytics";

/** What the page shows before any snapshot matches: every chart empty. */
const EMPTY_SNAPSHOT: AnalyticsSnapshot = {
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
    postsByLabel: new Map(),
    labelIndex: new Map(),
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

/**
 * The comparison panels read a fixed 90-day window, so they are cut by
 * profile only.
 */
export function sectionsFor(
  sections: readonly AnalyticsSections[],
  profileId: string,
): AnalyticsSections | undefined {
  return (
    sections.find((section) => section.profileId === profileId) ?? sections[0]
  );
}

/** The impressions trend as a sheet: one row a day. */
export function impressionsCsvRows(
  data: readonly ChartDatum[],
): readonly (readonly (string | number)[])[] {
  return [
    ["Date", "Impressions"],
    ...data.map((datum) => [
      datum.label,
      typeof datum["impressions"] === "number" ? datum["impressions"] : 0,
    ]),
  ];
}

/** Every explorer metric as a sheet: one row a day. */
export function explorerCsvRows(
  points: readonly ExplorerPoint[],
): readonly (readonly (string | number)[])[] {
  return [
    ["Date", "Reach", "Engagement rate", "Followers", "Posts", "Pipeline"],
    ...points.map((point) => [
      point.day,
      point.reach,
      point.rate,
      point.followers,
      point.posts,
      point.pipeline,
    ]),
  ];
}

/** One CSV field, quoted so a comma or a quote in the text cannot break the row. */
function csvCell(value: string | number): string {
  const text = String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

/** Hands the rows to the browser as a file, header row first. */
export function downloadCsv(
  rows: readonly (readonly (string | number)[])[],
  filename: string,
): void {
  const csv = rows.map((row) => row.map(csvCell).join(",")).join("\n");
  const url = URL.createObjectURL(
    new Blob([csv], { type: "text/csv;charset=utf-8" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
