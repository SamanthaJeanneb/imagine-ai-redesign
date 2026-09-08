import type { ProfileOption } from "@/components/features/analytics/analytics-toolbar";
import type { ProfileMetric } from "@/components/features/analytics/by-profile-list";
import type {
  ChartDatum,
  ChartKind,
  ChartSeries,
} from "@/components/features/analytics/chart-block";
import type { StatDelta } from "@/components/features/analytics/stat-tile";
import type { TopPost } from "@/components/features/analytics/top-posts";
import {
  type AnalyticsTotals,
  RANGE_DAYS,
  type TimeRange,
} from "@/entities/analytics";
import type { Post } from "@/entities/post";
import {
  deltaDirection,
  formatCompact,
  formatDayMonth,
  formatPercentDelta,
} from "@/lib/format";
import { getDb, getNow } from "@/mocks/db";
import {
  indexAssetsByPath,
  indexClients,
  publishedPosts,
  toPostMedia,
} from "@/services/posts";

export interface AnalyticsStat {
  value: string;
  label: string;
  delta: StatDelta;
}

export interface AnalyticsChart {
  data: readonly ChartDatum[];
  series: readonly ChartSeries[];
  title?: string;
}

export interface AnalyticsOverview {
  /** Totals for the window, formatted against the window before it. */
  stats: readonly AnalyticsStat[];
  /** Toolbar options: `all` plus every profile. */
  profiles: readonly ProfileOption[];
  impressions: AnalyticsChart;
  byProfile: readonly ProfileMetric[];
  topPosts: readonly TopPost[];
}

const IMPRESSION_SERIES: readonly ChartSeries[] = [
  { key: "impressions", label: "Impressions" },
];

const ENGAGEMENT_SERIES: readonly ChartSeries[] = [
  { key: "rate", label: "Engagement rate", unit: "%" },
];

/** How many recent posts the per-post cuts show. */
const RECENT_POSTS = 8;

const EMPTY_TOTALS: AnalyticsTotals = {
  totalImpressions: 0,
  avgEngagementRate: 0,
  totalFollowersGained: 0,
  totalProfileViews: 0,
  totalPosts: 0,
};

/** Published-at, falling back to the last write for anything published by hand. */
function publishedAt(post: Post): string {
  return post.scheduledAt ?? post.updatedAt;
}

function totals(posts: readonly Post[]): AnalyticsTotals {
  if (posts.length === 0) return EMPTY_TOTALS;

  let totalImpressions = 0;
  let engagementRateSum = 0;
  let totalFollowersGained = 0;
  let totalProfileViews = 0;

  for (const post of posts) {
    const analytics = post.analytics;
    if (analytics === null) continue;
    totalImpressions += analytics.impressions;
    engagementRateSum += analytics.engagement_rate;
    totalFollowersGained += analytics.followers_gained_from_this_post;
    totalProfileViews += analytics.profile_viewers_from_this_post;
  }

  return {
    totalImpressions,
    avgEngagementRate: engagementRateSum / posts.length,
    totalFollowersGained,
    totalProfileViews,
    totalPosts: posts.length,
  };
}

function toStat(
  label: string,
  current: number,
  previous: number,
): AnalyticsStat {
  return {
    value: formatCompact(current),
    label,
    delta: {
      label: formatPercentDelta(current, previous),
      direction: deltaDirection(current, previous),
    },
  };
}

function toPercent(rate: number): string {
  return `${(rate * 100).toFixed(1)}%`;
}

/**
 * Analytics page. `profileId` is `all` or a client id; the window is the range
 * ending now, compared against the range before it for the deltas.
 */
export function getAnalyticsOverview(
  range: TimeRange = "1m",
  profileId = "all",
): AnalyticsOverview {
  const clients = indexClients();
  const assets = indexAssetsByPath();
  const dayMs = 24 * 60 * 60 * 1000;
  const end = getNow().getTime();
  const windowStart = new Date(end - RANGE_DAYS[range] * dayMs).toISOString();
  const previousStart = new Date(
    end - 2 * RANGE_DAYS[range] * dayMs,
  ).toISOString();

  const scoped = publishedPosts().filter(
    (post) => profileId === "all" || post.clientId === profileId,
  );
  const current = scoped.filter((post) => publishedAt(post) >= windowStart);
  const previous = scoped.filter(
    (post) =>
      publishedAt(post) >= previousStart && publishedAt(post) < windowStart,
  );

  const currentTotals = totals(current);
  const previousTotals = totals(previous);

  const impressionsByProfile = new Map<string, number>();
  for (const post of current) {
    impressionsByProfile.set(
      post.clientId,
      (impressionsByProfile.get(post.clientId) ?? 0) +
        (post.analytics?.impressions ?? 0),
    );
  }

  const topPosts: TopPost[] = current
    .toSorted(
      (a, b) =>
        (b.analytics?.impressions ?? 0) - (a.analytics?.impressions ?? 0),
    )
    .slice(0, 3)
    .map((post) => {
      const [thumbnail] = toPostMedia(post, assets);
      return {
        id: post.id,
        title: post.content.split("\n", 1)[0] ?? post.content,
        meta: `${clients.get(post.clientId)?.name ?? "Unknown profile"} · ${formatDayMonth(publishedAt(post))}`,
        ...(thumbnail === undefined ? {} : { thumbnail }),
        metrics: [
          {
            label: "Impressions",
            value: formatCompact(post.analytics?.impressions ?? 0),
          },
          {
            label: "Engagement",
            value: toPercent(post.analytics?.engagement_rate ?? 0),
          },
          {
            label: "Comments",
            value: formatCompact(post.analytics?.comments ?? 0),
          },
        ],
      };
    });

  return {
    stats: [
      toStat(
        "Impressions",
        currentTotals.totalImpressions,
        previousTotals.totalImpressions,
      ),
      {
        value: toPercent(currentTotals.avgEngagementRate),
        label: "Engagement rate",
        delta: {
          label: formatPercentDelta(
            currentTotals.avgEngagementRate,
            previousTotals.avgEngagementRate,
          ),
          direction: deltaDirection(
            currentTotals.avgEngagementRate,
            previousTotals.avgEngagementRate,
          ),
        },
      },
      toStat(
        "Followers gained",
        currentTotals.totalFollowersGained,
        previousTotals.totalFollowersGained,
      ),
      toStat("Posts", currentTotals.totalPosts, previousTotals.totalPosts),
    ],
    profiles: [
      { id: "all", name: "All profiles" },
      ...getDb().app.clients.map((client) => ({
        id: client.id,
        name: client.name,
      })),
    ],
    impressions: {
      data: current
        .toSorted((a, b) => publishedAt(a).localeCompare(publishedAt(b)))
        .map((post) => ({
          label: formatDayMonth(publishedAt(post)),
          impressions: post.analytics?.impressions ?? 0,
        })),
      series: IMPRESSION_SERIES,
    },
    byProfile: [...impressionsByProfile.entries()]
      .toSorted(([, a], [, b]) => b - a)
      .map(([clientId, impressions]) => {
        const client = clients.get(clientId);
        return {
          id: clientId,
          name: client?.name ?? "Unknown profile",
          kind: client?.isCompany ? "company" : "person",
          ...(client?.profilePicturePath === null ||
          client?.profilePicturePath === undefined
            ? {}
            : { avatarUrl: client.profilePicturePath }),
          value: impressions,
          valueLabel: formatCompact(impressions),
        };
      }),
    topPosts,
  };
}

export interface LandingRail {
  /** The same four numbers as the analytics page, without their deltas. */
  stats: readonly { value: string; label: string }[];
  /** Impressions per post over the last few published posts. */
  chart: AnalyticsChart;
}

/** The landing's right rail: last month's numbers and the shape of them. */
export function getLandingRail(): LandingRail {
  const overview = getAnalyticsOverview("1m");

  return {
    stats: overview.stats.map((stat) => ({
      value: stat.value,
      label: stat.label,
    })),
    chart: {
      data: overview.impressions.data.slice(-8),
      series: IMPRESSION_SERIES,
    },
  };
}

export interface PreviewChart {
  /** Stable: the key in a list, and what the chat attaches. */
  id: string;
  title: string;
  /** The cut: the window, or what the categories are. */
  description: string;
  kind: ChartKind;
  /** The one number that sums the chart up, formatted. Shown when attached. */
  summary: string;
  data: readonly ChartDatum[];
  series: readonly ChartSeries[];
}

function sum(data: readonly ChartDatum[], key: string): number {
  let total = 0;
  for (const datum of data) {
    const value = datum[key];
    if (typeof value === "number") total += value;
  }
  return total;
}

/** "Sarah Chen" → "Sarah". A bar in a preview has room for one word. */
function shortName(name: string): string {
  return name.split(" ", 1)[0] ?? name;
}

/**
 * Three cuts of last month: the trend, the rate per post, and the split by
 * profile. The composer's Analytics preview and the analytics page draw the
 * same set, so expanding keeps its place and any one of them can be attached
 * to the conversation.
 */
export function getPreviewCharts(): readonly PreviewChart[] {
  const overview = getAnalyticsOverview("1m");
  const recent = publishedPosts().slice(0, RECENT_POSTS).toReversed();

  let rateSum = 0;
  const engagement = recent.map((post) => {
    const rate = (post.analytics?.engagement_rate ?? 0) * 100;
    rateSum += rate;
    return {
      label: formatDayMonth(publishedAt(post)),
      rate: Math.round(rate * 10) / 10,
    };
  });

  return [
    {
      id: "impressions",
      title: "Impressions over time",
      description: "Last 30 days",
      kind: "area",
      summary: formatCompact(sum(overview.impressions.data, "impressions")),
      data: overview.impressions.data,
      series: IMPRESSION_SERIES,
    },
    {
      id: "engagement",
      title: "Engagement rate",
      description: `Last ${String(engagement.length)} posts`,
      kind: "bar",
      summary:
        recent.length === 0
          ? toPercent(0)
          : toPercent(rateSum / (100 * recent.length)),
      data: engagement,
      series: ENGAGEMENT_SERIES,
    },
    {
      id: "by-profile",
      title: "Impressions by profile",
      description: "Last 30 days",
      kind: "hbar",
      summary: `${String(overview.byProfile.length)} profiles`,
      data: overview.byProfile.slice(0, 4).map((profile) => ({
        label: shortName(profile.name),
        impressions: profile.value,
      })),
      series: IMPRESSION_SERIES,
    },
  ];
}

/** Impressions for one profile's last few posts, for a chart inside a reply. */
export function getClientImpressions(
  clientId: string,
  limit: number,
  title?: string,
): AnalyticsChart {
  return {
    data: publishedPosts()
      .filter((post) => post.clientId === clientId)
      .slice(0, limit)
      .toReversed()
      .map((post) => ({
        label: formatDayMonth(publishedAt(post)),
        impressions: post.analytics?.impressions ?? 0,
      })),
    series: IMPRESSION_SERIES,
    ...(title === undefined ? {} : { title }),
  };
}
