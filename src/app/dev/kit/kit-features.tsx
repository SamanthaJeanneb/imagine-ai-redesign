"use client";

import { cn } from "cn";
import { AnimatePresence, LayoutGroup } from "motion/react";
import { type ReactNode, useState } from "react";
import { toast } from "sonner";

import {
  AgentMessage,
  type MessagePart,
  UserMessage,
} from "@/components/features/agent/agent-message";
import { ChatProvider } from "@/components/features/agent/chat-provider";
import {
  Composer,
  type ComposerPreview,
} from "@/components/features/agent/composer";
import { AssetPicker } from "@/components/features/agent/asset-picker";
import {
  LinkedInPostDraft,
  type PostAuthor,
} from "@/components/features/agent/linkedin-post-draft";
import { PostContext } from "@/components/features/agent/post-context";
import { PreviewSurface } from "@/components/features/agent/preview-surface";
import { ResourceContext } from "@/components/features/agent/resource-context";
import { ScheduledGraphic } from "@/components/features/agent/scheduled-graphic";
import { ProfileSelector } from "@/components/features/agent/profile-selector";
import {
  Timeline,
  type TimelineEntry,
} from "@/components/features/agent/timeline";
import { AnalyticsToolbar } from "@/components/features/analytics/analytics-toolbar";
import { AnalyticsPage } from "@/components/features/analytics/analytics-page";
import { ByProfileList } from "@/components/features/analytics/by-profile-list";
import {
  ChartBlock,
  type ChartDatum,
  type ChartSeries,
} from "@/components/features/analytics/chart-block";
import { ChartCard } from "@/components/features/analytics/chart-card";
import { StatGroup, StatTile } from "@/components/features/analytics/stat-tile";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { TopPosts } from "@/components/features/analytics/top-posts";
import {
  type CalendarDay,
  CalendarGrid,
} from "@/components/features/calendar/calendar-grid";
import { CalendarPage } from "@/components/features/calendar/calendar-page";
import { CalendarTimeGrid } from "@/components/features/calendar/calendar-time-grid";
import { CalendarToolbar } from "@/components/features/calendar/calendar-toolbar";
import {
  PostChip,
  type PostChipData,
} from "@/components/features/calendar/post-chip";
import { UpNextList } from "@/components/features/calendar/up-next-list";
import { AssetGrid } from "@/components/features/files/asset-grid";
import {
  AssetTile,
  type AssetTileData,
} from "@/components/features/files/asset-tile";
import {
  EditorTabStrip,
  type EditorTab,
} from "@/components/features/files/editor-tab-strip";
import { FilesLibrary } from "@/components/features/files/files-library";
import { FileTreeNav } from "@/components/features/files/file-tree-nav";
import { LibraryCard } from "@/components/features/files/library-card";
import { FilesWorkspacePage } from "@/components/features/files/files-workspace-page";
import {
  type FileSection,
  FileTree,
} from "@/components/features/files/file-tree";
import { MarkdownEditor } from "@/components/features/files/markdown-editor";
import { NewMenu } from "@/components/features/files/new-menu";
import {
  type Skill,
  SkillsList,
} from "@/components/features/files/skills-list";
import { ConnectLinkedIn } from "@/components/features/onboarding/connect-linkedin";
import { JoinOrganization } from "@/components/features/onboarding/join-organization";
import {
  InviteTeamForm,
  type TeamMember,
} from "@/components/features/onboarding/invite-team-form";
import { OrganizationForm } from "@/components/features/onboarding/organization-form";
import { SignInForm } from "@/components/features/onboarding/sign-in-form";
import { StepHeading } from "@/components/features/onboarding/step-heading";
import { Stepper } from "@/components/features/onboarding/stepper";
import { ApiKeySection } from "@/components/features/settings/api-keys";
import {
  IntegrationGrid,
  IntegrationRows,
} from "@/components/features/settings/integrations";
import {
  type ProfileDetailData,
  ProfileDetail,
} from "@/components/features/settings/profile-detail";
import {
  ProfileList,
  type ProfileSummary,
} from "@/components/features/settings/profile-list";
import { AccountControls } from "@/components/layout/account";
import { ChatColumn } from "@/components/layout/chat-column";
import {
  ChatContextPanel,
  type ChatPanelMode,
} from "@/components/layout/chat-context-panel";
import { ChatControls, ChatTitle } from "@/components/layout/chat-controls";
import { FilesPanel } from "@/components/layout/files-panel";
import {
  Sidebar,
  SidebarExpandButton,
  type SidebarNavKey,
} from "@/components/layout/sidebar";
import { LogoLoader } from "@/components/motion/logo-loader";
import { Button } from "@/components/ui/button";
import type { TimeRange } from "@/entities/analytics";
import type { CalendarView, PostsByDay } from "@/lib/calendar";
import type { ScriptedReply } from "@/services/agent";
import type {
  AnalyticsPageData,
  AnalyticsSnapshot,
  PreviewChart,
} from "@/services/analytics";
import type { OpenDocument } from "@/services/files";

/* Kit fixtures. The screens read src/mocks/db.json through src/services/. */

const AVATAR = (n: number) => `https://i.pravatar.cc/96?img=${String(n)}`;
const ACME_LOGO = "/brand/acme-logo.png";
const PHOTO = (id: string) => `https://picsum.photos/seed/${id}/400/400`;

const ASSETS: AssetTileData[] = [
  {
    id: "a1",
    kind: "image",
    src: PHOTO("onboarding"),
    caption: "onboarding-hero.png",
  },
  { id: "a2", kind: "image", src: PHOTO("team"), caption: "team-offsite.jpg" },
  {
    id: "a3",
    kind: "video",
    src: PHOTO("launch"),
    caption: "launch-teaser.mp4",
  },
  { id: "a4", kind: "image", src: PHOTO("office"), caption: "office.jpg" },
  { id: "a5", kind: "image", src: PHOTO("product"), caption: "product-ui.png" },
  { id: "a6", kind: "image", src: PHOTO("event"), caption: "event.jpg" },
];

const THREADS = [
  { id: "t1", title: "Onboarding launch post", unread: true },
  { id: "t2", title: "Why founders should post weekly" },
  { id: "t3", title: "Hiring: senior designer" },
  { id: "t4", title: "Q3 product recap" },
  { id: "t5", title: "Customer story: Northwind" },
  { id: "t6", title: "Thoughts on founder-led sales" },
];

const TIMELINE: TimelineEntry[] = [
  {
    id: "e1",
    kind: "Drafted",
    when: "2h ago",
    title: "Onboarding launch post for Sarah Chen",
    excerpt:
      "We rebuilt onboarding from scratch. Three steps instead of nine, and the first post goes out in under ten minutes. Here is what we learned about cutting scope.",
    actions: [
      { intent: "schedule", label: "Schedule", primary: true },
      { intent: "edit", label: "Edit" },
    ],
    unread: true,
  },
  {
    id: "e2",
    kind: "Published",
    when: "Yesterday, 9:00",
    title: "Hiring post reached 4.1k people",
    actions: [
      { intent: "analyze", label: "See analytics", primary: true },
      { intent: "dismiss", label: "Dismiss" },
    ],
  },
  {
    id: "e3",
    kind: "Reply drafted",
    when: "Yesterday",
    title: "Comment on Sarah's hiring post",
    excerpt:
      "A hiring manager asked how the design interview works. The reply is written in Sarah's voice.",
    actions: [
      { intent: "approve-reply", label: "Approve", primary: true },
      { intent: "edit-reply", label: "Edit" },
    ],
    unread: true,
  },
];

const IMPRESSIONS: ChartDatum[] = [
  { label: "Mon", impressions: 820, engagements: 64, followers: 12 },
  { label: "Tue", impressions: 1240, engagements: 98, followers: 21 },
  { label: "Wed", impressions: 980, engagements: 71, followers: 9 },
  { label: "Thu", impressions: 1610, engagements: 142, followers: 30 },
  { label: "Fri", impressions: 1390, engagements: 120, followers: 18 },
  { label: "Sat", impressions: 640, engagements: 40, followers: 4 },
  { label: "Sun", impressions: 710, engagements: 52, followers: 7 },
];

const BY_TYPE: ChartDatum[] = [
  { label: "Story", posts: 14 },
  { label: "Insight", posts: 22 },
  { label: "Launch", posts: 6 },
  { label: "Hiring", posts: 9 },
];

/**
 * Twenty-six weeks, March to September: weekly engagements, and the prospects
 * and deals they turned into, both running totals.
 */
const PIPELINE: ChartDatum[] = [];
const PIPELINE_TICKS: string[] = [];
const PIPELINE_START = Date.UTC(2026, 2, 2);
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
for (let week = 0; week < 27; week += 1) {
  const date = new Date(PIPELINE_START + week * WEEK_MS);
  const label = date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
  /* One tick per month: the first week that falls inside it. */
  if (date.getUTCDate() <= 7) PIPELINE_TICKS.push(label);
  const growth = 1 + week / 9;
  const wobble = 0.72 + 0.28 * Math.abs(Math.sin(week * 1.7));
  PIPELINE.push({
    label,
    engagements: Math.round(160 * growth * growth * wobble),
    prospects: Math.round(90 + 44 * week + 0.9 * week * week),
    deals: Math.floor(week * 0.95),
  });
}
const PIPELINE_SERIES: ChartSeries[] = [
  { key: "engagements", label: "Engagements", mark: "bar" },
  { key: "prospects", label: "Prospects", mark: "line" },
  {
    key: "deals",
    label: "Deals won",
    mark: "step",
    axis: "right",
    endLabel: true,
  },
];

const IMPRESSIONS_SERIES = { key: "impressions", label: "Impressions" };
const SERIES = [
  IMPRESSIONS_SERIES,
  { key: "engagements", label: "Engagements" },
  { key: "followers", label: "Followers" },
];

const KIT_PREVIEW_CHART = {
  id: "kit-impressions",
  title: "Impressions over time",
  description: "Last 7 days",
  kind: "area",
  summary: "7.4k",
  data: IMPRESSIONS,
  series: [IMPRESSIONS_SERIES],
} satisfies PreviewChart;

const KIT_REPLIES = {
  default: {
    statuses: ["Reading the numbers", "Finding the pattern"],
    parts: [
      {
        type: "text",
        text: "The strongest posts turn one specific decision into a story.",
      },
    ],
  },
  schedule: {
    statuses: ["Checking the calendar", "Finding a clear slot"],
    parts: [
      {
        type: "text",
        text: "Tuesday at 9:00 is clear, so I scheduled it there.",
      },
    ],
  },
} satisfies { default: ScriptedReply; schedule: ScriptedReply };

const AUTHOR_SARAH = {
  name: "Sarah Chen",
  headline: "CEO at Acme",
  avatarUrl: AVATAR(47),
};
const AUTHOR_RAVI = {
  name: "Ravi Patel",
  headline: "Head of Design at Acme",
  avatarUrl: AVATAR(12),
};
const AUTHOR_ACME: PostAuthor = {
  name: "Acme",
  headline: "Company page",
  kind: "company",
  avatarUrl: ACME_LOGO,
};

const POST_LAUNCH: PostChipData = {
  id: "p1",
  title: "Onboarding launch",
  time: "9:00",
  profile: "Sarah",
  status: "scheduled",
  preview: {
    author: AUTHOR_SARAH,
    body: "We rebuilt onboarding from scratch.\n\nThree steps instead of nine. The first post goes out in under ten minutes.\n\nWhat we cut, and why it was harder than adding.",
    media: ASSETS.slice(0, 2),
  },
};
const POST_FOUNDERS: PostChipData = {
  id: "p2",
  title: "Why founders post weekly",
  time: "12:30",
  profile: "Acme",
  status: "draft",
  preview: {
    author: AUTHOR_ACME,
    body: "Founders who post once a week grow their audience 3x faster than those who post when inspired.\n\nConsistency beats brilliance. Here is the cadence we recommend.",
  },
};
const POST_HIRING: PostChipData = {
  id: "p3",
  title: "Hiring: senior designer",
  time: "9:00",
  profile: "Ravi",
  status: "published",
  preview: {
    author: AUTHOR_RAVI,
    body: "We are hiring a senior product designer.\n\nSmall team, real ownership, and a product people use every day. Remote across Europe.\n\nDM me or apply below.",
    media: ASSETS.slice(2, 3),
  },
};
const POST_NORTHWIND: PostChipData = {
  id: "p4",
  title: "Customer story: Northwind",
  time: "10:00",
  profile: "Sarah",
  status: "failed",
  preview: {
    author: AUTHOR_SARAH,
    body: "Northwind cut their onboarding time from three weeks to four days.\n\nHere is how their ops team did it, in their own words.",
    media: ASSETS.slice(3, 4),
  },
};
const POST_Q3: PostChipData = {
  id: "p5",
  title: "Three lessons from Q3",
  time: "9:00",
  profile: "Acme",
  status: "scheduled",
  preview: {
    author: AUTHOR_ACME,
    body: "Three lessons from Q3.\n\n1. Ship smaller.\n2. Talk to customers before the roadmap, not after.\n3. Say no to the second priority.",
  },
};

function buildDays(weeks: number): CalendarDay[] {
  const days: CalendarDay[] = [];
  for (let i = 0; i < weeks * 7; i++) {
    const dayNumber = i + 1;
    const posts: PostChipData[] = [];
    if (dayNumber === 2) posts.push(POST_HIRING);
    if (dayNumber === 3) posts.push(POST_LAUNCH, POST_FOUNDERS);
    if (dayNumber === 10) posts.push(POST_Q3);
    if (dayNumber === 12) posts.push(POST_NORTHWIND);
    days.push({
      date: `2026-09-${String(dayNumber).padStart(2, "0")}`,
      dayNumber,
      isToday: dayNumber === 3,
      posts,
    });
  }
  return days;
}

const TWO_WEEKS = buildDays(2);
const KIT_POSTS_BY_DAY = Object.fromEntries(
  TWO_WEEKS.flatMap((day) =>
    day.posts.length === 0 ? [] : [[day.date, day.posts]],
  ),
) satisfies PostsByDay;
const KIT_PREVIEWS = {
  calendar: TWO_WEEKS,
  analytics: [KIT_PREVIEW_CHART],
};

const PROFILES: ProfileSummary[] = [
  {
    id: "c1",
    name: "Acme",
    headline: "Company page",
    kind: "company",
    status: "connected",
    avatarUrl: ACME_LOGO,
  },
  {
    id: "c2",
    name: "Sarah Chen",
    headline: "CEO at Acme",
    kind: "person",
    status: "connected",
    avatarUrl: AVATAR(47),
  },
  {
    id: "c3",
    name: "Ravi Patel",
    headline: "Head of Growth",
    kind: "person",
    status: "expired",
    avatarUrl: AVATAR(12),
  },
  {
    id: "c4",
    name: "Mia Torres",
    headline: "Design lead",
    kind: "person",
    status: "connected",
    avatarUrl: AVATAR(32),
  },
  {
    id: "c5",
    name: "Jonas Weber",
    headline: "Engineering",
    kind: "person",
    status: "disconnected",
    avatarUrl: AVATAR(59),
  },
];

function kitAnalyticsSnapshot(
  range: "7d" | "1m" | "3m",
  profileId: "all" | "c2",
  factor: number,
): AnalyticsSnapshot {
  const profileFactor = profileId === "all" ? 1 : 0.56;
  const scale = factor * profileFactor;
  const impressions = IMPRESSIONS.map((datum) => ({
    label: datum.label,
    impressions: Math.round(
      (typeof datum["impressions"] === "number" ? datum["impressions"] : 0) *
        scale,
    ),
  }));
  const total = impressions.reduce((sum, datum) => sum + datum.impressions, 0);

  return {
    range,
    profileId,
    overview: {
      stats: [
        {
          value: `${(total / 1000).toFixed(1)}k`,
          label: "Impressions",
          delta: { label: "+18%", direction: "up" },
        },
        {
          value: "6.8%",
          label: "Engagement rate",
          delta: { label: "+2%", direction: "up" },
        },
        {
          value: String(Math.round(42 * scale)),
          label: "Followers gained",
          delta: { label: "+12%", direction: "up" },
        },
        {
          value: String(Math.max(1, Math.round(8 * factor))),
          label: "Posts",
          delta: { label: "0%", direction: "flat" },
        },
      ],
      impressions: {
        data: impressions,
        series: [IMPRESSIONS_SERIES],
      },
      byLabel: {
        data: [
          {
            label: "Thought leadership",
            impressions: Math.round(4100 * scale),
          },
          { label: "Product", impressions: Math.round(2900 * scale) },
          { label: "Case study", impressions: Math.round(1800 * scale) },
        ],
        series: [IMPRESSIONS_SERIES],
      },
      byProfile:
        profileId === "c2"
          ? [
              {
                id: "c2",
                name: "Sarah Chen",
                avatarUrl: AVATAR(47),
                value: Math.round(5200 * factor),
                valueLabel: `${(5.2 * factor).toFixed(1)}k`,
              },
            ]
          : [
              {
                id: "c2",
                name: "Sarah Chen",
                avatarUrl: AVATAR(47),
                value: Math.round(5200 * factor),
                valueLabel: `${(5.2 * factor).toFixed(1)}k`,
              },
              {
                id: "c1",
                name: "Acme",
                kind: "company",
                avatarUrl: ACME_LOGO,
                value: Math.round(4100 * factor),
                valueLabel: `${(4.1 * factor).toFixed(1)}k`,
              },
            ],
      topPosts: [
        {
          id: POST_HIRING.id,
          title: POST_HIRING.title,
          meta: "Ravi Patel · 2 Sep",
          post: POST_HIRING,
          metrics: [
            { label: "Impressions", value: `${(4.1 * scale).toFixed(1)}k` },
            { label: "Engagement", value: "7.6%" },
            { label: "Comments", value: "31" },
          ],
        },
        {
          id: POST_LAUNCH.id,
          title: POST_LAUNCH.title,
          meta: "Sarah Chen · 3 Sep",
          post: POST_LAUNCH,
          metrics: [
            { label: "Impressions", value: `${(3.4 * scale).toFixed(1)}k` },
            { label: "Engagement", value: "6.9%" },
            { label: "Comments", value: "24" },
          ],
        },
      ],
    },
  };
}

const KIT_ANALYTICS_DATA = {
  profiles: [
    { id: "all", name: "All profiles" },
    { id: "c2", name: "Sarah Chen" },
  ],
  snapshots: (
    [
      ["7d", 0.55],
      ["1m", 1],
      ["3m", 2.4],
    ] as const
  ).flatMap(([range, factor]) => [
    kitAnalyticsSnapshot(range, "all", factor),
    kitAnalyticsSnapshot(range, "c2", factor),
  ]),
} satisfies AnalyticsPageData;

function KitChatScope({ children }: { children: ReactNode }) {
  return (
    <ChatProvider replies={KIT_REPLIES} previews={KIT_PREVIEWS}>
      {children}
    </ChatProvider>
  );
}

const SARAH_DETAIL: ProfileDetailData = {
  id: "c2",
  name: "Sarah Chen",
  headline: "CEO at Acme",
  kind: "person",
  status: "connected",
  avatarUrl: AVATAR(47),
  company: {
    name: "Acme",
    logoUrl: ACME_LOGO,
    url: "linkedin.com/company/acme",
  },
  persona: { fileName: "sarah-persona.md" },
};

const RAVI_DETAIL: ProfileDetailData = {
  id: "c3",
  name: "Ravi Patel",
  headline: "Head of Growth",
  kind: "person",
  status: "expired",
  avatarUrl: AVATAR(12),
  company: {
    name: "Acme",
    logoUrl: ACME_LOGO,
    url: "linkedin.com/company/acme",
  },
  persona: { fileName: "ravi-persona.md" },
};

const PROFILE_DETAILS: Record<string, ProfileDetailData> = {
  c1: {
    id: "c1",
    name: "Acme",
    headline: "Company page",
    kind: "company",
    status: "connected",
    avatarUrl: ACME_LOGO,
    persona: { fileName: "acme-voice.md" },
  },
  c2: SARAH_DETAIL,
  c3: RAVI_DETAIL,
  c4: {
    id: "c4",
    name: "Mia Torres",
    headline: "Design lead",
    kind: "person",
    status: "connected",
    avatarUrl: AVATAR(32),
  },
  c5: {
    id: "c5",
    name: "Jonas Weber",
    headline: "Engineering",
    kind: "person",
    status: "disconnected",
    avatarUrl: AVATAR(59),
  },
};

const FILE_SECTIONS: FileSection[] = [
  {
    id: "org",
    title: "Acme",
    kind: "organization",
    avatarUrl: ACME_LOGO,
    nodes: [
      {
        type: "file",
        id: "f1",
        name: "brand-voice.md",
        excerpt:
          "Brand voice\nAcme writes the way its engineers talk in a review: plainly, with the number attached.\nAlways\nSay what changed before saying why it matters.",
        usedByAgent: true,
      },
      {
        type: "file",
        id: "f2",
        name: "content-pillars.md",
        excerpt:
          "Content pillars\nShipping notes, customer numbers, hiring, and the occasional opinion about tooling.",
      },
      {
        type: "file",
        id: "f3",
        name: "audience.md",
        excerpt:
          "Audience\nEngineering leads at Series A to C companies who own a roadmap and a budget.",
        usedByAgent: true,
      },
      {
        type: "folder",
        id: "fo1",
        name: "Campaigns",
        children: [
          { type: "file", id: "f4", name: "q3-launch.md" },
          { type: "file", id: "f5", name: "hiring-push.md" },
        ],
      },
      { type: "file", id: "f10", name: "company-persona.md" },
      { type: "assets", id: "as1", name: "Assets", assets: ASSETS },
    ],
  },
  {
    id: "sarah",
    title: "Sarah Chen",
    kind: "person",
    avatarUrl: AVATAR(47),
    nodes: [
      { type: "file", id: "f6", name: "sarah-persona.md" },
      { type: "file", id: "f7", name: "talking-points.md" },
      {
        type: "folder",
        id: "fo2",
        name: "Drafts",
        children: [{ type: "file", id: "f8", name: "founder-mode.md" }],
      },
      { type: "assets", id: "as2", name: "Assets", assets: ASSETS.slice(0, 3) },
    ],
  },
  {
    id: "ravi",
    title: "Ravi Patel",
    kind: "person",
    avatarUrl: AVATAR(12),
    nodes: [{ type: "file", id: "f9", name: "ravi-persona.md" }],
  },
];

const SKILLS: Skill[] = [
  {
    id: "s1",
    name: "Draft from a calendar gap",
    description: "Proposes a post whenever a weekday has nothing scheduled.",
    enabled: true,
    fileName: "calendar-gap.md",
  },
  {
    id: "s2",
    name: "Repurpose top posts",
    description: "Turns last month's best post into a new angle.",
    enabled: true,
    fileName: "repurpose.md",
  },
  {
    id: "s3",
    name: "Comment suggestions",
    description: "Finds posts from targeted accounts worth replying to.",
    enabled: false,
    fileName: "comments.md",
  },
  {
    id: "s4",
    name: "Weekly recap",
    description: "Summarizes reach and follows every Monday.",
    enabled: true,
    fileName: "weekly-recap.md",
  },
];

/** Every skill is a markdown file; this stands in for its contents. */
function skillMarkdown(skill: Skill): string {
  return `# ${skill.name}

## When to run
${skill.description}

## Steps
- Pull the posts and calendar context for the profile.
- Draft in Sarah's voice, under 120 words.
- Attach the draft to the thread for review.

## Avoid
- Emoji and hashtags.
- Claims without a number behind them.
`;
}

const SKILL_TEXT: Record<string, string> = Object.fromEntries(
  SKILLS.map((skill) => [skill.id, skillMarkdown(skill)]),
);

const PERSONA_MD = `# Sarah Chen

## Voice
Direct, warm, and specific. Short paragraphs. Numbers over adjectives.

## Topics
- Building a small team that ships
- Onboarding and activation
- Hiring designers

## Avoid
- Hustle language
- Emoji in the first line`;

const KIT_DOCUMENTS: OpenDocument[] = [
  {
    id: "f1",
    meta: { title: "brand-voice.md" },
    value: `# Acme voice

## Position
Useful operating detail for small B2B teams.

## Style
- Start with the decision
- Use one concrete number
- End before the summary`,
  },
  {
    id: "f6",
    meta: { title: "sarah-persona.md" },
    value: PERSONA_MD,
  },
  {
    id: "s1",
    meta: { title: "calendar-gap.md" },
    value: SKILL_TEXT["s1"] ?? "",
  },
];

const TEAM: TeamMember[] = [
  {
    id: "m1",
    email: "sarah@acme.com",
    name: "Sarah Chen",
    avatarUrl: AVATAR(47),
    role: "admin",
    status: "you",
  },
  { id: "m2", email: "ravi@acme.com", role: "admin", status: "invited" },
];

const STEPS = [
  { id: "account", label: "Account created" },
  { id: "org", label: "Set up organization" },
  { id: "team", label: "Invite team" },
  { id: "linkedin", label: "Connect LinkedIn" },
];

/* Demos. Each shows one component in isolation, in the states it has. */

/** A slot inside a kit section. `label` is accepted so call sites can name the
 *  state they are showing, but it is not rendered. */
export function Demo({
  children,
  className,
}: {
  label?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("min-w-0", className)}>{children}</div>;
}

/** Frame for components that normally sit on the page background. */
function OnBackground({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex overflow-hidden rounded-surface bg-imagine-background",
        className,
      )}
    >
      {children}
    </div>
  );
}

/**
 * Stand-in for the main surface. Fills the frame beside the rail and rounds
 * only the corners that meet it, the way the page rounds into the sidebar.
 * `children` stand in for the page's own header controls.
 */
function PageStub({
  side = "right",
  children,
}: {
  side?: "left" | "right";
  children?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "min-w-28 flex-1 bg-imagine-surface shadow-raised",
        side === "right" ? "rounded-l-surface" : "rounded-r-surface",
      )}
    >
      {/* Matches the rail's org row: `py-m` then a 32px row, so the collapse
          control keeps its baseline when it crosses over. */}
      <div className="mt-m mb-xxl flex h-8 items-center gap-s px-m">
        {children}
      </div>
    </div>
  );
}

const SIDEBAR_USER = {
  name: "Sarah Chen",
  avatarUrl: AVATAR(47),
};

export function LoadingDemo() {
  return (
    <div className="flex flex-wrap items-start gap-xl">
      <Demo
        label="Page loading (route loading.tsx)"
        className="w-full max-w-md"
      >
        <OnBackground className="h-64 items-center justify-center">
          <LogoLoader />
        </OnBackground>
      </Demo>
      <Demo label="Inline, small">
        <LogoLoader size="w-18" />
      </Demo>
    </div>
  );
}

export function SidebarDemo() {
  const [active, setActive] = useState<SidebarNavKey>("agent");
  const [expandedCollapsed, setExpandedCollapsed] = useState(false);
  const [railCollapsed, setRailCollapsed] = useState(true);
  const [stubProfileIds, setStubProfileIds] = useState<readonly string[]>([
    "c1",
    "c2",
    "c4",
  ]);

  return (
    <div className="flex flex-col gap-xl">
      <Demo label="Expanded. The chevron in the rail collapses it">
        <OnBackground className="h-[900px]">
          <Sidebar
            orgName="Acme"
            orgLogoUrl={ACME_LOGO}
            active={active}
            collapsed={expandedCollapsed}
            onCollapsedChange={setExpandedCollapsed}
            threads={THREADS}
            activeThreadId="t1"
            onNavigate={setActive}
            onNewPost={() => {
              toast("New chat");
            }}
            onOpenThread={(id) => {
              toast(`Open thread ${id}`);
            }}
            onHelp={(key) => {
              toast(`Help: ${key}`);
            }}
          />
          <PageStub>
            <AnimatePresence initial={false}>
              {expandedCollapsed ? (
                <SidebarExpandButton
                  key="expand"
                  onExpand={() => {
                    setExpandedCollapsed(false);
                  }}
                />
              ) : null}
            </AnimatePresence>
            <ProfileSelector
              profiles={PROFILES}
              selectedIds={stubProfileIds}
              onSelectedIdsChange={setStubProfileIds}
              className={cn(!expandedCollapsed && "-ml-1.5")}
            />
            <AccountControls
              user={SIDEBAR_USER}
              className="ml-auto"
              onOpenAccount={() => {
                toast("Account");
              }}
              onOpenSettings={() => {
                toast("Settings");
              }}
            />
          </PageStub>
        </OnBackground>
      </Demo>
      <Demo label="Collapsed. The chevron moves to the page and expands it">
        <OnBackground className="h-[900px]">
          <Sidebar
            orgName="Acme"
            orgLogoUrl={ACME_LOGO}
            active={active}
            collapsed={railCollapsed}
            onCollapsedChange={setRailCollapsed}
            threads={THREADS}
            activeThreadId="t1"
            onNavigate={setActive}
          />
          <PageStub>
            <AnimatePresence initial={false}>
              {railCollapsed ? (
                <SidebarExpandButton
                  key="expand"
                  onExpand={() => {
                    setRailCollapsed(false);
                  }}
                />
              ) : null}
            </AnimatePresence>
            <AccountControls user={SIDEBAR_USER} className="ml-auto" />
          </PageStub>
        </OnBackground>
      </Demo>
    </div>
  );
}

export function ChatChromeDemo() {
  const [panel, setPanel] = useState<ChatPanelMode | null>("history");
  const [columnPanel, setColumnPanel] = useState<ChatPanelMode | null>(null);

  return (
    <div className="flex flex-col gap-xl">
      <Demo label="Chat title, controls, and context panel">
        <LayoutGroup id="kit-chat-context">
          <div className="flex h-96 overflow-hidden border border-imagine-border bg-imagine-surface">
            <div className="flex min-w-0 flex-1 flex-col p-l">
              <div className="flex h-8 items-center gap-s">
                <ChatTitle title="What made Friday's post take off" />
                <ChatControls
                  panel={panel}
                  onPanelChange={setPanel}
                  className="ml-auto"
                />
              </div>
              <p className="mt-auto max-w-sm type-small text-imagine-foreground-muted">
                Toggle history and files to inspect both working-panel states.
              </p>
            </div>
            <AnimatePresence initial={false}>
              {panel === null ? null : (
                <ChatContextPanel
                  key="kit-context-panel"
                  mode={panel}
                  threads={THREADS}
                  fileSections={FILE_SECTIONS}
                  currentThreadId="t1"
                  currentTitle="What made Friday's post take off"
                  onSelectThread={(id) => {
                    toast(`Open ${id}`);
                  }}
                  onClose={() => {
                    setPanel(null);
                  }}
                />
              )}
            </AnimatePresence>
          </div>
        </LayoutGroup>
      </Demo>

      <Demo label="Docked chat column, with its history panel">
        <KitChatScope>
          <LayoutGroup id="kit-chat-column">
            <div className="flex h-96 justify-end overflow-hidden border border-imagine-border bg-imagine-surface">
              <ChatColumn
                page="analytics"
                title="New chat"
                panel={columnPanel}
                onPanelChange={setColumnPanel}
              />
              <AnimatePresence initial={false}>
                {columnPanel === null ? null : (
                  <ChatContextPanel
                    key="kit-column-context"
                    mode={columnPanel}
                    threads={THREADS}
                    fileSections={FILE_SECTIONS}
                    currentThreadId={null}
                    currentTitle="New chat"
                    onSelectThread={(id) => {
                      toast(`Open ${id}`);
                    }}
                    onClose={() => {
                      setColumnPanel(null);
                    }}
                  />
                )}
              </AnimatePresence>
            </div>
          </LayoutGroup>
        </KitChatScope>
      </Demo>
    </div>
  );
}

export function FilesPanelDemo() {
  const [activeFile, setActiveFile] = useState<string | undefined>("f6");
  const [skills, setSkills] = useState(SKILLS);
  const [openSkills, setOpenSkills] = useState<readonly string[]>(["s1"]);
  const [activeSkill, setActiveSkill] = useState<string | null>("s1");
  const [text, setText] = useState(SKILL_TEXT);
  const [savedText, setSavedText] = useState(SKILL_TEXT);

  const toggleSkill = (id: string, enabled: boolean) => {
    setSkills((current) =>
      current.map((skill) => (skill.id === id ? { ...skill, enabled } : skill)),
    );
  };

  const openSkillFile = (id: string) => {
    setOpenSkills((current) =>
      current.includes(id) ? current : [...current, id],
    );
    setActiveSkill(id);
  };

  const skillById = new Map(skills.map((skill) => [skill.id, skill]));
  const skillTabs: EditorTab[] = openSkills.map((id) => ({
    id,
    label: skillById.get(id)?.fileName ?? id,
    closable: true,
    dirty: (text[id] ?? "") !== (savedText[id] ?? ""),
  }));
  const openSkill =
    activeSkill === null ? undefined : skillById.get(activeSkill);

  return (
    <div className="flex flex-wrap gap-xl">
      <Demo label="Files panel">
        <OnBackground className="h-[720px] rounded-l-none">
          <PageStub side="left" />
          <FilesPanel
            title="Acme"
            logoUrl={ACME_LOGO}
            dragHint
            sections={FILE_SECTIONS}
            skills={skills}
            activeFileId={activeFile}
            openSkillId={activeSkill ?? undefined}
            onOpenFile={setActiveFile}
            onToggleSkill={toggleSkill}
            onOpenSkillFile={openSkillFile}
            onEditFile={(id) => {
              toast(`Edit ${id}`);
            }}
            onAttachFile={(file) => {
              toast(`Attached ${file.title}`);
            }}
            onOpenAsset={(asset) => {
              toast(asset.caption ?? asset.id);
            }}
            onClose={() => {
              toast("Close panel");
            }}
          />
        </OnBackground>
      </Demo>
      <Demo label="File tree" className="w-72">
        <FileTree
          sections={FILE_SECTIONS.slice(0, 2)}
          activeFileId={activeFile}
          onOpenFile={setActiveFile}
          assetSize="sm"
        />
      </Demo>
      <Demo
        label="Skills. The file under each one opens in an editor tab"
        className="w-full"
      >
        <div className="grid gap-l lg:grid-cols-[20rem_1fr]">
          <SkillsList
            skills={skills}
            openSkillId={activeSkill ?? undefined}
            onToggle={toggleSkill}
            onOpenFile={openSkillFile}
          />
          <OnBackground className="min-h-80 p-s">
            {openSkill ? (
              <EditorTabStrip
                tabs={skillTabs}
                activeId={openSkill.id}
                onActivate={setActiveSkill}
                onClose={(id) => {
                  const next = openSkills.filter((open) => open !== id);
                  setOpenSkills(next);
                  if (activeSkill === id) {
                    setActiveSkill(next.at(-1) ?? null);
                  }
                }}
                className="w-full"
              >
                <MarkdownEditor
                  meta={{ title: openSkill.fileName }}
                  value={text[openSkill.id] ?? ""}
                  savedValue={savedText[openSkill.id] ?? ""}
                  onValueChange={(next) => {
                    setText((current) => ({
                      ...current,
                      [openSkill.id]: next,
                    }));
                  }}
                  onSave={() => {
                    setSavedText((current) => ({
                      ...current,
                      [openSkill.id]: text[openSkill.id] ?? "",
                    }));
                    toast.success(`Saved ${openSkill.fileName}`);
                  }}
                  className="p-l"
                />
              </EditorTabStrip>
            ) : (
              <p className="m-auto type-small text-imagine-foreground-muted">
                Open a skill file to edit it.
              </p>
            )}
          </OnBackground>
        </div>
      </Demo>
    </div>
  );
}

export function FilesWorkspacePageDemo() {
  return (
    <Demo label="Full Files route, with a wider tree and preview">
      <div className="flex h-[720px] min-w-0 bg-imagine-surface p-l">
        <FilesWorkspacePage
          title="Acme"
          logoUrl={ACME_LOGO}
          sections={FILE_SECTIONS}
          skills={SKILLS}
          documents={KIT_DOCUMENTS}
        />
      </div>
    </Demo>
  );
}

const DOCUMENT_ACTIONS = [
  { id: "open", label: "Open", icon: "file-lines" as const },
  { id: "send", label: "Send to chat", icon: "imagine" as const },
  { id: "rename", label: "Rename", icon: "pen" as const },
  {
    id: "trash",
    label: "Move to trash",
    icon: "trash" as const,
    destructive: true,
  },
];

const BRAND_VOICE_EXCERPT =
  "Brand voice\nAcme writes the way its engineers talk in a review: plainly, with the number attached.\nAlways\nSay what changed before saying why it matters.";

/** The pieces the Files page is built from, shown on their own. */
export function FilesPartsDemo() {
  const [selectedId, setSelectedId] = useState("f1");
  const act = (name: string) => (action: string) => {
    toast(`${action} · ${name}`);
  };

  return (
    <Demo label="New menu, tree, and cards">
      <div className="grid gap-l lg:grid-cols-[15rem_1fr]">
        <div className="flex flex-col gap-m rounded-panel bg-imagine-surface-raised p-s">
          <NewMenu
            onIntent={(intent) => {
              toast(`New ${intent}`);
            }}
          />
          <FileTreeNav
            sections={FILE_SECTIONS}
            selectedId={selectedId}
            onSelectLocation={({ sectionId, folderId }) => {
              setSelectedId(folderId ?? sectionId);
            }}
            onOpenFile={setSelectedId}
          />
        </div>

        <div className="flex flex-col gap-l">
          <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-m">
            <LibraryCard
              kind="folder"
              name="Campaigns"
              onPress={() => {
                toast("Open Campaigns");
              }}
              actions={DOCUMENT_ACTIONS.slice(2)}
              onAction={act("Campaigns")}
            />
            <LibraryCard
              kind="document"
              name="brand-voice.md"
              excerpt={BRAND_VOICE_EXCERPT}
              onPress={() => {
                toast("Open brand-voice.md");
              }}
              actions={DOCUMENT_ACTIONS}
              onAction={act("brand-voice.md")}
            />
            <LibraryCard
              kind="document"
              name="untitled.md"
              selected
              onPress={() => {
                toast("Open untitled.md");
              }}
              actions={DOCUMENT_ACTIONS}
              onAction={act("untitled.md")}
            />
            <LibraryCard
              kind="image"
              name="Team at the offsite"
              {...(ASSETS[0]?.src === undefined ? {} : { src: ASSETS[0].src })}
              onPress={() => {
                toast("Preview image");
              }}
              actions={DOCUMENT_ACTIONS.slice(1, 2)}
              onAction={act("Team at the offsite")}
            />
            <LibraryCard
              kind="video"
              name="Launch teaser"
              {...(ASSETS[1]?.src === undefined ? {} : { src: ASSETS[1].src })}
              onPress={() => {
                toast("Preview video");
              }}
              actions={DOCUMENT_ACTIONS.slice(1, 2)}
              onAction={act("Launch teaser")}
            />
            <LibraryCard
              kind="image"
              name="Missing file"
              onPress={() => {
                toast("Preview image");
              }}
            />
          </div>
          <div className="flex flex-col gap-px">
            <LibraryCard
              view="list"
              kind="folder"
              name="Campaigns"
              onPress={() => {
                toast("Open Campaigns");
              }}
              actions={DOCUMENT_ACTIONS.slice(2)}
              onAction={act("Campaigns")}
            />
            <LibraryCard
              view="list"
              kind="document"
              name="brand-voice.md"
              onPress={() => {
                toast("Open brand-voice.md");
              }}
              actions={DOCUMENT_ACTIONS}
              onAction={act("brand-voice.md")}
            />
            <LibraryCard
              view="list"
              kind="image"
              name="Team at the offsite"
              onPress={() => {
                toast("Preview image");
              }}
              actions={DOCUMENT_ACTIONS.slice(1, 2)}
              onAction={act("Team at the offsite")}
            />
          </div>
        </div>
      </div>
    </Demo>
  );
}

export function FilesLibraryDemo() {
  return (
    <Demo label="Full-height white sidebar with the tree; the browser shows one location as folders, documents, and images">
      <div className="flex h-[720px] min-w-0 flex-col overflow-hidden bg-imagine-surface">
        <FilesLibrary
          title="Acme"
          sections={FILE_SECTIONS}
          skills={SKILLS}
          documents={KIT_DOCUMENTS}
          onSendToChat={(resource) => {
            toast(
              `Sent ${resource.kind === "file" ? resource.file.title : (resource.asset.caption ?? "asset")} to chat`,
            );
          }}
        />
      </div>
    </Demo>
  );
}

export function ResourceContextDemo() {
  return (
    <Demo label="Files and assets attached to chat">
      <div className="flex flex-wrap gap-m bg-imagine-surface p-l">
        <ResourceContext
          resource={{
            kind: "file",
            file: { id: "f1", title: "brand-voice.md" },
          }}
          onRemove={() => {
            toast("Removed brand-voice.md");
          }}
        />
        <ResourceContext
          resource={{
            kind: "asset",
            asset: ASSETS[1] ?? { id: "a2", kind: "image" },
          }}
          onRemove={() => {
            toast("Removed asset");
          }}
        />
      </div>
    </Demo>
  );
}

export function ComposerDemo() {
  const [hero, setHero] = useState("");
  const [dock, setDock] = useState("");
  const [withPreview, setWithPreview] = useState("");
  const [preview, setPreview] = useState<ComposerPreview | null>("calendar");
  const [attached, setAttached] = useState<PostChipData | null>(null);

  return (
    <div className="flex flex-col gap-xl">
      <Demo label="Hero (landing)">
        <OnBackground className="p-xxl">
          <Composer
            variant="hero"
            value={hero}
            onValueChange={setHero}
            onSend={(text) => {
              toast(`Sent: ${text}`);
              setHero("");
            }}
          />
        </OnBackground>
      </Demo>
      <div className="grid gap-xl lg:grid-cols-2">
        <Demo label="Dock (thread)">
          <OnBackground className="items-end p-l">
            <Composer
              value={dock}
              onValueChange={setDock}
              onSend={(text) => {
                toast(`Sent: ${text}`);
                setDock("");
              }}
              preview={null}
              onPreviewChange={() => {
                toast("Preview opens in the next demo");
              }}
              onAttach={() => {
                toast("Attach");
              }}
            />
          </OnBackground>
        </Demo>
        <Demo label="Dock with a preview open. Select a post to attach it to the message.">
          <OnBackground className="items-end p-l">
            <Composer
              value={withPreview}
              onValueChange={setWithPreview}
              onSend={(text) => {
                toast(
                  attached
                    ? `Sent about "${attached.title}": ${text}`
                    : `Sent: ${text}`,
                );
                setWithPreview("");
                setAttached(null);
              }}
              placeholder={
                attached ? `Ask about "${attached.title}"` : undefined
              }
              preview={preview}
              onPreviewChange={setPreview}
              attachments={
                <PostContext
                  posts={attached ? [attached] : []}
                  onRemove={() => {
                    setAttached(null);
                  }}
                />
              }
              onAttach={() => {
                toast("Attach");
              }}
            >
              <PreviewSurface
                open={preview === "calendar"}
                expandLabel="Open calendar"
                onExpand={() => {
                  toast("Expands to /calendar");
                }}
              >
                <CalendarGrid
                  days={TWO_WEEKS}
                  density="preview"
                  selectedPostId={attached?.id}
                  onOpenPost={(post) => {
                    setAttached((current) =>
                      current?.id === post.id ? null : post,
                    );
                  }}
                />
              </PreviewSurface>
              <PreviewSurface
                open={preview === "analytics"}
                expandLabel="Open analytics"
                onExpand={() => {
                  toast("Expands to /analytics");
                }}
              >
                <ChartBlock
                  kind="bar"
                  data={IMPRESSIONS}
                  series={[IMPRESSIONS_SERIES]}
                  tone="accent"
                  dense
                  plain
                  highlightIndex={3}
                />
              </PreviewSurface>
            </Composer>
          </OnBackground>
        </Demo>
      </div>
    </div>
  );
}

export function ProfileSelectorDemo() {
  const [selectedIds, setSelectedIds] = useState<readonly string[]>(
    PROFILES.filter((profile) => profile.status === "connected").map(
      (profile) => profile.id,
    ),
  );

  return (
    <div className="flex flex-col gap-xs pl-xs">
      <ProfileSelector
        profiles={PROFILES}
        selectedIds={selectedIds}
        onSelectedIdsChange={setSelectedIds}
        className="mb-s self-start"
      />
      <h1 className="type-title">
        How can I help with your LinkedIn content today?
      </h1>
      <p className="type-small text-imagine-foreground-muted">
        Tuesday, 8 September
      </p>
    </div>
  );
}

export function TimelineDemo() {
  const [entries, setEntries] = useState(TIMELINE);

  return (
    <div className="flex flex-col gap-m">
      <div className="max-w-2xl pl-xs">
        <Timeline
          entries={entries}
          onAction={(entry, action) => {
            toast(`${action.label}: ${entry.title}`);
            setEntries((current) =>
              current.filter((item) => item.id !== entry.id),
            );
          }}
        />
      </div>
      {entries.length < TIMELINE.length ? (
        <Button
          variant="ghost"
          size="sm"
          className="self-start"
          onClick={() => {
            setEntries(TIMELINE);
          }}
        >
          Reset
        </Button>
      ) : null}
    </div>
  );
}

export function StatTileDemo() {
  return (
    <div className="flex flex-col gap-xl">
      <div className="flex flex-wrap gap-xl">
        <Demo label="Default, up">
          <StatTile
            value="12.4k"
            label="Impressions"
            delta={{ label: "+12%", direction: "up" }}
          />
        </Demo>
        <Demo label="Default, down">
          <StatTile
            value="4.2%"
            label="Engagement rate"
            delta={{ label: "-0.3", direction: "down" }}
          />
        </Demo>
        <Demo label="Compact, flat">
          <StatTile
            value="24"
            label="New followers"
            delta={{ label: "0", direction: "flat" }}
            size="compact"
          />
        </Demo>
        <Demo label="Compact, no delta">
          <StatTile value="4" label="Scheduled" size="compact" />
        </Demo>
      </div>
      <Demo label="Stat group, four across. Switch the range to see values swap">
        <StatGroupDemo />
      </Demo>
    </div>
  );
}

const STATS_BY_RANGE = {
  "7d": [
    { label: "Impressions", value: "12.4k", delta: "+12%", direction: "up" },
    { label: "Engagements", value: "1,208", delta: "+4%", direction: "up" },
    {
      label: "Engagement rate",
      value: "4.2%",
      delta: "-0.3",
      direction: "down",
    },
    { label: "New followers", value: "318", delta: "+41", direction: "up" },
  ],
  "30d": [
    { label: "Impressions", value: "48.9k", delta: "+8%", direction: "up" },
    { label: "Engagements", value: "5,014", delta: "+2%", direction: "up" },
    { label: "Engagement rate", value: "4.5%", delta: "+0.1", direction: "up" },
    { label: "New followers", value: "1,102", delta: "0", direction: "flat" },
  ],
} as const satisfies Record<
  string,
  readonly {
    label: string;
    value: string;
    delta: string;
    direction: "up" | "down" | "flat";
  }[]
>;

function StatGroupDemo() {
  const [range, setRange] = useState<keyof typeof STATS_BY_RANGE>("7d");

  return (
    <div className="flex flex-col gap-m">
      <ToggleGroup
        size="sm"
        value={range}
        onValueChange={(next) => {
          if (next === "7d" || next === "30d") setRange(next);
        }}
      >
        <ToggleGroupItem value="7d">7d</ToggleGroupItem>
        <ToggleGroupItem value="30d">30d</ToggleGroupItem>
      </ToggleGroup>
      <StatGroup>
        {STATS_BY_RANGE[range].map((stat) => (
          <StatTile
            key={stat.label}
            value={stat.value}
            label={stat.label}
            delta={{ label: stat.delta, direction: stat.direction }}
          />
        ))}
      </StatGroup>
    </div>
  );
}

export function ChartBlockDemo() {
  return (
    <div className="grid gap-xl lg:grid-cols-2">
      <Demo
        label="Composed: bars, a line, a step on its own scale, annotated"
        className="lg:col-span-2"
      >
        <ChartBlock
          kind="composed"
          data={PIPELINE}
          series={PIPELINE_SERIES}
          title="Content → pipeline"
          description="Weekly, last six months"
          xTicks={PIPELINE_TICKS}
          annotations={[
            { at: PIPELINE[13]?.label ?? "", label: "CSM hire" },
            { at: PIPELINE[22]?.label ?? "", label: "Rebrand" },
          ]}
          legend
        />
      </Demo>
      <Demo label="Bar, accent, dense, highlighted day (right rail)">
        <ChartBlock
          kind="bar"
          data={IMPRESSIONS}
          series={[IMPRESSIONS_SERIES]}
          tone="accent"
          dense
          highlightIndex={3}
        />
      </Demo>
      <Demo label="Bar, value labels, mean rule">
        <ChartBlock
          kind="bar"
          data={BY_TYPE}
          series={[{ key: "posts", label: "Posts" }]}
          title="By post type"
          description="Last 30 days"
        />
      </Demo>
      <Demo label="Area, three series, key with totals, toggles">
        <ChartBlock
          kind="area"
          data={IMPRESSIONS}
          series={SERIES}
          title="Impressions over time"
          description="Last 7 days"
          legend
        />
      </Demo>
      <Demo label="Horizontal bar, values at the end">
        <ChartBlock
          kind="hbar"
          data={BY_TYPE}
          series={[{ key: "posts", label: "Posts" }]}
          title="Posts by type"
          description="Last 30 days"
        />
      </Demo>
    </div>
  );
}

export function ChartCardDemo() {
  const [selected, setSelected] = useState(false);

  return (
    <div className="grid gap-xl lg:grid-cols-2">
      <Demo label="Page chart card, press to attach">
        <ChartCard
          chart={KIT_PREVIEW_CHART}
          selected={selected}
          onOpen={() => {
            setSelected((current) => !current);
          }}
        />
      </Demo>
      <Demo label="Dense chart card for the composer preview">
        <ChartCard
          chart={KIT_PREVIEW_CHART}
          dense
          selected
          onOpen={() => {
            toast("Attached impressions");
          }}
        />
      </Demo>
    </div>
  );
}

export function PostChipDemo() {
  return (
    <div className="flex flex-wrap gap-xl">
      {[POST_LAUNCH, POST_FOUNDERS, POST_HIRING, POST_NORTHWIND].map((post) => (
        <Demo key={post.id} label={post.status} className="w-44">
          <PostChip
            post={post}
            onOpen={() => {
              toast(post.title);
            }}
          />
        </Demo>
      ))}
      <Demo label="selected" className="w-44">
        <PostChip
          post={POST_LAUNCH}
          selected
          onOpen={() => {
            toast(POST_LAUNCH.title);
          }}
        />
      </Demo>
      <Demo label="dense (preview)" className="w-44">
        <PostChip post={POST_Q3} dense />
      </Demo>
    </div>
  );
}

export function CalendarGridDemo() {
  return (
    <div className="flex flex-col gap-xl">
      <Demo label="Strip density (landing, two weeks)">
        <CalendarGrid
          days={TWO_WEEKS}
          density="strip"
          onOpenPost={(post) => {
            toast(post.title);
          }}
        />
      </Demo>
      <div className="grid gap-xl lg:grid-cols-[1fr_1.4fr]">
        <Demo label="Preview density (inside the composer)">
          <CalendarGrid days={TWO_WEEKS} density="preview" />
        </Demo>
        <Demo label="Page density, one week, selected post">
          <CalendarGrid
            days={TWO_WEEKS.slice(0, 7)}
            density="page"
            selectedPostId="p1"
            onOpenPost={(post) => {
              toast(post.title);
            }}
            onSelectDay={(day) => {
              toast(`Day ${String(day.dayNumber)}`);
            }}
          />
        </Demo>
      </div>
    </div>
  );
}

export function CalendarTimeGridDemo() {
  const selectedDay = TWO_WEEKS[2];

  return (
    <div className="flex flex-col gap-xl">
      <Demo label="Day view, hours down the side">
        <CalendarTimeGrid
          days={selectedDay === undefined ? [] : [selectedDay]}
          selectedPostId="p1"
          onOpenPost={(post) => {
            toast(post.title);
          }}
        />
      </Demo>
      <Demo label="Week view, compact posts in their time slots">
        <CalendarTimeGrid
          days={TWO_WEEKS.slice(0, 7)}
          onOpenPost={(post) => {
            toast(post.title);
          }}
        />
      </Demo>
    </div>
  );
}

export function CalendarToolbarDemo() {
  const [view, setView] = useState<CalendarView>("week");
  const [search, setSearch] = useState("");
  const [month, setMonth] = useState(8);
  const label = new Date(2026, month, 1).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="flex flex-col gap-xl">
      <Demo label="Calendar toolbar">
        <CalendarToolbar
          rangeLabel={label}
          view={view}
          onViewChange={setView}
          onPrevious={() => {
            setMonth((m) => m - 1);
          }}
          onNext={() => {
            setMonth((m) => m + 1);
          }}
          onToday={() => {
            setMonth(8);
          }}
          search={search}
          onSearchChange={setSearch}
        />
      </Demo>
      <Demo label="Up next (right rail)" className="max-w-80">
        <UpNextList
          items={[
            {
              id: "u1",
              when: "Tue 9:00",
              title: "Onboarding launch",
              profileName: "Sarah Chen",
            },
            {
              id: "u2",
              when: "Wed 12:30",
              title: "Why founders post weekly",
              profileName: "Acme",
            },
            {
              id: "u3",
              when: "Fri 9:00",
              title: "Three lessons from Q3",
              profileName: "Acme",
            },
          ]}
          onOpen={(item) => {
            toast(item.title);
          }}
          onViewAll={() => {
            toast("Open calendar");
          }}
        />
      </Demo>
    </div>
  );
}

const TEXT_REPLY: MessagePart[] = [
  {
    type: "text",
    text: "Reach climbed on the days you posted from Sarah's profile, and Thursday's hiring post is still picking up comments.",
  },
  {
    type: "emphasis",
    text: "Thursday did 1.6k impressions, your best day this month.",
  },
];

const CHART_REPLY: MessagePart[] = [
  { type: "text", text: "Here is the week." },
  {
    type: "chart",
    kind: "bar",
    data: IMPRESSIONS,
    series: [IMPRESSIONS_SERIES],
    title: "Impressions, last 7 days",
    highlightIndex: 3,
  },
];

export function MessagesDemo() {
  const [thinking, setThinking] = useState(true);

  return (
    <div className="grid gap-xl lg:grid-cols-2">
      <Demo label="User message, with attachments">
        <UserMessage
          text="How did the last two weeks go, and what should I post next?"
          attachments={ASSETS.slice(0, 2)}
        />
      </Demo>
      <Demo label="Agent message: text and emphasis">
        <AgentMessage parts={TEXT_REPLY} />
      </Demo>
      <Demo label="Agent message: inline chart part">
        <AgentMessage parts={CHART_REPLY} />
      </Demo>
      <Demo label="Agent message: thinking">
        <div className="flex flex-col gap-m">
          <AgentMessage
            parts={[{ type: "text", text: "Looking at your calendar." }]}
            thinking={thinking}
            thinkingStatuses={[
              "Reading your calendar",
              "Checking last week's numbers",
              "Drafting",
            ]}
          />
          <Button
            size="sm"
            variant="ghost"
            className="self-start"
            onClick={() => {
              setThinking((t) => !t);
            }}
          >
            {thinking ? "Stop" : "Think again"}
          </Button>
        </div>
      </Demo>
    </div>
  );
}

const DRAFT_AUTHOR = AUTHOR_SARAH;
const DRAFT_BODY = POST_LAUNCH.preview?.body ?? "";

export function PostDraftDemo() {
  const [body, setBody] = useState(DRAFT_BODY);
  const [editing, setEditing] = useState(false);

  return (
    <div className="grid gap-xl lg:grid-cols-2">
      <Demo label="Draft with media">
        <LinkedInPostDraft
          author={DRAFT_AUTHOR}
          body={DRAFT_BODY}
          media={ASSETS.slice(0, 2)}
          footer={
            <div className="flex gap-s">
              <Button size="sm">Schedule</Button>
              <Button size="sm" variant="soft">
                Edit
              </Button>
            </div>
          }
        />
      </Demo>
      <Demo label={editing ? "Editing" : "Text only"}>
        <LinkedInPostDraft
          author={AUTHOR_ACME}
          body={body}
          editing={editing}
          onBodyChange={setBody}
          footer={
            <Button
              size="sm"
              variant="soft"
              onClick={() => {
                setEditing((e) => !e);
              }}
            >
              {editing ? "Done" : "Edit"}
            </Button>
          }
        />
      </Demo>
    </div>
  );
}

export function ScheduledGraphicDemo() {
  return (
    <div className="flex flex-wrap gap-xl">
      <Demo label="With quick actions" className="w-full max-w-md">
        <ScheduledGraphic
          dayNumber={9}
          monthLabel="Sep"
          whenLabel="Tue, 9 Sep at 9:00"
          timeLabel="9:00"
          profileName="Sarah Chen"
          weekdayIndex={1}
          occupied={[3]}
          chips={[
            { intent: "move", label: "Move" },
            { intent: "time", label: "Change time" },
            { intent: "open-calendar", label: "Open in calendar" },
          ]}
          onChip={(chip) => {
            toast(chip.label);
          }}
        />
      </Demo>
      <Demo label="Busy week" className="w-full max-w-md">
        <ScheduledGraphic
          dayNumber={12}
          monthLabel="Sep"
          whenLabel="Fri, 12 Sep at 10:00"
          timeLabel="10:00"
          profileName="Acme"
          weekdayIndex={4}
          occupied={[0, 1, 2]}
        />
      </Demo>
    </div>
  );
}

export function AssetsDemo() {
  const [selected, setSelected] = useState<string | undefined>("a2");

  return (
    <div className="flex flex-col gap-xl">
      <div className="flex flex-wrap gap-xl">
        <Demo label="Image" className="w-24">
          <AssetTile asset={ASSETS[0] ?? { id: "x", kind: "image" }} />
        </Demo>
        <Demo label="Video" className="w-24">
          <AssetTile asset={ASSETS[2] ?? { id: "x", kind: "video" }} />
        </Demo>
        <Demo label="Selected" className="w-24">
          <AssetTile
            asset={ASSETS[1] ?? { id: "x", kind: "image" }}
            selected
            onSelect={() => {
              toast("Selected");
            }}
          />
        </Demo>
        <Demo label="No source" className="w-24">
          <AssetTile asset={{ id: "empty", kind: "image", caption: "logo" }} />
        </Demo>
        <Demo label="Grid, four shown, rest folded">
          <AssetGrid
            assets={ASSETS}
            limit={3}
            size="sm"
            onShowAll={() => {
              toast("Show all");
            }}
          />
        </Demo>
      </div>
      <Demo label="Asset picker (agent offers images)" className="max-w-lg">
        <AssetPicker
          prompt="Want a different image for it?"
          assets={ASSETS}
          selectedId={selected}
          onSelectedChange={setSelected}
          onConfirm={(asset) => {
            toast(`Use ${asset.caption ?? asset.id}`);
          }}
          onBrowse={() => {
            toast("Browse files");
          }}
        />
      </Demo>
    </div>
  );
}

export function AnalyticsPartsDemo() {
  const [range, setRange] = useState<TimeRange>("1m");
  const [profileId, setProfileId] = useState("all");

  return (
    <div className="flex flex-col gap-xl">
      <Demo label="Analytics toolbar">
        <AnalyticsToolbar
          range={range}
          onRangeChange={setRange}
          profiles={PROFILES.map((p) => ({ id: p.id, name: p.name }))}
          profileId={profileId}
          onProfileChange={setProfileId}
          onExport={() => {
            toast("Export CSV");
          }}
        />
      </Demo>
      <div className="grid gap-xl lg:grid-cols-2">
        <Demo label="By profile">
          <ByProfileList
            items={[
              {
                id: "c2",
                name: "Sarah Chen",
                avatarUrl: AVATAR(47),
                value: 5200,
                valueLabel: "5.2k",
              },
              {
                id: "c1",
                name: "Acme",
                kind: "company",
                avatarUrl: ACME_LOGO,
                value: 4100,
                valueLabel: "4.1k",
              },
              {
                id: "c3",
                name: "Ravi Patel",
                avatarUrl: AVATAR(12),
                value: 2300,
                valueLabel: "2.3k",
              },
              {
                id: "c4",
                name: "Mia Torres",
                avatarUrl: AVATAR(32),
                value: 800,
                valueLabel: "800",
              },
            ]}
            onOpen={(item) => {
              setProfileId(item.id);
            }}
          />
        </Demo>
        <Demo label="Top posts">
          <TopPosts
            items={[
              {
                id: "p3",
                title: "Hiring: senior designer",
                meta: "Ravi Patel, 28 Aug",
                thumbnail: ASSETS[1],
                metrics: [
                  { label: "Impr.", value: "4.1k" },
                  { label: "Eng.", value: "312" },
                  { label: "Rate", value: "7.6%" },
                ],
              },
              {
                id: "p6",
                title: "What we cut from onboarding",
                meta: "Sarah Chen, 21 Aug",
                thumbnail: ASSETS[0],
                metrics: [
                  { label: "Impr.", value: "3.4k" },
                  { label: "Eng.", value: "240" },
                  { label: "Rate", value: "7.0%" },
                ],
              },
              {
                id: "p7",
                title: "Customer story: Northwind",
                meta: "Acme, 14 Aug",
                metrics: [
                  { label: "Impr.", value: "2.9k" },
                  { label: "Eng.", value: "150" },
                  { label: "Rate", value: "5.1%" },
                ],
              },
            ]}
            onOpen={(post) => {
              toast(post.title);
            }}
            onViewAll={() => {
              toast("All posts");
            }}
          />
        </Demo>
      </div>
    </div>
  );
}

export function ComposedWorkspacePagesDemo() {
  return (
    <div className="flex flex-col gap-xl">
      <Demo label="Complete calendar page">
        <KitChatScope>
          <LayoutGroup id="kit-calendar-page">
            <div className="flex h-[720px] min-w-0 overflow-hidden border border-imagine-border bg-imagine-surface p-l">
              <CalendarPage postsByDay={KIT_POSTS_BY_DAY} today="2026-09-03" />
            </div>
          </LayoutGroup>
        </KitChatScope>
      </Demo>
      <Demo label="Complete analytics page">
        <KitChatScope>
          <LayoutGroup id="kit-analytics-page">
            <div className="h-[900px] min-w-0 overflow-y-auto border border-imagine-border bg-imagine-surface p-l">
              <AnalyticsPage data={KIT_ANALYTICS_DATA} />
            </div>
          </LayoutGroup>
        </KitChatScope>
      </Demo>
    </div>
  );
}

export function EditorDemo() {
  const [tabs, setTabs] = useState<EditorTab[]>([
    { id: "thread", label: "Current post" },
    { id: "f6", label: "sarah-persona.md", closable: true },
    { id: "f1", label: "brand-voice.md", closable: true },
  ]);
  const [activeTab, setActiveTab] = useState("f6");
  const [saved, setSaved] = useState(PERSONA_MD);
  const [value, setValue] = useState(PERSONA_MD);
  const dirty = value !== saved;

  return (
    <Demo label="Editor tab strip with the markdown editor open (dirty dot on the persona file)">
      <OnBackground className="p-s">
        <EditorTabStrip
          tabs={tabs.map((tab) => (tab.id === "f6" ? { ...tab, dirty } : tab))}
          activeId={activeTab}
          onActivate={setActiveTab}
          onClose={(id) => {
            setTabs((current) => current.filter((tab) => tab.id !== id));
            if (activeTab === id) setActiveTab("thread");
          }}
          className="w-full"
        >
          {activeTab === "f6" ? (
            <MarkdownEditor
              meta={{
                title: "sarah-persona.md",
              }}
              value={value}
              savedValue={saved}
              onValueChange={setValue}
              onSave={() => {
                setSaved(value);
                toast.success("Saved sarah-persona.md");
              }}
              className="p-l"
            />
          ) : (
            <p className="p-l type-small text-imagine-foreground-muted">
              {activeTab === "thread"
                ? "The agent thread lives here."
                : "brand-voice.md"}
            </p>
          )}
        </EditorTabStrip>
      </OnBackground>
    </Demo>
  );
}

export function ProfilesDemo() {
  const [selected, setSelected] = useState("c2");
  const detail = PROFILE_DETAILS[selected] ?? SARAH_DETAIL;

  return (
    <div className="grid gap-xl lg:grid-cols-[1.2fr_1fr_1fr]">
      <Demo label="Profile list">
        <ProfileList
          profiles={PROFILES}
          selectedId={selected}
          onSelect={setSelected}
          onAdd={() => {
            toast("Add profile");
          }}
        />
      </Demo>
      <Demo label="Profile detail (follows the list)">
        <ProfileDetail
          profile={detail}
          onReconnect={() => {
            toast("Reconnect LinkedIn");
          }}
          onChangeCompany={() => {
            toast("Change company");
          }}
          onLinkCompany={(url) => {
            toast(`Link ${url}`);
          }}
          onViewPersona={() => {
            toast("Open in Files");
          }}
          onIndexPosts={() => {
            toast("Indexing posts");
          }}
          onRemove={() => {
            toast.error("Remove profile");
          }}
        />
      </Demo>
      <Demo label="Profile detail, expired connection">
        <ProfileDetail
          profile={RAVI_DETAIL}
          onReconnect={() => {
            toast("Reconnect LinkedIn");
          }}
        />
      </Demo>
    </div>
  );
}

export function IntegrationsDemo() {
  return (
    <div className="grid gap-xl lg:grid-cols-2">
      <Demo label="Connected services">
        <IntegrationRows
          items={[
            {
              id: "hubspot",
              name: "HubSpot",
              description:
                "Contacts, deals, and stages sync into the agent's context.",
              icon: "hubspot",
              status: "connected",
              facts: ["Synced 2h ago", "1,204 contacts"],
            },
            {
              id: "slack",
              name: "Slack",
              description: "Approval requests and weekly recaps in #marketing.",
              icon: "slack",
              status: "expired",
              facts: ["Expired 3 days ago", "2 channels"],
            },
            {
              id: "linkedin",
              name: "LinkedIn",
              description: "Publishing and analytics for 5 profiles.",
              icon: "linkedin-in",
              status: "connected",
              facts: ["Synced 12m ago", "5 profiles"],
            },
          ]}
          onReconnect={(id) => {
            toast(`Reconnect ${id}`);
          }}
        />
      </Demo>
      <Demo label="Available to add">
        <IntegrationGrid
          items={[
            {
              id: "salesforce",
              name: "Salesforce",
              description: "Opportunities and accounts.",
              icon: "salesforce",
            },
            {
              id: "gcal",
              name: "Google Calendar",
              description: "Plan around launches and events.",
              icon: "calendar",
            },
            {
              id: "webhooks",
              name: "Webhooks",
              description: "Send post events anywhere.",
              icon: "plug",
            },
          ]}
          onAdd={(id) => {
            toast(`Add ${id}`);
          }}
          onBrowseAll={() => {
            toast("Browse all");
          }}
        />
      </Demo>
    </div>
  );
}

const SECRET_CHARS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

/** Demo-only, so rotating in the kit visibly issues a different key. */
function randomSecret(): string {
  let body = "";
  for (let i = 0; i < 30; i += 1) {
    body += SECRET_CHARS.charAt(
      Math.floor(Math.random() * SECRET_CHARS.length),
    );
  }
  return `imga_${body}`;
}

export function AccountDemo() {
  const [secret, setSecret] = useState<string | null>(
    "imga_T19lbhQC1UlsqK9AZ7mIVcxybsjbFSR",
  );

  return (
    <div className="max-w-2xl">
      <Demo label="API key">
        <ApiKeySection
          secret={secret}
          docsHref="#"
          onCreate={() => {
            setSecret(randomSecret());
            toast("Key created");
          }}
          onRotate={() => {
            setSecret(randomSecret());
            toast("Key rotated");
          }}
          onRevoke={() => {
            setSecret(null);
            toast.error("Key revoked");
          }}
        />
      </Demo>
    </div>
  );
}

export function OnboardingPartsDemo() {
  const [step, setStep] = useState(2);

  return (
    <div className="flex flex-col gap-xl">
      <div className="flex flex-wrap items-start gap-xl">
        <Demo label="Stepper" className="w-56">
          <Stepper steps={STEPS} current={step} onSelect={setStep} />
        </Demo>
        <Demo label="Step heading">
          <StepHeading title="Invite your team" step={step} total={3} />
        </Demo>
      </div>
      <div className="grid gap-xl lg:grid-cols-2">
        <Demo label="1. Sign in">
          <SignInForm
            onGoogle={() => {
              toast("Google");
            }}
            onX={() => {
              toast("X");
            }}
            onEmail={(email) => {
              toast(`Magic link sent to ${email}`);
            }}
          />
        </Demo>
        <Demo label="2. Set up organization">
          <OrganizationForm
            onContinue={(values) => {
              toast(`Organization: ${values.name}`);
            }}
          />
        </Demo>
        <Demo label="3. Invite team">
          <InviteTeamForm
            inviteUrl="https://imagine.ai/join/acme-7f3k"
            members={TEAM}
            onInvite={(invites) => {
              toast(`Invited ${String(invites.length)}`);
            }}
            onContinue={() => {
              toast("Continue");
            }}
            onResend={() => {
              toast("Invite resent");
            }}
            onSkip={() => {
              toast("Skipped");
            }}
          />
        </Demo>
        <Demo label="4. Connect LinkedIn">
          <ConnectLinkedIn
            accountName="Sarah Chen"
            accountNote="sarah@acme.com, admin"
            permissions={[
              "Publish posts you approve, on the schedule you set",
              "Read post analytics to plan what to write next",
            ]}
            onConnect={() => {
              toast.success("LinkedIn connected");
            }}
            onSkip={() => {
              toast("Skipped");
            }}
          />
        </Demo>
        <Demo label="Invite link landing, replaces 2 and 3">
          <JoinOrganization
            orgName="Acme"
            orgLogoUrl={ACME_LOGO}
            orgNote="12 members · 3 LinkedIn profiles"
            members={[
              { id: "m1", name: "Sarah Chen", avatarUrl: AVATAR(47) },
              { id: "m2", name: "Ravi Patel", avatarUrl: AVATAR(12) },
              { id: "m3", name: "Maya Okafor", avatarUrl: AVATAR(32) },
              { id: "m4", name: "Tom Lindqvist", avatarUrl: AVATAR(59) },
            ]}
            memberCount={12}
            invitedBy={{ id: "m1", name: "Sarah Chen", avatarUrl: AVATAR(47) }}
            onJoin={() => {
              toast.success("Joined Acme");
            }}
            onDecline={() => {
              toast("Not now");
            }}
          />
        </Demo>
      </div>
    </div>
  );
}
