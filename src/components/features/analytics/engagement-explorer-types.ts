import type { PostChipData } from "@/components/features/calendar/post-chip";

export type ExplorerMetric = "reach" | "rate" | "followers" | "posts";

export const EXPLORER_METRICS: readonly ExplorerMetric[] = [
  "reach",
  "rate",
  "followers",
  "posts",
];

/** One day in the window. Rates are percentages, already × 100. */
export interface ExplorerPoint {
  /** Axis text, e.g. "2 Sep". */
  label: string;
  /** `YYYY-MM-DD`, what posts join on. */
  day: string;
  reach: number;
  rate: number;
  followers: number;
  posts: number;
  /** Running count of CRM contacts who came in through a post. */
  pipeline: number;
}

/** A post published inside the window, placed on the chart by `label`. */
export interface ExplorerPost {
  id: string;
  day: string;
  label: string;
  title: string;
  profileName: string;
  avatarUrl?: string;
  isCompany: boolean;
  category?: string;
  reach: number;
  rate: number;
  followers: number;
  comments: number;
  /** Lets the post be attached to the conversation. */
  chip?: PostChipData;
}

export interface ExplorerData {
  points: readonly ExplorerPoint[];
  posts: readonly ExplorerPost[];
  /** Which labels get an axis tick. */
  xTicks: readonly string[];
  totals: Record<ExplorerMetric, number>;
  pipeline: {
    /** Contacts attributed to content at the end of the window. */
    contacts: number;
    /** Open or won deals with one of those contacts on them. */
    opportunities: number;
    /** Their value, summed. */
    amount: number;
  };
}
