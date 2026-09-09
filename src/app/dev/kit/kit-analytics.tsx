"use client";

import { useState } from "react";
import { toast } from "sonner";

import { AgentMessage } from "@/components/features/agent/agent-message";
import {
  CommentDraft,
  type CommentDraftContent,
} from "@/components/features/agent/comment-draft";
import type { PostChipData } from "@/components/features/calendar/post-chip";
import {
  AskImagine,
  type Insight,
} from "@/components/features/analytics/ask-imagine";
import {
  BenchmarkPanel,
  type BenchmarkData,
} from "@/components/features/analytics/benchmark-panel";
import {
  BestTimeGrid,
  formatSlot,
  type BestTimeData,
  type TimeSlot,
} from "@/components/features/analytics/best-time-grid";
import {
  ChartSkeleton,
  type ChartSkeletonKind,
} from "@/components/features/analytics/chart-theme";
import {
  EngagementExplorer,
  type ExplorerData,
  type ExplorerPoint,
  type ExplorerPost,
} from "@/components/features/analytics/engagement-explorer";
import {
  IcpPosts,
  type Engager,
  type IcpData,
} from "@/components/features/analytics/icp-posts";
import {
  InteractionFeed,
  type Interaction,
} from "@/components/features/analytics/interaction-feed";
import {
  TeamPerformance,
  type TeamData,
} from "@/components/features/analytics/team-performance";
import { Switch } from "@/components/ui/switch";

/** Same contract as `Demo` in kit-features; local so the two files do not
 *  import each other (kit-features reads the fixtures exported here). */
function Demo({
  children,
  className,
}: {
  label?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={className ?? "min-w-0"}>{children}</div>;
}

const AVATAR = (n: number) => `https://i.pravatar.cc/96?img=${String(n)}`;
const ACME_LOGO = "/brand/acme-logo.png";

/* -------------------------------------------------------------------------- */
/* Explorer                                                                    */
/* -------------------------------------------------------------------------- */

const DAY_MS = 24 * 60 * 60 * 1000;
const EXPLORER_START = Date.UTC(2026, 7, 10);
const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const SHORT_DAY = {
  format: (date: Date) =>
    `${String(date.getUTCDate())} ${MONTHS[date.getUTCMonth()] ?? ""}`,
};

interface PostSeed {
  offset: number;
  title: string;
  who: "sarah" | "ravi" | "acme";
  category: string;
  reach: number;
  rate: number;
  followers: number;
  comments: number;
}

const POST_SEEDS: readonly PostSeed[] = [
  {
    offset: 2,
    title: "What we cut from onboarding",
    who: "sarah",
    category: "Thought leadership",
    reach: 3400,
    rate: 7,
    followers: 21,
    comments: 24,
  },
  {
    offset: 6,
    title: "Customer story: Northwind",
    who: "acme",
    category: "Case study",
    reach: 2900,
    rate: 5.1,
    followers: 9,
    comments: 12,
  },
  {
    offset: 9,
    title: "Hiring: senior designer",
    who: "ravi",
    category: "Hiring",
    reach: 4100,
    rate: 7.6,
    followers: 34,
    comments: 31,
  },
  {
    offset: 13,
    title: "The roadmap review we stopped doing",
    who: "sarah",
    category: "Thought leadership",
    reach: 5200,
    rate: 8.2,
    followers: 48,
    comments: 39,
  },
  {
    offset: 17,
    title: "Q3 numbers, in one chart",
    who: "acme",
    category: "Product",
    reach: 2200,
    rate: 4.4,
    followers: 6,
    comments: 8,
  },
  {
    offset: 21,
    title: "Three founders, one lesson",
    who: "sarah",
    category: "Thought leadership",
    reach: 3800,
    rate: 6.6,
    followers: 27,
    comments: 22,
  },
  {
    offset: 25,
    title: "Design reviews without the theatre",
    who: "ravi",
    category: "Thought leadership",
    reach: 3100,
    rate: 6.1,
    followers: 18,
    comments: 17,
  },
];

const WHO = {
  sarah: { name: "Sarah Chen", avatarUrl: AVATAR(47), isCompany: false },
  ravi: { name: "Ravi Patel", avatarUrl: AVATAR(12), isCompany: false },
  acme: { name: "Acme", avatarUrl: ACME_LOGO, isCompany: true },
} as const;

function dayAt(offset: number): string {
  return new Date(EXPLORER_START + offset * DAY_MS).toISOString().slice(0, 10);
}

/**
 * Thirty days of reach with each post's impressions decaying over the four
 * days after it, so the curve has the shape real LinkedIn reach has: a spike
 * on the day, a long tail, and a quiet floor between posts.
 */
export function kitExplorer(scale = 1): ExplorerData {
  const points: ExplorerPoint[] = [];
  for (let offset = 0; offset < 30; offset += 1) {
    const day = dayAt(offset);
    let reach = 140 + ((offset * 37) % 90);
    let rate = 0;
    let weight = 0;
    let followers = 2 + ((offset * 13) % 4);
    let posts = 0;
    for (const seed of POST_SEEDS) {
      const age = offset - seed.offset;
      if (age < 0 || age > 4) continue;
      const share = [0.46, 0.28, 0.14, 0.08, 0.04][age] ?? 0;
      reach += seed.reach * share;
      rate += seed.rate * share;
      weight += share;
      followers += Math.round(seed.followers * share);
      if (age === 0) posts += 1;
    }
    points.push({
      label: SHORT_DAY.format(new Date(day)),
      day,
      reach: Math.round(reach * scale),
      rate: weight > 0 ? Math.round((rate / weight) * 10) / 10 : 0,
      followers: Math.round(followers * scale),
      posts,
      pipeline: 3 + Math.floor(offset / 4) + (offset > 13 ? 2 : 0),
    });
  }

  const posts: ExplorerPost[] = POST_SEEDS.map((seed, index) => {
    const who = WHO[seed.who];
    const day = dayAt(seed.offset);
    return {
      id: `kx${String(index + 1)}`,
      day,
      label: SHORT_DAY.format(new Date(day)),
      title: seed.title,
      profileName: who.name,
      avatarUrl: who.avatarUrl,
      isCompany: who.isCompany,
      category: seed.category,
      reach: Math.round(seed.reach * scale),
      rate: seed.rate,
      followers: Math.round(seed.followers * scale),
      comments: seed.comments,
      chip: {
        id: `kx${String(index + 1)}`,
        title: seed.title,
        time: "9:00",
        profile: who.name.split(" ")[0] ?? who.name,
        status: "published",
      } satisfies PostChipData,
    };
  });

  const totalReach = points.reduce((sum, point) => sum + point.reach, 0);
  const totalFollowers = points.reduce(
    (sum, point) => sum + point.followers,
    0,
  );
  const meanRate =
    Math.round(
      (posts.reduce((sum, post) => sum + post.rate, 0) / posts.length) * 10,
    ) / 10;

  return {
    points,
    posts,
    xTicks: points
      .filter((_, index) => index % 5 === 0)
      .map((point) => point.label),
    totals: {
      reach: totalReach,
      rate: meanRate,
      followers: totalFollowers,
      posts: posts.length,
    },
    pipeline: {
      contacts: points.at(-1)?.pipeline ?? 0,
      opportunities: 4,
      amount: 186000,
    },
  };
}

const KIT_EXPLORER = kitExplorer();

/* -------------------------------------------------------------------------- */
/* Benchmark                                                                   */
/* -------------------------------------------------------------------------- */

export const KIT_BENCHMARK: BenchmarkData = {
  you: {
    id: "you",
    name: "Acme",
    headline: "Your profiles, combined",
    avatarUrl: ACME_LOGO,
    isCompany: true,
    postsPerWeek: 1.8,
    avgReactions: 148,
    avgComments: 22,
    avgShares: 9,
    topics: ["Onboarding", "Hiring", "Design process", "Customer stories"],
  },
  competitors: [
    {
      id: "t1",
      name: "Northstar",
      headline: "Revenue intelligence for B2B teams",
      avatarUrl: `https://picsum.photos/seed/northstar/96/96`,
      isCompany: true,
      postsPerWeek: 3.2,
      avgReactions: 212,
      avgComments: 18,
      avgShares: 14,
      topics: ["Pipeline", "Forecasting", "Sales ops", "Webinars"],
      recent: [
        {
          id: "t1p1",
          excerpt:
            "Forecast accuracy is a people problem before it is a data problem. Here is how we coach reps to update deals honestly.",
          label: "3 Sep",
          reactions: 284,
          comments: 26,
        },
        {
          id: "t1p2",
          excerpt:
            "Join us Thursday: three RevOps leads on the reports they killed this year, and what replaced them.",
          label: "29 Aug",
          reactions: 96,
          comments: 7,
        },
        {
          id: "t1p3",
          excerpt:
            "Pipeline coverage of 3x is a myth we keep repeating. The teams that hit plan run closer to 2.2x with better hygiene.",
          label: "26 Aug",
          reactions: 341,
          comments: 33,
        },
      ],
    },
    {
      id: "t2",
      name: "Priya Nair",
      headline: "Founder, Lumen · ex-Stripe",
      avatarUrl: AVATAR(5),
      isCompany: false,
      postsPerWeek: 4.5,
      avgReactions: 390,
      avgComments: 41,
      avgShares: 12,
      topics: ["Founder lessons", "Fundraising", "Hiring", "Pricing"],
      recent: [
        {
          id: "t2p1",
          excerpt:
            "We raised our Series A on a deck with two slides of product and eleven of customers. That ratio was the point.",
          label: "4 Sep",
          reactions: 612,
          comments: 74,
        },
        {
          id: "t2p2",
          excerpt:
            "Pricing lesson: the plan nobody buys still does work. It anchors the plan everybody buys.",
          label: "1 Sep",
          reactions: 445,
          comments: 38,
        },
      ],
    },
    {
      id: "t3",
      name: "Fieldwork",
      headline: "Customer research, done weekly",
      avatarUrl: `https://picsum.photos/seed/fieldwork/96/96`,
      isCompany: true,
      postsPerWeek: 1.2,
      avgReactions: 88,
      avgComments: 9,
      avgShares: 4,
      topics: ["Research", "Interviews", "Product"],
      recent: [
        {
          id: "t3p1",
          excerpt:
            "Five interviews a week, every week, for a year. Here is what changed about how we build.",
          label: "2 Sep",
          reactions: 131,
          comments: 15,
        },
      ],
    },
  ],
};

/* -------------------------------------------------------------------------- */
/* ICP                                                                         */
/* -------------------------------------------------------------------------- */

const ENGAGERS: readonly Engager[] = [
  {
    id: "e1",
    name: "Dana Whitfield",
    headline: "VP Marketing at Halcyon",
    avatarUrl: AVATAR(20),
    category: "Decision maker",
    score: 92,
    signals: ["VP title", "Target industry", "500+ employees"],
    action: "commented",
    excerpt:
      "We went through exactly this last quarter. The hard part was killing the steps the sales team had promised.",
    commentId: "cm1",
  },
  {
    id: "e2",
    name: "Marcus Lee",
    headline: "Head of Growth at Tidal",
    avatarUrl: AVATAR(33),
    category: "Champion",
    score: 78,
    signals: ["Growth function", "Series B"],
    action: "commented",
    excerpt:
      "Sharing this with our onboarding squad. Nine steps to three is bold.",
    commentId: "cm2",
  },
  {
    id: "e3",
    name: "Aisha Rahman",
    headline: "Product Designer at Orbit",
    avatarUrl: AVATAR(44),
    category: "Practitioner",
    score: 61,
    signals: ["Design function"],
    action: "reacted",
  },
  {
    id: "e4",
    name: "Tom Becker",
    headline: "Founder at Kestrel",
    avatarUrl: AVATAR(15),
    category: "Peer",
    score: 44,
    signals: ["Founder"],
    action: "reacted",
  },
  {
    id: "e5",
    name: "Lena Fischer",
    headline: "Recruiter at TalentBridge",
    avatarUrl: AVATAR(26),
    category: "Outside ICP",
    score: 12,
    signals: [],
    action: "reacted",
  },
  {
    id: "e6",
    name: "Owen Park",
    headline: "COO at Meridian Health",
    avatarUrl: AVATAR(53),
    category: "Decision maker",
    score: 88,
    signals: ["C-suite", "Target industry"],
    action: "commented",
    excerpt:
      "Would love to hear how you measured the drop-off before and after.",
    commentId: "cm3",
  },
];

function icpPost(
  id: string,
  title: string,
  label: string,
  profileName: string,
  reach: number,
  picks: readonly number[],
): IcpData["posts"][number] {
  const engagers = picks.flatMap((index) => {
    const engager = ENGAGERS[index];
    return engager === undefined ? [] : [engager];
  });
  const icpCount = engagers.filter((e) => e.category !== "Outside ICP").length;
  return {
    id,
    title,
    label,
    profileName,
    reach,
    engagers,
    icpCount,
    icpShare:
      engagers.length === 0
        ? 0
        : Math.round((icpCount / engagers.length) * 100),
  };
}

export const KIT_ICP: IcpData = {
  posts: [
    icpPost(
      "kx4",
      "The roadmap review we stopped doing",
      "23 Aug",
      "Sarah Chen",
      5200,
      [0, 1, 2, 5, 3],
    ),
    icpPost(
      "kx3",
      "Hiring: senior designer",
      "19 Aug",
      "Ravi Patel",
      4100,
      [2, 3, 4, 1],
    ),
    icpPost(
      "kx1",
      "What we cut from onboarding",
      "12 Aug",
      "Sarah Chen",
      3400,
      [0, 1, 5, 2],
    ),
    icpPost(
      "kx6",
      "Three founders, one lesson",
      "31 Aug",
      "Sarah Chen",
      3800,
      [3, 1, 4],
    ),
    icpPost("kx2", "Customer story: Northwind", "16 Aug", "Acme", 2900, [5, 0]),
    icpPost("kx5", "Q3 numbers, in one chart", "27 Aug", "Acme", 2200, [4]),
  ],
};

/* -------------------------------------------------------------------------- */
/* Team                                                                        */
/* -------------------------------------------------------------------------- */

export const KIT_TEAM: TeamData = {
  members: [
    {
      id: "c2",
      name: "Sarah Chen",
      avatarUrl: AVATAR(47),
      isCompany: false,
      posts: 9,
      reach: 3900,
      rate: 7.1,
      followers: 118,
      bestCategory: "Thought leadership",
    },
    {
      id: "c3",
      name: "Ravi Patel",
      avatarUrl: AVATAR(12),
      isCompany: false,
      posts: 6,
      reach: 3300,
      rate: 6.6,
      followers: 71,
      bestCategory: "Hiring",
    },
    {
      id: "c1",
      name: "Acme",
      avatarUrl: ACME_LOGO,
      isCompany: true,
      posts: 8,
      reach: 2500,
      rate: 4.7,
      followers: 40,
      bestCategory: "Case study",
    },
    {
      id: "c4",
      name: "Mia Torres",
      avatarUrl: AVATAR(32),
      isCompany: false,
      posts: 3,
      reach: 1400,
      rate: 5.2,
      followers: 16,
      bestCategory: "Product",
    },
  ],
  reach: [
    {
      label: "Thought leadership",
      "Sarah Chen": 4600,
      "Ravi Patel": 3100,
      Acme: 2100,
      "Mia Torres": 1200,
    },
    {
      label: "Case study",
      "Sarah Chen": 3100,
      "Ravi Patel": 0,
      Acme: 2900,
      "Mia Torres": 0,
    },
    {
      label: "Product",
      "Sarah Chen": 2800,
      "Ravi Patel": 2400,
      Acme: 2300,
      "Mia Torres": 1600,
    },
    {
      label: "Hiring",
      "Sarah Chen": 0,
      "Ravi Patel": 4100,
      Acme: 1800,
      "Mia Torres": 0,
    },
  ],
  rate: [
    {
      label: "Thought leadership",
      "Sarah Chen": 7.8,
      "Ravi Patel": 6.1,
      Acme: 4.2,
      "Mia Torres": 5,
    },
    {
      label: "Case study",
      "Sarah Chen": 6.2,
      "Ravi Patel": 0,
      Acme: 5.1,
      "Mia Torres": 0,
    },
    {
      label: "Product",
      "Sarah Chen": 5.9,
      "Ravi Patel": 5.4,
      Acme: 4.4,
      "Mia Torres": 5.3,
    },
    {
      label: "Hiring",
      "Sarah Chen": 0,
      "Ravi Patel": 7.6,
      Acme: 4.9,
      "Mia Torres": 0,
    },
  ],
};

/* -------------------------------------------------------------------------- */
/* Best time                                                                   */
/* -------------------------------------------------------------------------- */

const HOURS: readonly [number, number] = [6, 20];

function slotScore(day: number, hour: number): number {
  const weekday = day >= 1 && day <= 5;
  const morning = Math.exp(-((hour - 9) ** 2) / 6);
  const lunch = 0.55 * Math.exp(-((hour - 12.5) ** 2) / 3);
  const tuesThurs = day === 2 || day === 4 ? 1.2 : 1;
  const base = weekday ? (morning + lunch) * tuesThurs : 0.18 * morning;
  return Math.min(1, base * 0.85 + ((day * 7 + hour * 3) % 10) / 100);
}

export const KIT_BEST_TIMES: BestTimeData = (() => {
  const slots: TimeSlot[] = [];
  for (let day = 0; day < 7; day += 1) {
    for (let hour = HOURS[0]; hour <= HOURS[1]; hour += 1) {
      const score = slotScore(day, hour);
      const posts = score > 0.6 ? 2 + ((day + hour) % 3) : score > 0.35 ? 1 : 0;
      slots.push({
        day,
        hour,
        score,
        posts,
        rate: posts > 0 ? Math.round((3 + score * 5.5) * 10) / 10 : 0,
      });
    }
  }
  const best = slots
    .filter((slot) => slot.posts > 0)
    .toSorted((a, b) => b.score - a.score)
    .slice(0, 3);
  return { slots, best, hours: HOURS };
})();

/* -------------------------------------------------------------------------- */
/* Interactions, insights                                                      */
/* -------------------------------------------------------------------------- */

export const KIT_INTERACTIONS: readonly Interaction[] = [
  {
    id: "i1",
    kind: "comment",
    profileId: "e1",
    name: "Dana Whitfield",
    headline: "VP Marketing at Halcyon",
    avatarUrl: AVATAR(20),
    category: "Decision maker",
    icp: true,
    postId: "kx4",
    postTitle: "The roadmap review we stopped doing",
    when: "2h ago",
    excerpt:
      "We went through exactly this last quarter. The hard part was killing the steps the sales team had promised.",
    commentId: "cm1",
  },
  {
    id: "i2",
    kind: "comment",
    profileId: "e6",
    name: "Owen Park",
    headline: "COO at Meridian Health",
    avatarUrl: AVATAR(53),
    category: "Decision maker",
    icp: true,
    postId: "kx1",
    postTitle: "What we cut from onboarding",
    when: "5h ago",
    excerpt:
      "Would love to hear how you measured the drop-off before and after.",
    commentId: "cm3",
  },
  {
    id: "i3",
    kind: "reaction",
    profileId: "e3",
    name: "Aisha Rahman",
    headline: "Product Designer at Orbit",
    avatarUrl: AVATAR(44),
    category: "Practitioner",
    icp: true,
    postId: "kx3",
    postTitle: "Hiring: senior designer",
    when: "Yesterday",
    excerpt: "",
  },
  {
    id: "i4",
    kind: "comment",
    profileId: "e2",
    name: "Marcus Lee",
    headline: "Head of Growth at Tidal",
    avatarUrl: AVATAR(33),
    category: "Champion",
    icp: true,
    postId: "kx1",
    postTitle: "What we cut from onboarding",
    when: "Yesterday",
    excerpt:
      "Sharing this with our onboarding squad. Nine steps to three is bold.",
    commentId: "cm2",
  },
  {
    id: "i5",
    kind: "reaction",
    profileId: "e5",
    name: "Lena Fischer",
    headline: "Recruiter at TalentBridge",
    avatarUrl: AVATAR(26),
    category: "Outside ICP",
    icp: false,
    postId: "kx3",
    postTitle: "Hiring: senior designer",
    when: "2d ago",
    excerpt: "",
  },
];

export const KIT_INSIGHTS: readonly Insight[] = [
  {
    id: "n1",
    text: "Sarah's thought leadership posts reach 1.8× the team average. Two more this month would lift reach without adding posts.",
    prompt: "Plan two more thought leadership posts from Sarah this month.",
  },
  {
    id: "n2",
    text: "Tuesday 9:00 has the best engagement rate of any slot you have used. Thursday's post could move there.",
    prompt: "Move Thursday's post to Tuesday at 9:00.",
    intent: "schedule",
  },
  {
    id: "n3",
    text: "Three decision makers commented this week and none have a reply yet.",
    prompt: "Draft replies to this week's decision-maker comments.",
    intent: "comment",
  },
];

/* -------------------------------------------------------------------------- */
/* Demos                                                                       */
/* -------------------------------------------------------------------------- */

function ask(prompt: string, intent?: string) {
  toast(intent === undefined ? prompt : `${prompt} (${intent})`);
}

function LoadingToggle({
  loading,
  onChange,
}: {
  loading: boolean;
  onChange: (loading: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-s self-end type-small text-imagine-foreground-muted">
      <Switch checked={loading} onCheckedChange={onChange} />
      Loading
    </label>
  );
}

export function ChartFoundationDemo() {
  const kinds: readonly ChartSkeletonKind[] = [
    "bars",
    "line",
    "grid",
    "radar",
    "rows",
  ];
  return (
    <div className="grid gap-xl lg:grid-cols-2 xl:grid-cols-3">
      {kinds.map((kind) => (
        <Demo key={kind} label={`Skeleton: ${kind}`}>
          <div className="rounded-surface border border-imagine-border bg-imagine-surface p-l">
            <ChartSkeleton kind={kind} />
          </div>
        </Demo>
      ))}
    </div>
  );
}

export function AskImagineDemo() {
  const [loading, setLoading] = useState(false);
  return (
    <div className="flex flex-col gap-m">
      <LoadingToggle loading={loading} onChange={setLoading} />
      <AskImagine
        insights={KIT_INSIGHTS}
        onAsk={ask}
        loading={loading}
      />
    </div>
  );
}

export function EngagementExplorerDemo() {
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<string | undefined>("kx4");
  return (
    <div className="flex flex-col gap-m">
      <LoadingToggle loading={loading} onChange={setLoading} />
      <EngagementExplorer
        data={KIT_EXPLORER}
        loading={loading}
        {...(selected === undefined ? {} : { selectedPostId: selected })}
        onSelectPost={(post) => {
          setSelected((current) => (current === post.id ? undefined : post.id));
        }}
        onAsk={ask}
      />
    </div>
  );
}

export function BenchmarkDemo() {
  const [loading, setLoading] = useState(false);
  return (
    <div className="flex flex-col gap-m">
      <LoadingToggle loading={loading} onChange={setLoading} />
      <BenchmarkPanel
        data={KIT_BENCHMARK}
        loading={loading}
        onAsk={ask}
      />
    </div>
  );
}

export function IcpPostsDemo() {
  const [loading, setLoading] = useState(false);
  return (
    <div className="flex flex-col gap-m">
      <LoadingToggle loading={loading} onChange={setLoading} />
      <IcpPosts
        data={KIT_ICP}
        loading={loading}
        onEngage={(engager, post, action) => {
          toast(`${action}: ${engager.name} · ${post.title}`);
        }}
        onAsk={ask}
      />
    </div>
  );
}

export function TeamAndBestTimeDemo() {
  const [loading, setLoading] = useState(false);
  return (
    <div className="flex flex-col gap-m">
      <LoadingToggle loading={loading} onChange={setLoading} />
      <div className="@container grid min-w-0 gap-xl @5xl:grid-cols-2">
        <TeamPerformance
          data={KIT_TEAM}
          loading={loading}
          onAsk={ask}
        />
        <BestTimeGrid
          data={KIT_BEST_TIMES}
          loading={loading}
          onPick={(slot) => {
            toast(`Schedule for ${formatSlot(slot)}`);
          }}
          onAsk={ask}
        />
      </div>
    </div>
  );
}

const DRAFT_TARGET = {
  author: {
    name: "Dana Whitfield",
    headline: "VP Marketing at Halcyon",
    avatarUrl: AVATAR(20),
  },
  text: "We went through exactly this last quarter. The hard part was killing the steps the sales team had promised.",
  context: "on your post \u201cThe roadmap review we stopped doing\u201d",
};

const DRAFT_AUTHOR = {
  name: "Sarah Chen",
  headline: "CEO at Acme",
  avatarUrl: AVATAR(47),
};

const DRAFT_BODY =
  "That was the hard part for us too. Every step had someone who had promised it to a customer. What finally worked was showing the drop-off per step, so the argument was about the number rather than the promise. Happy to share the sheet if useful.";

const DRAFT_PART: CommentDraftContent = {
  target: DRAFT_TARGET,
  author: DRAFT_AUTHOR,
  body: DRAFT_BODY,
};

export function InteractionFeedDemo() {
  const [loading, setLoading] = useState(false);
  return (
    <div className="flex flex-col gap-m">
      <LoadingToggle loading={loading} onChange={setLoading} />
      <div className="@container grid min-w-0 gap-xl @5xl:grid-cols-2">
        <InteractionFeed
          items={KIT_INTERACTIONS}
          loading={loading}
          onAct={(item, action) => {
            toast(`${action}: ${item.name}`);
          }}
          onAsk={ask}
        />
        <div className="flex flex-col gap-xl">
          <Demo label="Comment draft, standalone">
            <CommentDraft
              target={DRAFT_TARGET}
              author={DRAFT_AUTHOR}
              body={DRAFT_BODY}
              onPost={() => {
                toast("Posted");
              }}
              onRegenerate={() => {
                toast("Regenerating");
              }}
            />
          </Demo>
          <Demo label="Agent message with a comment draft part">
            <AgentMessage
              parts={[
                {
                  type: "text",
                  text: "Dana runs marketing at a target account, so this is worth a real reply. Here is a first pass, written as Sarah.",
                },
                {
                  type: "comment_draft",
                  commentId: "cm1",
                  ...DRAFT_PART,
                },
              ]}
              onIntent={(intent) => {
                toast(intent);
              }}
            />
          </Demo>
        </div>
      </div>
    </div>
  );
}
