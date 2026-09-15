/**
 * People who engaged with client posts, and how well they fit the ICP. Follows
 * `engagement_profiles`, `engagement_profile_tags`, `engagement_comments`, and
 * `engagement_reactions`; snake_case stops here.
 */
import type { PostChipData } from "@/entities/post";
import type {
  EngagementCommentRow,
  EngagementProfileRow,
  EngagementProfileTagRow,
  EngagementReactionRow,
} from "@/entities/rows";

export interface EngagementProfile {
  id: string;
  name: string;
  headline: string;
  linkedinUrl: string | null;
  avatarUrl: string | null;
  title: string | null;
  company: string | null;
  followerCount: number | null;
}

/** The segments the ICP scorer assigns. Anything else reads as outside. */
export const ICP_CATEGORIES = [
  "Decision maker",
  "Champion",
  "Practitioner",
  "Peer",
  "Outside ICP",
] as const;

export type IcpCategory = (typeof ICP_CATEGORIES)[number];

export interface IcpTag {
  clientId: string;
  profileId: string;
  category: IcpCategory;
  /** 0 to 100. */
  score: number;
  signals: readonly string[];
}

/** Scores at or above this count as in the ICP. */
export const ICP_THRESHOLD = 60;

export interface EngagementComment {
  id: string;
  postId: string;
  profileId: string;
  text: string;
  url: string | null;
  at: string;
}

export interface EngagementReaction {
  id: string;
  postId: string;
  profileId: string;
  type: string;
  at: string;
}

/** Someone who reacted to or commented on a post, with their ICP read. */
export interface Engager {
  id: string;
  name: string;
  headline: string;
  avatarUrl?: string;
  category: IcpCategory;
  /** 0 to 100. */
  score: number;
  signals: readonly string[];
  action: "commented" | "reacted";
  /** The comment, when they left one. */
  excerpt?: string;
  commentId?: string;
}

export interface IcpPost {
  id: string;
  title: string;
  /** "2 Sep". */
  label: string;
  profileName: string;
  reach: number;
  engagers: readonly Engager[];
  /** Engagers at or above the ICP threshold. */
  icpCount: number;
  /** `icpCount / engagers`, 0 to 100. */
  icpShare: number;
  chip?: PostChipData;
}

export interface IcpData {
  posts: readonly IcpPost[];
}

/** Someone did something to one of your posts. */
export interface Interaction {
  id: string;
  kind: "comment" | "reaction";
  profileId: string;
  name: string;
  headline: string;
  avatarUrl?: string;
  category: IcpCategory;
  /** In the ICP: the row gets the accent and the reply is worth drafting. */
  icp: boolean;
  postId: string;
  postTitle: string;
  /** "2h ago". */
  when: string;
  /** The comment, or the reaction type ("insightful"). */
  excerpt: string;
  commentId?: string;
}

export type ExplorerMetric = "reach" | "rate" | "followers" | "posts";

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

export function transformEngagementProfileRow(
  row: EngagementProfileRow,
): EngagementProfile {
  return {
    id: row.id,
    name: row.name ?? "LinkedIn member",
    headline: row.headline ?? "",
    linkedinUrl: row.linkedin_url,
    avatarUrl: row.profile_picture_path,
    title: row.current_position?.title ?? null,
    company: row.current_position?.company ?? null,
    followerCount: row.follower_count,
  };
}

export function transformIcpTagRow(row: EngagementProfileTagRow): IcpTag {
  return {
    clientId: row.client_id,
    profileId: row.profile_id,
    category:
      ICP_CATEGORIES.find((category) => category === row.category) ??
      "Outside ICP",
    score: row.match_score ?? 0,
    signals: row.signals ?? [],
  };
}

export function transformEngagementCommentRow(
  row: EngagementCommentRow,
): EngagementComment {
  return {
    id: row.id,
    postId: row.post_id,
    profileId: row.profile_id,
    text: row.comment_text ?? "",
    url: row.comment_url,
    at: row.commented_at ?? "",
  };
}

export function transformEngagementReactionRow(
  row: EngagementReactionRow,
): EngagementReaction {
  return {
    id: row.id,
    postId: row.post_id,
    profileId: row.profile_id,
    type: row.reaction_type,
    at: row.created_at,
  };
}
