import type { Insight } from "@/components/features/analytics/ask-imagine";
import type {
  BenchmarkData,
  BenchmarkProfile,
  Competitor,
} from "@/components/features/analytics/benchmark-panel";
import type {
  BestTimeData,
  TimeSlot,
} from "@/components/features/analytics/best-time-grid";
import type {
  ExplorerData,
  ExplorerMetric,
  ExplorerPoint,
  ExplorerPost,
} from "@/components/features/analytics/engagement-explorer";
import type {
  Engager,
  IcpData,
  IcpPost,
} from "@/components/features/analytics/icp-posts";
import type { Interaction } from "@/components/features/analytics/interaction-feed";
import type {
  TeamData,
  TeamDatum,
  TeamMember,
} from "@/components/features/analytics/team-performance";
import { RANGE_DAYS, type TimeRange } from "@/entities/analytics";
import type { Client } from "@/entities/client";
import {
  CONTENT_SOURCE,
  transformCrmContactRow,
  transformCrmOpportunityRow,
} from "@/entities/crm";
import {
  type EngagementProfile,
  ICP_THRESHOLD,
  type IcpTag,
  transformEngagementCommentRow,
  transformEngagementProfileRow,
  transformEngagementReactionRow,
  transformIcpTagRow,
} from "@/entities/engagement";
import type { Post } from "@/entities/post";
import {
  transformTargetedAccountRow,
  transformTargetedPostRow,
} from "@/entities/competitor";
import {
  formatCompact,
  formatDayMonth,
  formatRelative,
  toDateKey,
  toTitle,
  weekdayIndex,
} from "@/lib/format";
import { getDb, getNow } from "@/mocks/db";
import { getWorkspaceLogoUrl } from "@/services/workspace";
import {
  indexAssetsByPath,
  indexClients,
  publishedPosts,
  toPostChip,
} from "@/services/posts";

/**
 * Selectors for the engagement side of analytics: who engaged, how the team
 * and the competition compare, when to post, and what the CRM says came of
 * it. Everything reads the mock once per call and returns component props.
 */

const DAY_MS = 24 * 60 * 60 * 1000;
/** The fixed window the comparison panels use. */
const BENCH_DAYS = 90;
/**
 * How a post's impressions land over its first week. LinkedIn front-loads
 * distribution; the tail is what the daily line is built from.
 */
const DECAY = [0.42, 0.24, 0.13, 0.08, 0.06, 0.04, 0.03] as const;
/** Grid hours, inclusive. */
const GRID_HOURS: readonly [number, number] = [6, 20];

function publishedAt(post: Post): string {
  return post.scheduledAt ?? post.updatedAt;
}

function scopedPosts(profileId: string, sinceIso: string): readonly Post[] {
  return publishedPosts().filter(
    (post) =>
      (profileId === "all" || post.clientId === profileId) &&
      publishedAt(post) >= sinceIso,
  );
}

function sinceIso(days: number): string {
  return new Date(getNow().getTime() - days * DAY_MS).toISOString();
}

function mean(values: readonly number[]): number {
  if (values.length === 0) return 0;
  let total = 0;
  for (const value of values) total += value;
  return total / values.length;
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function clientAvatar(client: Client | undefined): { avatarUrl?: string } {
  return client?.profilePicturePath === null ||
    client?.profilePicturePath === undefined
    ? {}
    : { avatarUrl: client.profilePicturePath };
}

/* Engagement tables, indexed once per call. */
interface EngagementIndex {
  profiles: ReadonlyMap<string, EngagementProfile>;
  /** `${clientId}:${profileId}` → tag. */
  tags: ReadonlyMap<string, IcpTag>;
  /** The org's read of a profile when no client has its own. */
  tagsByProfile: ReadonlyMap<string, IcpTag>;
  commentsByPost: ReadonlyMap<
    string,
    readonly ReturnType<typeof transformEngagementCommentRow>[]
  >;
  reactionsByPost: ReadonlyMap<
    string,
    readonly ReturnType<typeof transformEngagementReactionRow>[]
  >;
}

function indexEngagement(): EngagementIndex {
  const db = getDb().app;
  const profiles = new Map(
    db.engagement_profiles.map((row) => {
      const profile = transformEngagementProfileRow(row);
      return [profile.id, profile];
    }),
  );
  const tags = new Map(
    db.engagement_profile_tags.map((row) => {
      const tag = transformIcpTagRow(row);
      return [`${tag.clientId}:${tag.profileId}`, tag];
    }),
  );
  const tagsByProfile = new Map<string, IcpTag>();
  for (const tag of tags.values()) {
    const current = tagsByProfile.get(tag.profileId);
    if (current === undefined || tag.score > current.score) {
      tagsByProfile.set(tag.profileId, tag);
    }
  }
  const commentsByPost = new Map<
    string,
    ReturnType<typeof transformEngagementCommentRow>[]
  >();
  for (const row of db.engagement_comments) {
    const comment = transformEngagementCommentRow(row);
    const list = commentsByPost.get(comment.postId);
    if (list) list.push(comment);
    else commentsByPost.set(comment.postId, [comment]);
  }
  const reactionsByPost = new Map<
    string,
    ReturnType<typeof transformEngagementReactionRow>[]
  >();
  for (const row of db.engagement_reactions) {
    const reaction = transformEngagementReactionRow(row);
    const list = reactionsByPost.get(reaction.postId);
    if (list) list.push(reaction);
    else reactionsByPost.set(reaction.postId, [reaction]);
  }
  return { profiles, tags, tagsByProfile, commentsByPost, reactionsByPost };
}

function tagFor(
  index: EngagementIndex,
  clientId: string,
  profileId: string,
): IcpTag {
  return (
    index.tags.get(`${clientId}:${profileId}`) ??
    index.tagsByProfile.get(profileId) ?? {
      clientId,
      profileId,
      category: "Outside ICP",
      score: 0,
      signals: [],
    }
  );
}

function profileAvatar(profile: EngagementProfile): { avatarUrl?: string } {
  return profile.avatarUrl === null ? {} : { avatarUrl: profile.avatarUrl };
}

/* ---------------------------------------------------------------- explorer */

/** Axis ticks thinned to fit: every label for a week, then every few days. */
function pickTicks(points: readonly ExplorerPoint[]): readonly string[] {
  const step = points.length <= 7 ? 1 : points.length <= 31 ? 5 : 15;
  const ticks = points
    .filter((_, index) => index % step === 0)
    .map((point) => point.label);
  const last = points.at(-1)?.label;
  if (last !== undefined && !ticks.includes(last)) ticks.push(last);
  return ticks;
}

/**
 * The engagement explorer: a daily line for the window with posts spread over
 * their first week, the CRM's content-attributed contacts as a running count,
 * and the posts themselves as markers.
 */
export function getEngagementExplorer(
  range: TimeRange = "1m",
  profileId = "all",
): ExplorerData {
  const clients = indexClients();
  const assets = indexAssetsByPath();
  const now = getNow();
  const days = RANGE_DAYS[range];
  const start = new Date(now.getTime() - (days - 1) * DAY_MS);
  const startKey = toDateKey(start);

  const impressions = new Array<number>(days).fill(0);
  const engagements = new Array<number>(days).fill(0);
  const followers = new Array<number>(days).fill(0);
  const counts = new Array<number>(days).fill(0);
  const dayIndex = (iso: string): number =>
    Math.floor((new Date(iso).getTime() - start.getTime()) / DAY_MS);

  // Posts from the week before the window still decay into it.
  const spread = scopedPosts(profileId, sinceIso(days - 1 + DECAY.length));
  const inWindow: Post[] = [];
  for (const post of spread) {
    const analytics = post.analytics;
    if (analytics === null) continue;
    const first = dayIndex(publishedAt(post));
    if (first >= 0) {
      counts[first] = (counts[first] ?? 0) + 1;
      inWindow.push(post);
    }
    DECAY.forEach((share, offset) => {
      const at = first + offset;
      if (at < 0 || at >= days) return;
      impressions[at] = (impressions[at] ?? 0) + analytics.impressions * share;
      engagements[at] = (engagements[at] ?? 0) + analytics.engagements * share;
      followers[at] =
        (followers[at] ?? 0) +
        analytics.followers_gained_from_this_post * share;
    });
  }

  const contacts = getDb()
    .app.crm_contacts.map(transformCrmContactRow)
    .filter((contact) => contact.source === CONTENT_SOURCE)
    .toSorted((a, b) => a.createdAt.localeCompare(b.createdAt));

  const points: ExplorerPoint[] = [];
  let cursor = 0;
  for (let index = 0; index < days; index += 1) {
    const day = new Date(start.getTime() + index * DAY_MS);
    const key = toDateKey(day);
    while (
      cursor < contacts.length &&
      (contacts[cursor]?.createdAt ?? "").slice(0, 10) <= key
    ) {
      cursor += 1;
    }
    const reach = Math.round(impressions[index] ?? 0);
    const engaged = engagements[index] ?? 0;
    points.push({
      label: formatDayMonth(day.toISOString()),
      day: key,
      reach,
      rate: reach === 0 ? 0 : round1((engaged / reach) * 100),
      followers: Math.round(followers[index] ?? 0),
      posts: counts[index] ?? 0,
      pipeline: cursor,
    });
  }

  const posts: ExplorerPost[] = inWindow
    .toSorted((a, b) => publishedAt(a).localeCompare(publishedAt(b)))
    .map((post) => {
      const client = clients.get(post.clientId);
      const analytics = post.analytics;
      return {
        id: post.id,
        day: publishedAt(post).slice(0, 10),
        label: formatDayMonth(publishedAt(post)),
        title: toTitle(post.content, 64),
        profileName: client?.name ?? "Unknown profile",
        ...clientAvatar(client),
        isCompany: client?.isCompany ?? false,
        ...(post.postLabel === null ? {} : { category: post.postLabel }),
        reach: analytics?.impressions ?? 0,
        rate: round1((analytics?.engagement_rate ?? 0) * 100),
        followers: analytics?.followers_gained_from_this_post ?? 0,
        comments: analytics?.comments ?? 0,
        ...(client === undefined
          ? {}
          : { chip: toPostChip(post, client, assets) }),
      };
    });

  let totalReach = 0;
  let totalEngaged = 0;
  let totalFollowers = 0;
  for (const post of inWindow) {
    totalReach += post.analytics?.impressions ?? 0;
    totalEngaged += post.analytics?.engagements ?? 0;
    totalFollowers += post.analytics?.followers_gained_from_this_post ?? 0;
  }
  const totals: Record<ExplorerMetric, number> = {
    reach: totalReach,
    rate: totalReach === 0 ? 0 : round1((totalEngaged / totalReach) * 100),
    followers: totalFollowers,
    posts: inWindow.length,
  };

  const contentMergeIds = new Set(
    contacts
      .filter((contact) => contact.createdAt >= startKey)
      .map((contact) => contact.mergeId),
  );
  const allContentIds = new Set(contacts.map((contact) => contact.mergeId));
  const opportunities = getDb()
    .app.crm_opportunities.map(transformCrmOpportunityRow)
    .filter(
      (deal) =>
        deal.status !== "lost" &&
        deal.contactMergeIds.some((id) => allContentIds.has(id)),
    );
  let amount = 0;
  for (const deal of opportunities) amount += deal.amount;

  return {
    points,
    posts,
    xTicks: pickTicks(points),
    totals,
    pipeline: {
      contacts: contentMergeIds.size,
      opportunities: opportunities.length,
      amount,
    },
  };
}

/* --------------------------------------------------------------- benchmark */

/** Rough topic from the text, for "what they post". Order is priority. */
const TOPIC_RULES: readonly [RegExp, string][] = [
  [/attribution|window|model/i, "Attribution"],
  [/pipeline|revenue|deal|quota/i, "Pipeline"],
  [/hir(e|ing)|team|joined|role/i, "Hiring"],
  [/customer|call|churn|renew/i, "Customers"],
  [/ship|launch|feature|product|roadmap/i, "Product"],
  [/pric(e|ing)|discount/i, "Pricing"],
  [/post|content|linkedin|writing/i, "Content"],
  [/founder|ceo|leadership|board/i, "Leadership"],
  [/data|report|dashboard|metric/i, "Data"],
];

function topicOf(text: string): string {
  for (const [pattern, topic] of TOPIC_RULES) {
    if (pattern.test(text)) return topic;
  }
  return "Opinion";
}

function topTopics(texts: readonly string[], limit = 3): readonly string[] {
  const counts = new Map<string, number>();
  for (const text of texts) {
    const topic = topicOf(text);
    counts.set(topic, (counts.get(topic) ?? 0) + 1);
  }
  return [...counts.entries()]
    .toSorted(([, a], [, b]) => b - a)
    .slice(0, limit)
    .map(([topic]) => topic);
}

/** Your profiles against the accounts they watch, over the last 90 days. */
export function getBenchmark(profileId = "all"): BenchmarkData {
  const clients = indexClients();
  const since = sinceIso(BENCH_DAYS);
  const weeks = BENCH_DAYS / 7;
  const yours = scopedPosts(profileId, since);
  const client = profileId === "all" ? undefined : clients.get(profileId);

  const logoUrl = client === undefined ? getWorkspaceLogoUrl() : undefined;
  const you: BenchmarkProfile = {
    id: profileId,
    name: client?.name ?? "Your profiles",
    headline: client?.description ?? `${String(clients.size)} profiles`,
    ...(client === undefined
      ? logoUrl === undefined
        ? {}
        : { avatarUrl: logoUrl }
      : clientAvatar(client)),
    isCompany: client?.isCompany ?? true,
    postsPerWeek: round1(yours.length / weeks),
    avgReactions: Math.round(
      mean(yours.map((post) => post.analytics?.reactions ?? 0)),
    ),
    avgComments: Math.round(
      mean(yours.map((post) => post.analytics?.comments ?? 0)),
    ),
    avgShares: Math.round(
      mean(yours.map((post) => post.analytics?.reposts ?? 0)),
    ),
    topics: topTopics(yours.map((post) => post.postLabel ?? post.content)),
  };

  const db = getDb().app;
  const postsByAccount = new Map<
    string,
    ReturnType<typeof transformTargetedPostRow>[]
  >();
  for (const row of db.targeted_posts) {
    const post = transformTargetedPostRow(row);
    if (post.postedAt < since) continue;
    const list = postsByAccount.get(post.accountId);
    if (list) list.push(post);
    else postsByAccount.set(post.accountId, [post]);
  }

  const competitors: Competitor[] = db.targeted_accounts
    .map(transformTargetedAccountRow)
    .filter((account) => profileId === "all" || account.clientId === profileId)
    .map((account) => {
      const posts = (postsByAccount.get(account.id) ?? []).toSorted((a, b) =>
        b.postedAt.localeCompare(a.postedAt),
      );
      return {
        id: account.id,
        name: account.name,
        headline: account.headline,
        ...(account.avatarUrl === null ? {} : { avatarUrl: account.avatarUrl }),
        isCompany: account.isCompany,
        postsPerWeek: round1(posts.length / weeks),
        avgReactions: Math.round(mean(posts.map((post) => post.likes))),
        avgComments: Math.round(mean(posts.map((post) => post.comments))),
        avgShares: Math.round(mean(posts.map((post) => post.shares))),
        topics: topTopics(posts.map((post) => post.text)),
        recent: posts.slice(0, 3).map((post) => ({
          id: post.id,
          excerpt: toTitle(post.text, 110),
          label: formatDayMonth(post.postedAt),
          reactions: post.likes,
          comments: post.comments,
        })),
      };
    })
    .toSorted((a, b) => b.avgReactions - a.avgReactions);

  return { you, competitors };
}

/* --------------------------------------------------------------------- ICP */

/** Posts with everyone who engaged them and how well those people fit. */
export function getIcpPosts(profileId = "all", limit = 8): IcpData {
  const clients = indexClients();
  const assets = indexAssetsByPath();
  const index = indexEngagement();

  const posts: IcpPost[] = scopedPosts(profileId, sinceIso(BENCH_DAYS))
    .toSorted(
      (a, b) =>
        (b.analytics?.impressions ?? 0) - (a.analytics?.impressions ?? 0),
    )
    .slice(0, limit)
    .map((post) => {
      const client = clients.get(post.clientId);
      const comments = index.commentsByPost.get(post.id) ?? [];
      const reactions = index.reactionsByPost.get(post.id) ?? [];
      const commentBy = new Map(
        comments.map((comment) => [comment.profileId, comment]),
      );
      const seen = new Set<string>();
      const engagers: Engager[] = [];
      for (const profileIdOf of [
        ...comments.map((comment) => comment.profileId),
        ...reactions.map((reaction) => reaction.profileId),
      ]) {
        if (seen.has(profileIdOf)) continue;
        seen.add(profileIdOf);
        const profile = index.profiles.get(profileIdOf);
        if (profile === undefined) continue;
        const tag = tagFor(index, post.clientId, profileIdOf);
        const comment = commentBy.get(profileIdOf);
        engagers.push({
          id: profile.id,
          name: profile.name,
          headline: profile.headline,
          ...profileAvatar(profile),
          category: tag.category,
          score: tag.score,
          signals: tag.signals,
          action: comment === undefined ? "reacted" : "commented",
          ...(comment === undefined
            ? {}
            : { excerpt: comment.text, commentId: comment.id }),
        });
      }
      engagers.sort((a, b) => b.score - a.score);
      const icpCount = engagers.filter(
        (engager) => engager.score >= ICP_THRESHOLD,
      ).length;
      return {
        id: post.id,
        title: toTitle(post.content, 64),
        label: formatDayMonth(publishedAt(post)),
        profileName: client?.name ?? "Unknown profile",
        reach: post.analytics?.impressions ?? 0,
        engagers,
        icpCount,
        icpShare:
          engagers.length === 0
            ? 0
            : Math.round((icpCount / engagers.length) * 100),
        ...(client === undefined
          ? {}
          : { chip: toPostChip(post, client, assets) }),
      };
    });

  return { posts };
}

/* -------------------------------------------------------------------- team */

/** Every profile against every post label, over the last 90 days. */
export function getTeamPerformance(): TeamData {
  const clients = indexClients();
  const posts = scopedPosts("all", sinceIso(BENCH_DAYS));
  const categories = [
    ...new Set(
      posts.flatMap((post) =>
        post.postLabel === null ? [] : [post.postLabel],
      ),
    ),
  ].toSorted();

  const members: TeamMember[] = [...clients.values()]
    .map((client) => {
      const own = posts.filter((post) => post.clientId === client.id);
      if (own.length === 0) return null;
      let reach = 0;
      let followers = 0;
      for (const post of own) {
        reach += post.analytics?.impressions ?? 0;
        followers += post.analytics?.followers_gained_from_this_post ?? 0;
      }
      let bestCategory: string | undefined;
      let bestReach = 0;
      for (const category of categories) {
        const inCategory = own.filter((post) => post.postLabel === category);
        const average = mean(
          inCategory.map((post) => post.analytics?.impressions ?? 0),
        );
        if (average > bestReach) {
          bestReach = average;
          bestCategory = category;
        }
      }
      return {
        id: client.id,
        name: client.name,
        ...clientAvatar(client),
        isCompany: client.isCompany,
        posts: own.length,
        reach,
        rate: round1(
          mean(own.map((post) => (post.analytics?.engagement_rate ?? 0) * 100)),
        ),
        followers,
        ...(bestCategory === undefined ? {} : { bestCategory }),
      };
    })
    .filter((member): member is TeamMember => member !== null);

  const datum = (
    category: string,
    pick: (post: Post) => number,
    finish: (value: number) => number,
  ): TeamDatum => {
    const row: TeamDatum = { label: category };
    for (const member of members) {
      const own = posts.filter(
        (post) => post.clientId === member.id && post.postLabel === category,
      );
      row[member.id] = own.length === 0 ? 0 : finish(mean(own.map(pick)));
    }
    return row;
  };

  return {
    members,
    reach: categories.map((category) =>
      datum(category, (post) => post.analytics?.impressions ?? 0, Math.round),
    ),
    rate: categories.map((category) =>
      datum(
        category,
        (post) => (post.analytics?.engagement_rate ?? 0) * 100,
        round1,
      ),
    ),
  };
}

/* --------------------------------------------------------------- best time */

/* What a B2B audience does before any of your own posts weigh in. */
const DAY_PRIOR = [0.78, 1, 0.94, 0.9, 0.66, 0.28, 0.34] as const;

function hourPrior(hour: number): number {
  const peak = (center: number, width: number, height: number): number =>
    height * Math.exp(-((hour - center) ** 2) / (2 * width ** 2));
  return Math.min(
    1,
    peak(8.5, 1.6, 1) + peak(12.5, 1.4, 0.62) + peak(17, 1.5, 0.5),
  );
}

/** Weekday × hour, scored from the audience prior blended with your own results. */
export function getBestTimes(profileId = "all"): BestTimeData {
  const posts = scopedPosts(profileId, sinceIso(365));
  const observed = new Map<string, number[]>();
  for (const post of posts) {
    const iso = publishedAt(post);
    const key = `${String(weekdayIndex(iso))}-${String(new Date(iso).getUTCHours())}`;
    const list = observed.get(key);
    const rate = (post.analytics?.engagement_rate ?? 0) * 100;
    if (list) list.push(rate);
    else observed.set(key, [rate]);
  }
  let maxRate = 0;
  for (const rates of observed.values())
    maxRate = Math.max(maxRate, mean(rates));

  const raw: TimeSlot[] = [];
  const [first, last] = GRID_HOURS;
  for (let day = 0; day < 7; day += 1) {
    for (let hour = first; hour <= last; hour += 1) {
      const prior = (DAY_PRIOR[day] ?? 0.5) * hourPrior(hour);
      const rates = observed.get(`${String(day)}-${String(hour)}`) ?? [];
      const rate = mean(rates);
      // Evidence beats the prior: a slot that has worked outranks one that
      // only ought to.
      const score =
        rates.length === 0
          ? prior * 0.75
          : 0.35 * prior + 0.65 * (maxRate === 0 ? 0 : rate / maxRate) + 0.1;
      raw.push({ day, hour, score, posts: rates.length, rate: round1(rate) });
    }
  }
  let top = 0;
  for (const slot of raw) top = Math.max(top, slot.score);
  const slots = raw.map((slot) => ({
    ...slot,
    score: top === 0 ? 0 : Math.round((slot.score / top) * 100) / 100,
  }));

  return {
    slots,
    best: slots.toSorted((a, b) => b.score - a.score).slice(0, 3),
    hours: GRID_HOURS,
  };
}

/* ------------------------------------------------------------ interactions */

/** Who did what to your posts, newest first. */
export function getInteractions(
  profileId = "all",
  limit = 8,
): readonly Interaction[] {
  const now = getNow();
  const index = indexEngagement();
  const posts = new Map(
    publishedPosts()
      .filter((post) => profileId === "all" || post.clientId === profileId)
      .map((post) => [post.id, post]),
  );

  const items: { at: string; item: Interaction }[] = [];
  for (const [postId, comments] of index.commentsByPost) {
    const post = posts.get(postId);
    if (post === undefined) continue;
    for (const comment of comments) {
      const profile = index.profiles.get(comment.profileId);
      if (profile === undefined) continue;
      const tag = tagFor(index, post.clientId, profile.id);
      items.push({
        at: comment.at,
        item: {
          id: comment.id,
          kind: "comment",
          profileId: profile.id,
          name: profile.name,
          headline: profile.headline,
          ...profileAvatar(profile),
          category: tag.category,
          icp: tag.score >= ICP_THRESHOLD,
          postId: post.id,
          postTitle: toTitle(post.content, 48),
          when: formatRelative(comment.at, now),
          excerpt: comment.text,
          commentId: comment.id,
        },
      });
    }
  }
  for (const [postId, reactions] of index.reactionsByPost) {
    const post = posts.get(postId);
    if (post === undefined) continue;
    for (const reaction of reactions) {
      const profile = index.profiles.get(reaction.profileId);
      if (profile === undefined) continue;
      const tag = tagFor(index, post.clientId, profile.id);
      // Reactions from outside the ICP are noise in a feed this short.
      if (tag.score < ICP_THRESHOLD) continue;
      items.push({
        at: reaction.at,
        item: {
          id: reaction.id,
          kind: "reaction",
          profileId: profile.id,
          name: profile.name,
          headline: profile.headline,
          ...profileAvatar(profile),
          category: tag.category,
          icp: true,
          postId: post.id,
          postTitle: toTitle(post.content, 48),
          when: formatRelative(reaction.at, now),
          excerpt:
            reaction.type.charAt(0).toUpperCase() + reaction.type.slice(1),
        },
      });
    }
  }

  // Comments carry the feed; ICP reactions fill what is left, so a burst of
  // likes never pushes the conversations out.
  const newest = items.toSorted((a, b) => b.at.localeCompare(a.at));
  const comments = newest
    .filter((entry) => entry.item.kind === "comment")
    .slice(0, Math.max(1, limit - 2));
  const reactions = newest
    .filter((entry) => entry.item.kind === "reaction")
    .slice(0, limit - comments.length);
  return [...comments, ...reactions]
    .toSorted((a, b) => b.at.localeCompare(a.at))
    .map((entry) => entry.item);
}

/* ---------------------------------------------------------------- insights */

/** What the agent says about the page, computed from the same selectors. */
export function getInsights(profileId = "all"): readonly Insight[] {
  const explorer = getEngagementExplorer("1m", profileId);
  const icp = getIcpPosts(profileId, 8);
  const bench = getBenchmark(profileId);
  const best = getBestTimes(profileId).best[0];
  const insights: Insight[] = [];

  const topPost = explorer.posts.toSorted((a, b) => b.reach - a.reach)[0];
  if (topPost) {
    insights.push({
      id: "top-post",
      text: `“${toTitle(topPost.title, 44)}” reached ${formatCompact(topPost.reach)} people, ${
        explorer.totals.posts > 1
          ? `${String(Math.round((topPost.reach / (explorer.totals.reach / explorer.totals.posts)) * 10) / 10)}× the month's average`
          : "your best this month"
      }.`,
      prompt: `What made "${topPost.title}" work, and how do we write the next one like it?`,
    });
  }
  const majority = icp.posts.filter((post) => post.icpShare >= 50).length;
  if (icp.posts.length > 0) {
    insights.push({
      id: "icp",
      text: `${String(majority)} of your top ${String(icp.posts.length)} posts reached a majority-ICP audience. Decision makers commented on ${String(
        icp.posts.reduce(
          (count, post) =>
            count +
            post.engagers.filter(
              (engager) =>
                engager.action === "commented" &&
                engager.category === "Decision maker",
            ).length,
          0,
        ),
      )} of them.`,
      prompt:
        "Which decision makers commented this month, and who should we reply to first?",
    });
  }
  const rival = bench.competitors[0];
  if (rival) {
    insights.push({
      id: "bench",
      text: `${rival.name} posts ${rival.postsPerWeek.toFixed(1)}× a week to your ${bench.you.postsPerWeek.toFixed(1)} and averages ${formatCompact(rival.avgComments)} comments a post; their ${rival.topics[0]?.toLowerCase() ?? "recent"} posts do best.`,
      prompt: `What is ${rival.name} doing on LinkedIn that we should answer, and what should we ignore?`,
    });
  }
  if (best) {
    insights.push({
      id: "slot",
      text: `Your strongest slot is ${["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"][best.day] ?? ""} around ${String(best.hour)}:00. Nothing is scheduled there next week.`,
      prompt: `Schedule the next post for ${["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"][best.day] ?? ""} at ${String(best.hour)}:00.`,
      intent: "schedule",
    });
  }
  if (explorer.pipeline.contacts > 0) {
    insights.push({
      id: "pipeline",
      text: `${String(explorer.pipeline.contacts)} CRM contacts this month came in through a post; ${String(explorer.pipeline.opportunities)} open deals worth $${formatCompact(explorer.pipeline.amount)} have one of them on it.`,
      prompt: "Which posts led to the pipeline contacts in the CRM this month?",
    });
  }
  return insights;
}

/** Prompt chips under the insight: shorter, always the same three. */
export const ASK_PROMPTS: readonly Insight[] = [
  {
    id: "week",
    text: "Plan next week",
    prompt: "Plan next week's posts from what worked this month.",
  },
  {
    id: "replies",
    text: "Draft replies",
    prompt: "Draft replies to this week's ICP comments.",
    intent: "comment",
  },
];
