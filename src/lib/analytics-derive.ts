import type { TeamMember } from "@/entities/analytics";
import type {
  ExplorerPoint,
  ExplorerPost,
  IcpPost,
  IcpScatterPoint,
} from "@/entities/engagement";

/**
 * The joins the explorer's chart and its rail read off. Kept beside the data
 * rather than worked out while rendering, so a post can find its axis label
 * and an axis label its posts in one step.
 */
export function explorerIndex(
  points: readonly ExplorerPoint[],
  posts: readonly ExplorerPost[],
): {
  postsByLabel: ReadonlyMap<string, readonly ExplorerPost[]>;
  labelIndex: ReadonlyMap<string, number>;
} {
  const postsByLabel = new Map<string, ExplorerPost[]>();
  for (const post of posts) {
    const list = postsByLabel.get(post.label);
    if (list) list.push(post);
    else postsByLabel.set(post.label, [post]);
  }

  return {
    postsByLabel,
    labelIndex: new Map(points.map((point, index) => [point.label, index])),
  };
}

/** One post as a bubble: reach against ICP share, sized by the crowd. */
export function icpScatterPoints(
  posts: readonly IcpPost[],
): readonly IcpScatterPoint[] {
  return posts.map((post) => ({
    id: post.id,
    title: post.title,
    reach: post.reach,
    icpShare: post.icpShare,
    engagerCount: post.engagers.length,
  }));
}

/** The leaderboard for each metric. A member's position is their rank. */
export function rankTeamMembers(
  members: readonly TeamMember[],
): Record<"reach" | "rate", readonly TeamMember[]> {
  return {
    reach: members.toSorted((a, b) => b.reach - a.reach),
    rate: members.toSorted((a, b) => b.rate - a.rate),
  };
}
