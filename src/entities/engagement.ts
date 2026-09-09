/**
 * People who engaged with client posts, and how well they fit the ICP. Follows
 * `engagement_profiles`, `engagement_profile_tags`, `engagement_comments`, and
 * `engagement_reactions`; snake_case stops here.
 */
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
