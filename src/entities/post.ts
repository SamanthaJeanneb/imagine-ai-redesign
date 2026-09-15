/**
 * Post shapes as the app has them today: `ClientPostStatus` from the database
 * constraint, `MediaFile` from `shared/types`, and the LinkedIn analytics payload
 * that `PostWithAnalytics` reads.
 */
import type { AssetTileData } from "@/entities/asset";
import type { ClientPostRow } from "@/entities/rows";

/** Status values allowed by the `client_posts` database constraint. */
export const CLIENT_POST_STATUS = [
  "idea",
  "planned",
  "in_review",
  "scheduled",
  "published",
  "failed",
] as const;

export type ClientPostStatus = (typeof CLIENT_POST_STATUS)[number];

/** A storage object reference. `shared/types/MediaFile` in the app. */
export interface MediaFile {
  bucket: string;
  path: string;
}

export interface PostAnalytics {
  impressions: number;
  engagements: number;
  engagement_rate: number;
  clicks: number;
  clickthrough_rate: number;
  profile_viewers_from_this_post: number;
  followers_gained_from_this_post: number;
  members_reached: number;
  reactions: number;
  comments: number;
  reposts: number;
}

export interface Post {
  id: string;
  clientId: string;
  content: string;
  status: ClientPostStatus;
  scheduledAt: string | null;
  linkedinPostId: string | null;
  media: MediaFile[] | null;
  analytics: PostAnalytics | null;
  notes: string | null;
  postLabel: string | null;
  createdAt: string;
  updatedAt: string;
}

export type PostChipStatus =
  "draft" | "in_review" | "scheduled" | "published" | "failed";

export interface PostEngagementPerson {
  id: string;
  name: string;
  headline: string;
  avatarUrl?: string;
}

interface PostEngagementComment {
  id: string;
  author: PostEngagementPerson;
  body: string;
  when: string;
}

export interface PostEngagement {
  reactors: readonly (PostEngagementPerson & { reaction: string })[];
  comments: readonly PostEngagementComment[];
}

export interface PostChipData {
  id: string;
  /** The first line of the post, for search results, rows, and labels. */
  title: string;
  /** "9:00". */
  time: string;
  /** Short profile label, e.g. initials or first name. */
  profile: string;
  status: PostChipStatus;
  /** Every label on the post. The first is the one the chip shows. */
  labels?: readonly string[];
  /** When present, hovering the chip previews the post as it will appear. */
  preview?: LinkedInPostContent;
  /** Captured LinkedIn people and comments, available after publishing. */
  engagement?: PostEngagement;
}

export interface PostAuthor {
  name: string;
  headline: string;
  avatarUrl?: string;
  /** Company pages get a square avatar, as on LinkedIn. Default `person`. */
  kind?: "person" | "company";
}

/** Counts LinkedIn reports back after a post goes out. */
export interface LinkedInPostStats {
  reactions: number;
  comments: number;
  reposts: number;
  impressions?: number;
}

/** Everything needed to render a post the way LinkedIn will. */
export interface LinkedInPostContent {
  author: PostAuthor;
  body: string;
  media?: readonly AssetTileData[];
  /** Present once the post has gone out and LinkedIn has reported back. */
  stats?: LinkedInPostStats;
}

/**
 * Six database statuses, five chip looks: ideas and planned posts read as
 * drafts; in review keeps its own color on the calendar.
 */
const CHIP_STATUS: Record<ClientPostStatus, PostChipStatus> = {
  idea: "draft",
  planned: "draft",
  in_review: "in_review",
  scheduled: "scheduled",
  published: "published",
  failed: "failed",
};

export function toChipStatus(status: ClientPostStatus): PostChipStatus {
  return CHIP_STATUS[status];
}

export function transformPostRow(row: ClientPostRow): Post {
  return {
    id: row.id,
    clientId: row.client_id,
    content: row.content,
    status:
      CLIENT_POST_STATUS.find((status) => status === row.status) ?? "idea",
    scheduledAt: row.scheduled_at,
    linkedinPostId: row.linkedin_post_id,
    media: row.media,
    analytics: row.analytics,
    notes: row.notes,
    postLabel: row.post_label,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
