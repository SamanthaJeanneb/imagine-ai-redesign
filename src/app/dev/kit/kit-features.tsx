"use client";

import { cn } from "cn";
import { useState } from "react";
import { toast } from "sonner";

import {
  AgentMessage,
  type MessagePart,
  UserMessage,
} from "@/components/features/agent/agent-message";
import {
  Composer,
  type ComposerPreview,
} from "@/components/features/agent/composer";
import { AssetPicker } from "@/components/features/agent/asset-picker";
import { LinkedInPostDraft } from "@/components/features/agent/linkedin-post-draft";
import { PostContext } from "@/components/features/agent/post-context";
import { PreviewSurface } from "@/components/features/agent/preview-surface";
import { ScheduledGraphic } from "@/components/features/agent/scheduled-graphic";
import {
  Timeline,
  type TimelineEntry,
} from "@/components/features/agent/timeline";
import {
  type AnalyticsRange,
  AnalyticsToolbar,
} from "@/components/features/analytics/analytics-toolbar";
import { ByProfileList } from "@/components/features/analytics/by-profile-list";
import {
  ChartBlock,
  type ChartDatum,
} from "@/components/features/analytics/chart-block";
import { StatGroup, StatTile } from "@/components/features/analytics/stat-tile";
import { TopPosts } from "@/components/features/analytics/top-posts";
import {
  type CalendarDay,
  CalendarGrid,
} from "@/components/features/calendar/calendar-grid";
import {
  CalendarToolbar,
  type CalendarView,
} from "@/components/features/calendar/calendar-toolbar";
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
import {
  type FileSection,
  FileTree,
} from "@/components/features/files/file-tree";
import { MarkdownEditor } from "@/components/features/files/markdown-editor";
import {
  type Skill,
  SkillsList,
} from "@/components/features/files/skills-list";
import { BrandPanel } from "@/components/features/onboarding/brand-panel";
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
import { ApiKeyList } from "@/components/features/settings/api-keys";
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
import { UsageMeter } from "@/components/features/settings/usage-meter";
import { FilesPanel } from "@/components/layout/files-panel";
import { Sidebar, type SidebarNavKey } from "@/components/layout/sidebar";
import { LogoLoader } from "@/components/motion/logo-loader";
import { Button } from "@/components/ui/button";

/* Mock data. Phase 2 replaces these with selectors over src/mocks/db.json. */

const AVATAR = (n: number) => `https://i.pravatar.cc/96?img=${String(n)}`;
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
    kind: "Needs a decision",
    when: "Yesterday",
    title: "Ravi Patel's LinkedIn connection expired",
    excerpt:
      "Two scheduled posts will not publish until the profile is reconnected.",
    actions: [
      { intent: "reconnect", label: "Reconnect", primary: true },
      { intent: "later", label: "Later" },
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

const IMPRESSIONS_SERIES = { key: "impressions", label: "Impressions" };
const SERIES = [
  IMPRESSIONS_SERIES,
  { key: "engagements", label: "Engagements" },
  { key: "followers", label: "Followers" },
];

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
const AUTHOR_ACME = { name: "Acme", headline: "Company page" };

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

const PROFILES: ProfileSummary[] = [
  {
    id: "c1",
    name: "Acme",
    headline: "Company page",
    kind: "company",
    status: "connected",
    avatarUrl: undefined,
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

const SARAH_DETAIL: ProfileDetailData = {
  id: "c2",
  name: "Sarah Chen",
  headline: "CEO at Acme",
  kind: "person",
  status: "connected",
  avatarUrl: AVATAR(47),
  postsIndexed: 128,
  company: { name: "Acme", url: "linkedin.com/company/acme" },
  persona: { fileName: "sarah-persona.md", updated: "Updated yesterday" },
};

const RAVI_DETAIL: ProfileDetailData = {
  id: "c3",
  name: "Ravi Patel",
  headline: "Head of Growth",
  kind: "person",
  status: "expired",
  statusNote: "Two scheduled posts are waiting on this.",
  avatarUrl: AVATAR(12),
  postsIndexed: 64,
  company: { name: "Acme", url: "linkedin.com/company/acme" },
  persona: { fileName: "ravi-persona.md", updated: "Updated 2 weeks ago" },
};

const PROFILE_DETAILS: Record<string, ProfileDetailData> = {
  c1: {
    id: "c1",
    name: "Acme",
    headline: "Company page",
    kind: "company",
    status: "connected",
    postsIndexed: 212,
    persona: { fileName: "acme-voice.md", updated: "Updated 3 days ago" },
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
    postsIndexed: 41,
  },
  c5: {
    id: "c5",
    name: "Jonas Weber",
    headline: "Engineering",
    kind: "person",
    status: "disconnected",
    avatarUrl: AVATAR(59),
    postsIndexed: 0,
  },
};

const FILE_SECTIONS: FileSection[] = [
  {
    id: "org",
    title: "Acme",
    kind: "organization",
    nodes: [
      { type: "file", id: "f1", name: "brand-voice.md" },
      { type: "file", id: "f2", name: "content-pillars.md" },
      { type: "file", id: "f3", name: "audience.md" },
      {
        type: "folder",
        id: "fo1",
        name: "Campaigns",
        children: [
          { type: "file", id: "f4", name: "q3-launch.md" },
          { type: "file", id: "f5", name: "hiring-push.md" },
        ],
      },
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
  },
  {
    id: "s2",
    name: "Repurpose top posts",
    description: "Turns last month's best post into a new angle.",
    enabled: true,
  },
  {
    id: "s3",
    name: "Comment suggestions",
    description: "Finds posts from targeted accounts worth replying to.",
    enabled: false,
  },
  {
    id: "s4",
    name: "Weekly recap",
    description: "Summarizes reach and follows every Monday.",
    enabled: true,
  },
];

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

/** A labeled slot inside a kit section. */
export function Demo({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-s", className)}>
      <span className="type-small text-imagine-foreground-faint">{label}</span>
      {children}
    </div>
  );
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
 */
function PageStub({ side = "right" }: { side?: "left" | "right" }) {
  return (
    <div
      className={cn(
        "min-w-28 flex-1 bg-imagine-surface shadow-raised",
        side === "right" ? "rounded-l-surface" : "rounded-r-surface",
      )}
    />
  );
}

const SIDEBAR_USER = {
  name: "Sarah Chen",
  avatarUrl: AVATAR(47),
  note: "Growth plan",
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
        <LogoLoader width={72} />
      </Demo>
    </div>
  );
}

export function SidebarDemo() {
  const [active, setActive] = useState<SidebarNavKey>("agent");

  return (
    <div className="flex flex-wrap gap-xl">
      <Demo label="Expanded">
        <OnBackground className="h-[520px] rounded-r-none">
          <Sidebar
            orgName="Acme"
            active={active}
            threads={THREADS}
            activeThreadId="t1"
            user={SIDEBAR_USER}
            onNavigate={setActive}
            onNewPost={() => {
              toast("New post");
            }}
            onOpenThread={(id) => {
              toast(`Open thread ${id}`);
            }}
            onOpenUser={() => {
              toast("Account");
            }}
          />
          <PageStub />
        </OnBackground>
      </Demo>
      <Demo label="Collapsed">
        <OnBackground className="h-[520px] rounded-r-none">
          <Sidebar
            orgName="Acme"
            active={active}
            collapsed
            threads={THREADS}
            activeThreadId="t1"
            user={SIDEBAR_USER}
            onNavigate={setActive}
          />
          <PageStub />
        </OnBackground>
      </Demo>
    </div>
  );
}

export function FilesPanelDemo() {
  const [activeFile, setActiveFile] = useState<string | undefined>("f6");
  const [skills, setSkills] = useState(SKILLS);

  return (
    <div className="flex flex-wrap gap-xl">
      <Demo label="Files panel">
        <OnBackground className="h-[520px] rounded-l-none">
          <PageStub side="left" />
          <FilesPanel
            title="Acme"
            sections={FILE_SECTIONS}
            skills={skills}
            storageLabel="2.1 GB of 10 GB"
            activeFileId={activeFile}
            onOpenFile={setActiveFile}
            onEditFile={(id) => {
              toast(`Edit ${id}`);
            }}
            onOpenAsset={(asset) => {
              toast(asset.caption ?? asset.id);
            }}
            onClose={() => {
              toast("Close panel");
            }}
            onManage={() => {
              toast("Manage storage");
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
      <Demo label="Skills list" className="w-80">
        <SkillsList
          skills={skills}
          onToggle={(id, enabled) => {
            setSkills((current) =>
              current.map((skill) =>
                skill.id === id ? { ...skill, enabled } : skill,
              ),
            );
          }}
        />
      </Demo>
    </div>
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
      <Demo label="Stat group, four across">
        <StatGroup>
          <StatTile
            value="12.4k"
            label="Impressions"
            delta={{ label: "+12%", direction: "up" }}
          />
          <StatTile
            value="1,208"
            label="Engagements"
            delta={{ label: "+4%", direction: "up" }}
          />
          <StatTile
            value="4.2%"
            label="Engagement rate"
            delta={{ label: "-0.3", direction: "down" }}
          />
          <StatTile
            value="318"
            label="New followers"
            delta={{ label: "+41", direction: "up" }}
          />
        </StatGroup>
      </Demo>
    </div>
  );
}

export function ChartBlockDemo() {
  return (
    <div className="grid gap-xl lg:grid-cols-2">
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
      <Demo label="Bar with title">
        <ChartBlock
          kind="bar"
          data={BY_TYPE}
          series={[{ key: "posts", label: "Posts" }]}
          title="By post type"
        />
      </Demo>
      <Demo label="Area, three series, legend toggles">
        <ChartBlock
          kind="area"
          data={IMPRESSIONS}
          series={SERIES}
          title="Impressions over time"
          description="Last 7 days"
          legend
        />
      </Demo>
      <Demo label="Horizontal bar">
        <ChartBlock
          kind="hbar"
          data={BY_TYPE}
          series={[{ key: "posts", label: "Posts" }]}
          title="Posts by type"
        />
      </Demo>
    </div>
  );
}

export function PostChipDemo() {
  return (
    <div className="flex flex-wrap gap-xl">
      <p className="w-full type-small text-imagine-foreground-muted">
        Hover any chip to preview the post as it will appear on LinkedIn.
      </p>
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
          author={{ name: "Acme", headline: "Company page" }}
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
  const [range, setRange] = useState<AnalyticsRange>("30d");
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
              { id: "c1", name: "Acme", value: 4100, valueLabel: "4.1k" },
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
                edited: "Edited by Sarah Chen, yesterday",
                editorName: "Sarah Chen",
                editorAvatarUrl: AVATAR(47),
              }}
              value={value}
              savedValue={saved}
              onValueChange={setValue}
              onSave={() => {
                setSaved(value);
                toast.success("Saved sarah-persona.md");
              }}
              onRevert={() => {
                setValue(saved);
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

export function AccountDemo() {
  return (
    <div className="grid gap-xl lg:grid-cols-2">
      <Demo label="API keys">
        <ApiKeyList
          keys={[
            {
              id: "k1",
              name: "Zapier",
              prefix: "sk_live_4f2a",
              lastUsed: "Used 3h ago",
              created: "12 Aug",
            },
            {
              id: "k2",
              name: "Internal dashboard",
              prefix: "sk_live_9c1e",
              lastUsed: "Never used",
              created: "2 Sep",
            },
          ]}
          onCreate={() => {
            toast("New key");
          }}
          onRevoke={(id) => {
            toast.error(`Revoked ${id}`);
          }}
        />
      </Demo>
      <Demo label="Usage meter">
        <UsageMeter
          planName="Growth plan"
          renewal="Renews 1 Oct"
          lines={[
            {
              id: "posts",
              label: "Posts this month",
              used: 42,
              limit: 100,
              format: (u, l) => `${String(u)} of ${String(l)}`,
            },
            {
              id: "profiles",
              label: "Profiles",
              used: 5,
              limit: 5,
              format: (u, l) => `${String(u)} of ${String(l)}`,
            },
            {
              id: "storage",
              label: "Storage",
              used: 2.1,
              limit: 10,
              format: (u, l) => `${String(u)} GB of ${String(l)} GB`,
            },
          ]}
          onManagePlan={() => {
            toast("Manage plan");
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
        <Demo label="Brand panel" className="w-72">
          <BrandPanel className="h-48" />
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
              "Never send messages or connection requests",
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
