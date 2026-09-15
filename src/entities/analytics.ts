/**
 * Analytics shapes as `app/(with-sidebar)/analytics/_internal/types` has them,
 * so the redesigned screens read the same summary the app already computes.
 */
import type { AssetTileData } from "@/entities/asset";
import type { PostChipData } from "@/entities/post";

export type TimeRange = "7d" | "1m" | "3m" | "6m" | "1y" | "all";

export interface AnalyticsTotals {
  totalImpressions: number;
  avgEngagementRate: number;
  totalFollowersGained: number;
  totalProfileViews: number;
  totalPosts: number;
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

/** One thing the agent noticed, and what to say to follow it up. */
export interface Insight {
  id: string;
  text: string;
  /** What pressing the insight says on the user's behalf. */
  prompt: string;
  /** Which scripted reply answers it. Default `default`. */
  intent?: string;
}

export interface ProfileOption {
  id: string;
  name: string;
}

export interface ProfileMetric {
  id: string;
  name: string;
  avatarUrl?: string;
  /** Company pages get a square avatar. Default `person`. */
  kind?: "person" | "company";
  /** Raw number, used to size the bar. */
  value: number;
  /** Already formatted, e.g. "4.1k". */
  valueLabel: string;
}

export interface StatDelta {
  /** Already formatted, e.g. "+12%". */
  label: string;
  direction: "up" | "down" | "flat";
}

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

/**
 * The plots mock data can name (`PreviewChart`, a chart message part). The
 * name becomes a tree in one place: `CHART_PLOT_BY_KIND` and
 * `CHART_PREVIEW_BY_KIND`. Composed charts need a mark per series, so they are
 * assembled in JSX with `ComposedChartSeries` and never named by kind.
 */
export type ChartKind = "bar" | "area" | "hbar";

export interface ChartSeries {
  key: string;
  label: string;
  /** Follows the value in the tooltip and the bar labels, e.g. `%`. */
  unit?: string;
}

export type ChartDatum = { label: string } & Record<string, string | number>;

/** One hour on one weekday. */
export interface TimeSlot {
  /** 0 Monday … 6 Sunday. */
  day: number;
  /** 0 to 23, local to the audience. */
  hour: number;
  /** 0 to 1: how well posts in this slot have done, relative to the best slot. */
  score: number;
  /** How many posts in the window went out here. */
  posts: number;
  /** Mean engagement rate of those posts, percent. 0 when none. */
  rate: number;
}

export interface BestTimeData {
  slots: readonly TimeSlot[];
  /** The three strongest slots, best first. */
  best: readonly TimeSlot[];
  /** The first hour shown and the last, inclusive. */
  hours: readonly [number, number];
}

export interface TeamMember {
  id: string;
  name: string;
  avatarUrl?: string;
  isCompany: boolean;
  posts: number;
  /** Total impressions in the window. */
  reach: number;
  /** Mean engagement rate, percent. */
  rate: number;
  followers: number;
  /** The post label they do best in, by average reach. */
  bestCategory?: string;
}

/** One category, with a value per member id. */
export type TeamDatum = { label: string } & Record<string, string | number>;

export interface TeamData {
  members: readonly TeamMember[];
  /** Average reach per post, by category, one key per member. */
  reach: readonly TeamDatum[];
  /** Mean engagement rate (percent), by category, one key per member. */
  rate: readonly TeamDatum[];
}

/** The team with its leaderboard order settled for each metric. */
export interface TeamView extends TeamData {
  /** Members best first. The position in the array is the rank. */
  ranked: Record<"reach" | "rate", readonly TeamMember[]>;
}
