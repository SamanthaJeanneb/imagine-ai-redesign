/**
 * Accounts a client watches and the posts scraped from them: the benchmark
 * set. Follows `targeted_accounts` and `targeted_posts`.
 */
import type { TargetedAccountRow, TargetedPostRow } from "@/entities/rows";

export interface TargetedAccount {
  id: string;
  clientId: string;
  name: string;
  headline: string;
  profileUrl: string;
  avatarUrl: string | null;
  /** Company pages live under `/company/`; people under `/in/`. */
  isCompany: boolean;
}

export interface TargetedPost {
  id: string;
  accountId: string;
  text: string;
  url: string;
  postedAt: string;
  likes: number;
  comments: number;
  shares: number;
}

export function transformTargetedAccountRow(
  row: TargetedAccountRow,
): TargetedAccount {
  return {
    id: row.id,
    clientId: row.client_id,
    name: row.name,
    headline: row.headline ?? "",
    profileUrl: row.profile_url,
    avatarUrl: row.profile_picture,
    isCompany: row.profile_url.includes("/company/"),
  };
}

export function transformTargetedPostRow(row: TargetedPostRow): TargetedPost {
  return {
    id: row.id,
    accountId: row.targeted_account_id,
    text: row.text,
    url: row.post_url,
    postedAt: row.posted_at ?? "",
    likes: row.engagement_likes ?? 0,
    comments: row.engagement_comments ?? 0,
    shares: row.engagement_shares ?? 0,
  };
}
