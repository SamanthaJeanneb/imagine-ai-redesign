import { notFound } from "next/navigation";

import { Shimmer } from "@/components/motion/shimmer";
import { ThinkingIndicator } from "@/components/motion/thinking-indicator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Icon, ICON_NAMES } from "@/components/ui/icon";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { colors, type ColorToken } from "@/styles/tokens";

import {
  AvatarDemo,
  ChartDemo,
  FormDemo,
  OverlayDemo,
  SelectionDemo,
} from "./kit-demos";
import {
  AccountDemo,
  AnalyticsPartsDemo,
  AssetsDemo,
  CalendarGridDemo,
  CalendarToolbarDemo,
  ChartBlockDemo,
  ComposerDemo,
  EditorDemo,
  FilesPanelDemo,
  IntegrationsDemo,
  LoadingDemo,
  MessagesDemo,
  OnboardingPartsDemo,
  PostChipDemo,
  PostDraftDemo,
  ProfilesDemo,
  ScheduledGraphicDemo,
  SidebarDemo,
  StatTileDemo,
  TimelineDemo,
} from "./kit-features";

const COLOR_TOKENS = Object.keys(colors.light) as ColorToken[];

const SWATCH_CLASSES = {
  background: "bg-imagine-background",
  surface: "bg-imagine-surface",
  "surface-raised": "bg-imagine-surface-raised",
  border: "bg-imagine-border",
  foreground: "bg-imagine-foreground",
  "foreground-muted": "bg-imagine-foreground-muted",
  "foreground-faint": "bg-imagine-foreground-faint",
  primary: "bg-imagine-primary",
  "primary-foreground": "bg-imagine-primary-foreground",
  secondary: "bg-imagine-secondary",
  "secondary-soft": "bg-imagine-secondary-soft",
  "secondary-strong": "bg-imagine-secondary-strong",
  "secondary-foreground": "bg-imagine-secondary-foreground",
} as const satisfies Record<ColorToken, string>;

const THINKING_STATUSES = [
  "Reading your calendar",
  "Checking last week's numbers",
  "Drafting",
];

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-l">
      <h2 className="type-heading">{title}</h2>
      {children}
    </section>
  );
}

/** Design-system review. Development only. */
export default function KitPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <main className="flex flex-1 justify-center bg-imagine-background p-xl">
      <div className="flex w-full max-w-6xl flex-col gap-section rounded-surface bg-imagine-surface p-xxl">
        <header className="flex items-start justify-between gap-l">
          <div className="flex flex-col gap-xs">
            <h1 className="type-display">Design kit</h1>
            <p className="type-body text-imagine-foreground-muted">
              Tokens, type, icons, and primitives. Toggle the theme to check
              both modes.
            </p>
          </div>
          <ThemeToggle />
        </header>

        <Section title="Color">
          <div className="grid grid-cols-4 gap-m sm:grid-cols-7">
            {COLOR_TOKENS.map((token) => (
              <div key={token} className="flex flex-col gap-xs">
                <div
                  className={`${SWATCH_CLASSES[token]} h-14 rounded-control border border-imagine-border`}
                />
                <span className="type-micro text-imagine-foreground-muted">
                  {token}
                </span>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Type">
          <div className="flex flex-col gap-s">
            <p className="type-display">Display 28/34. LinkedIn, solved</p>
            <p className="type-title">Title 20/28. While you were away</p>
            <p className="type-heading">Heading 16/24. Next two weeks</p>
            <p className="type-body">
              Body 14/22. Our system drafts and schedules LinkedIn content for
              your entire team. You only need to review, approve, or edit.
            </p>
            <p className="type-small text-imagine-foreground-muted">
              Small 12/16. Scheduled for Tue, 3 Sep at 9:00
            </p>
            <p className="type-micro text-imagine-foreground-muted">
              Micro 11/14. Mon Tue Wed
            </p>
          </div>
        </Section>

        <Section title="Icons: Sharp Regular, Solid when active">
          <div className="flex flex-wrap gap-m">
            {ICON_NAMES.map((name) => (
              <div
                key={name}
                className="flex size-14 flex-col items-center justify-center gap-xs rounded-control bg-imagine-surface-raised text-imagine-foreground"
                title={name}
              >
                <Icon name={name} size="l" />
              </div>
            ))}
          </div>
          <div className="flex items-center gap-l">
            <Icon name="calendar" size="s" />
            <Icon name="calendar" size="m" />
            <Icon name="calendar" size="l" />
            <Icon name="calendar" size="xl" />
            <Icon name="calendar" size="xl" active />
            <Icon
              name="linkedin-in"
              size="xl"
              className="text-imagine-secondary"
            />
          </div>
        </Section>

        <Section title="Buttons">
          <div className="flex flex-wrap items-center gap-m">
            <Button>
              <Icon name="plus" data-icon="inline-start" />
              New post
            </Button>
            <Button variant="soft">Schedule</Button>
            <Button variant="ghost">Dismiss</Button>
            <Button variant="outline">Reconnect</Button>
            <Button variant="destructive">Remove</Button>
            <Button variant="link">View in Files</Button>
            <Button size="icon" variant="soft" aria-label="Expand">
              <Icon name="expand" />
            </Button>
            <Button disabled>
              <Spinner size="s" data-icon="inline-start" />
              Saving
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-m">
            <Button size="xs">Extra small</Button>
            <Button size="sm">Small</Button>
            <Button>Default</Button>
            <Button size="lg">Large</Button>
          </div>
        </Section>

        <Section title="Badges">
          <div className="flex flex-wrap items-center gap-s">
            <Badge>Published</Badge>
            <Badge variant="soft">Draft</Badge>
            <Badge variant="accent">Scheduled</Badge>
            <Badge variant="outline">Company</Badge>
            <Badge variant="success">Connected</Badge>
            <Badge variant="warning">Expiring</Badge>
            <Badge variant="destructive">Failed</Badge>
          </div>
        </Section>

        <Section title="Forms">
          <FormDemo />
        </Section>

        <Section title="Selection: one indicator that slides">
          <SelectionDemo />
        </Section>

        <Section title="Menus, overlays, toasts">
          <OverlayDemo />
        </Section>

        <Section title="Avatars">
          <AvatarDemo />
        </Section>

        <Section title="Sidebar">
          <SidebarDemo />
        </Section>

        <Section title="Files panel, file tree, skills">
          <FilesPanelDemo />
        </Section>

        <Section title="Composer">
          <ComposerDemo />
        </Section>

        <Section title="Timeline: while you were away">
          <TimelineDemo />
        </Section>

        <Section title="Messages">
          <MessagesDemo />
        </Section>

        <Section title="LinkedIn post draft">
          <PostDraftDemo />
        </Section>

        <Section title="Scheduled graphic">
          <ScheduledGraphicDemo />
        </Section>

        <Section title="Assets">
          <AssetsDemo />
        </Section>

        <Section title="Post chip">
          <PostChipDemo />
        </Section>

        <Section title="Calendar grid">
          <CalendarGridDemo />
        </Section>

        <Section title="Calendar toolbar, up next">
          <CalendarToolbarDemo />
        </Section>

        <Section title="Editor tab strip, markdown editor">
          <EditorDemo />
        </Section>

        <Section title="Profiles">
          <ProfilesDemo />
        </Section>

        <Section title="Integrations">
          <IntegrationsDemo />
        </Section>

        <Section title="API keys, usage">
          <AccountDemo />
        </Section>

        <Section title="Onboarding parts">
          <OnboardingPartsDemo />
        </Section>

        <Section title="Loading">
          <LoadingDemo />
          <div className="grid gap-l sm:grid-cols-2">
            <div className="flex flex-col gap-s">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-24 w-full rounded-panel" />
            </div>
            <div className="flex flex-col gap-l">
              <ThinkingIndicator statuses={THINKING_STATUSES} />
              <p className="type-small">
                <Shimmer>Streaming a reply</Shimmer>
              </p>
              <div className="flex items-center gap-m text-imagine-foreground-muted">
                <Spinner size="s" />
                <Spinner />
                <Spinner size="l" />
              </div>
            </div>
          </div>
        </Section>

        <Section title="Charts">
          <ChartDemo />
        </Section>

        <Section title="Stat tiles">
          <StatTileDemo />
        </Section>

        <Section title="Chart block">
          <ChartBlockDemo />
        </Section>

        <Section title="Analytics toolbar, by profile, top posts">
          <AnalyticsPartsDemo />
        </Section>
      </div>
    </main>
  );
}
