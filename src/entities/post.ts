/**
 * Post shapes as the app has them today: `ClientPostStatus` from the database
 * constraint, `MediaFile` from `shared/types`, and the LinkedIn analytics payload
 * that `PostWithAnalytics` reads.
 */
import type { PostChipStatus } from "@/components/features/calendar/post-chip";
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
