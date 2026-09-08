import Link from "next/link";

import { Shimmer } from "@/components/motion/shimmer";
import { ThinkingIndicator } from "@/components/motion/thinking-indicator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Icon, ICON_NAMES } from "@/components/ui/icon";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import {
  colors,
  control,
  radius,
  radiusSharp,
  spacing,
  typeScale,
  type ColorToken,
  type ControlToken,
  type RadiusToken,
  type SpacingToken,
  type TypeToken,
} from "@/styles/tokens";

import { AvatarDemo, FormDemo, OverlayDemo, SelectionDemo } from "./kit-demos";
import {
  AccountDemo,
  AnalyticsPartsDemo,
  AssetsDemo,
  CalendarGridDemo,
  CalendarTimeGridDemo,
  CalendarToolbarDemo,
  ChartCardDemo,
  ChartBlockDemo,
  ChatChromeDemo,
  ComposedWorkspacePagesDemo,
  ComposerDemo,
  EditorDemo,
  FilesPanelDemo,
  FilesWorkspacePageDemo,
  IntegrationsDemo,
  LoadingDemo,
  MessagesDemo,
  OnboardingPartsDemo,
  PostChipDemo,
  PostDraftDemo,
  ProfileSelectorDemo,
  ResourceContextDemo,
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
  destructive: "bg-destructive",
  warning: "bg-warning",
  success: "bg-success",
} as const satisfies Record<ColorToken, string>;

const RADIUS_SWATCH = {
  control: "rounded-control",
  panel: "rounded-panel",
  surface: "rounded-surface",
} as const satisfies Record<RadiusToken, string>;

const SPACING_SWATCH = {
  xxs: "size-xxs",
  xs: "size-xs",
  s: "size-s",
  m: "size-m",
  l: "size-l",
  xl: "size-xl",
  xxl: "size-xxl",
  xxxl: "size-xxxl",
  section: "size-section",
} as const satisfies Record<SpacingToken, string>;

const CONTROL_SWATCH = {
  xs: "h-control-xs",
  sm: "h-control-sm",
  base: "h-control-base",
  lg: "h-control-lg",
} as const satisfies Record<ControlToken, string>;

/** Sizes come from the tokens, so the specimen can never drift from the scale. */
const TYPE_SPECIMENS: readonly {
  token: TypeToken;
  className: string;
  sample: string;
}[] = [
  { token: "display", className: "type-display", sample: "LinkedIn, solved" },
  { token: "title", className: "type-title", sample: "While you were away" },
  { token: "heading", className: "type-heading", sample: "Next two weeks" },
  {
    token: "body",
    className: "type-body",
    sample:
      "Our system drafts and schedules LinkedIn content for your entire team. You only need to review, approve, or edit.",
  },
  {
    token: "small",
    className: "type-small text-imagine-foreground-muted",
    sample: "Scheduled for Tue, 3 Sep at 9:00",
  },
  {
    token: "micro",
    className: "type-micro text-imagine-foreground-muted",
    sample: "Mon Tue Wed",
  },
];

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

interface KitProps {
  /** `sharp` halves every radius token (2 / 4 / 8 instead of 6 / 12 / 20). */
  radiusScale?: "default" | "sharp";
}

/**
 * The design-system review. Same components on both `/dev/kit` and
 * `/dev/kit-sharp`; only the radius tokens change.
 */
export function Kit({ radiusScale = "default" }: KitProps) {
  const sharp = radiusScale === "sharp";
  const scale = sharp ? radiusSharp : radius;

  return (
    <main className="flex flex-1 justify-center bg-imagine-background p-xl">
      <div className="flex w-full max-w-6xl flex-col gap-section rounded-surface bg-imagine-surface p-xxl">
        <header className="flex items-start justify-between gap-l">
          <div className="flex flex-col gap-xs">
            <h1 className="type-display">
              {sharp ? "Design kit, sharp" : "Design kit"}
            </h1>
            <p className="type-body text-imagine-foreground-muted">
              {sharp
                ? "The same components with a tighter radius: 2 / 4 / 8 instead of 6 / 12 / 20."
                : "Tokens, type, icons, and primitives. Toggle the theme to check both modes."}
            </p>
            <Link
              href={sharp ? "/dev/kit" : "/dev/kit-sharp"}
              className="type-small text-imagine-foreground-muted underline-offset-4 hover:text-imagine-foreground hover:underline"
            >
              {sharp ? "View default radius" : "View sharp radius"}
            </Link>
          </div>
          <ThemeToggle />
        </header>

        <Section title="Radius">
          <div className="flex flex-wrap gap-l">
            {(Object.keys(scale) as RadiusToken[]).map((token) => (
              <div key={token} className="flex flex-col gap-xs">
                <div
                  className={`${RADIUS_SWATCH[token]} size-16 bg-imagine-surface-raised shadow-control`}
                />
                <span className="type-micro text-imagine-foreground-muted">
                  {token} {scale[token]}
                </span>
              </div>
            ))}
          </div>
        </Section>

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
            {TYPE_SPECIMENS.map(({ token, className, sample }) => (
              <p key={token} className={className}>
                {`${token} ${String(typeScale[token].size)}/${String(typeScale[token].lineHeight)}. ${sample}`}
              </p>
            ))}
          </div>
        </Section>

        <Section title="Spacing">
          <div className="flex flex-wrap items-end gap-l">
            {(Object.keys(spacing) as SpacingToken[]).map((token) => (
              <div key={token} className="flex flex-col gap-xs">
                <div
                  className={`${SPACING_SWATCH[token]} bg-imagine-secondary`}
                />
                <span className="type-micro text-imagine-foreground-muted">
                  {token} {spacing[token]}
                </span>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Control heights: every button, input, and tab strip">
          <div className="flex flex-wrap items-end gap-l">
            {(Object.keys(control) as ControlToken[]).map((token) => (
              <div key={token} className="flex flex-col gap-xs">
                <div
                  className={`${CONTROL_SWATCH[token]} w-24 rounded-control bg-imagine-surface-raised shadow-control`}
                />
                <span className="type-micro text-imagine-foreground-muted">
                  {token} {control[token]}
                </span>
              </div>
            ))}
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

        <Section title="Chat title, controls, column, and context panel">
          <ChatChromeDemo />
        </Section>

        <Section title="Files panel, file tree, skills">
          <FilesPanelDemo />
        </Section>

        <Section title="Complete Files workspace">
          <FilesWorkspacePageDemo />
        </Section>

        <Section title="File and asset chat context">
          <ResourceContextDemo />
        </Section>

        <Section title="Composer">
          <ComposerDemo />
        </Section>

        <Section title="Profile selector: who the agent posts as">
          <ProfileSelectorDemo />
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

        <Section title="Calendar day and week time grids">
          <CalendarTimeGridDemo />
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

        <Section title="API key">
          <AccountDemo />
        </Section>

        <Section title="Onboarding">
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
            </div>
          </div>
        </Section>

        <Section title="Stat tiles">
          <StatTileDemo />
        </Section>

        <Section title="Charts">
          <ChartBlockDemo />
        </Section>

        <Section title="Chart cards">
          <ChartCardDemo />
        </Section>

        <Section title="Analytics toolbar, by profile, top posts">
          <AnalyticsPartsDemo />
        </Section>

        <Section title="Composed workspace pages">
          <ComposedWorkspacePagesDemo />
        </Section>
      </div>
    </main>
  );
}
