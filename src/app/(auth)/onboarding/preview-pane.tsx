"use client";

import { cn } from "cn";
import { AnimatePresence, motion } from "motion/react";
import { usePathname } from "next/navigation";

import { useOnboarding } from "@/app/(auth)/onboarding/onboarding-provider";
import type { ProfileSummary } from "@/components/features/settings/profile-list";
import { SIDEBAR_NAV, type SidebarThread } from "@/components/layout/sidebar";
import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarImage,
} from "@/components/ui/avatar";
import { Icon } from "@/components/ui/icon";
import { fade, spring } from "@/styles/motion";

type Focus = "organization" | "team" | "linkedin";

function focusFor(pathname: string): Focus {
  if (pathname.endsWith("/team")) return "team";
  if (pathname.endsWith("/linkedin")) return "linkedin";
  return "organization";
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

/** How many faces the header shows before it counts the rest, as the app does. */
const FACES = 3;

/** Skeleton chat titles, as a share of the row, so the list reads as a list. */
const CHAT_WIDTHS = [78, 62, 84, 56, 70, 48] as const;

/** What the header says after "Posting as", the app's wording. */
function postingAs(selected: readonly ProfileSummary[]): string {
  if (selected.length === 0) return "no one";
  if (selected.length === 1) return selected[0]?.name ?? "";
  return `${String(selected.length)} profiles`;
}

/** A soft accent ring that slides to whichever part the current step fills in. */
function FocusRing({ id, active }: { id: string; active: boolean }) {
  return active ? (
    <motion.span
      layoutId={id}
      aria-hidden="true"
      transition={spring.snappy}
      className="pointer-events-none absolute -inset-xs rounded-panel ring-2 ring-imagine-secondary/60"
    />
  ) : null;
}

/** A sidebar row at the app's height, icon well then label. */
function RailRow({
  icon,
  label,
  selected = false,
  className,
}: {
  icon: React.ReactNode;
  label: React.ReactNode;
  selected?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "flex h-8 items-center gap-xs rounded-control pr-s pl-xs type-small",
        selected
          ? "bg-imagine-foreground/8 font-semibold text-imagine-foreground"
          : "font-medium text-imagine-foreground-muted",
        className,
      )}
    >
      <span className="flex size-6 shrink-0 items-center justify-center">
        {icon}
      </span>
      <span className="truncate">{label}</span>
    </span>
  );
}

/**
 * The workspace as it will open: the rail from `Sidebar` (organization, New
 * chat, the nav, recent chats, Help center) beside the page with its header
 * row (who the agent is posting as, the account) and the centered landing.
 * The name, logo, and posting identities fill in as each step sets them; the
 * ring moves to the part the current step is about.
 */
function WorkspaceMock({
  orgName,
  orgLogoUrl,
  postAs,
  linkedInConnected,
  threads,
  owner,
  focus,
  className,
}: {
  orgName: string;
  orgLogoUrl: string | undefined;
  postAs: readonly ProfileSummary[];
  linkedInConnected: boolean;
  threads: readonly SidebarThread[];
  owner: { name: string; avatarUrl?: string };
  focus: Focus;
  className?: string;
}) {
  const named = orgName.trim() !== "";
  const ringId = "onboarding-focus";

  return (
    <div
      data-slot="workspace-mock"
      aria-hidden="true"
      className={cn(
        "flex min-h-0 overflow-hidden rounded-t-surface bg-imagine-background shadow-floating",
        className,
      )}
    >
      {/* Rail */}
      <div className="flex w-56 shrink-0 flex-col px-s py-m">
        <div className="flex flex-col gap-m">
          <div className="relative flex h-8 items-center gap-s px-xs">
            <FocusRing id={ringId} active={focus === "organization"} />
            {orgLogoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={orgLogoUrl}
                alt=""
                className="size-6 shrink-0 rounded-control object-cover shadow-control"
              />
            ) : (
              <span
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-control",
                  named
                    ? "bg-imagine-foreground text-imagine-surface"
                    : "bg-imagine-border text-imagine-foreground-faint",
                )}
              >
                {named ? (
                  <span className="text-[10px] font-semibold">
                    {initials(orgName)}
                  </span>
                ) : (
                  <Icon name="imagine" size="s" />
                )}
              </span>
            )}
            <AnimatePresence mode="wait" initial={false}>
              {named ? (
                <motion.span
                  key="name"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={fade.fast}
                  className="flex min-w-0 flex-1 items-center gap-xs"
                >
                  <span className="truncate type-small font-semibold">
                    {orgName}
                  </span>
                  <Icon
                    name="chevron-down"
                    size="s"
                    className="text-imagine-foreground-faint"
                  />
                </motion.span>
              ) : (
                <motion.span
                  key="placeholder"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={fade.fast}
                  className="h-2.5 w-20 rounded-full bg-imagine-border"
                />
              )}
            </AnimatePresence>
            <Icon
              name="chevron-left"
              size="s"
              className="ml-auto text-imagine-foreground-faint"
            />
          </div>

          <RailRow
            icon={<Icon name="pen-to-square" size="s" />}
            label="New chat"
          />
        </div>

        <div className="mt-l flex flex-col gap-px">
          {SIDEBAR_NAV.map((item, index) => (
            <RailRow
              key={item.key}
              icon={<Icon name={item.icon} size="s" />}
              label={item.label}
              selected={index === 0}
            />
          ))}
        </div>

        <div className="mt-l flex min-h-0 flex-1 flex-col">
          <span className="flex h-7 shrink-0 items-center px-xs type-micro font-medium text-imagine-foreground-muted">
            Chats
          </span>
          <ul className="flex min-h-0 flex-col overflow-hidden">
            {threads.map((thread, index) => (
              <li
                key={thread.id}
                className="flex h-7 items-center gap-xs rounded-control pr-s pl-xs"
              >
                <span className="flex size-6 shrink-0 items-center justify-center">
                  <span
                    className={cn(
                      "size-1.5 rounded-full",
                      thread.unread
                        ? "bg-imagine-secondary"
                        : "border border-imagine-foreground-faint/70",
                    )}
                  />
                </span>
                {/* A line the length of a title, longer and shorter by turns. */}
                <span
                  className="h-2 rounded-full bg-imagine-border"
                  style={{
                    width: `${String(CHAT_WIDTHS[index % CHAT_WIDTHS.length])}%`,
                  }}
                />
              </li>
            ))}
          </ul>
        </div>

        <span className="-mx-s mt-s mb-s h-px shrink-0 bg-imagine-foreground/12" />
        <RailRow
          icon={<Icon name="circle-info" size="s" />}
          label={
            <span className="flex items-center gap-xs">
              Help center
              <Icon
                name="chevron-up"
                size="s"
                className="text-imagine-foreground-faint"
              />
            </span>
          }
        />
      </div>

      {/* Page. The surface rounds into the rail, as the app's does. */}
      <div className="flex min-w-0 flex-1 flex-col rounded-l-surface bg-imagine-surface">
        {/* Header row: Posting as … at left, the account at right. */}
        <div className="relative mx-xxl mt-m mb-m flex h-8 shrink-0 items-center gap-s after:absolute after:inset-x-0 after:-bottom-m after:border-b after:border-imagine-border">
          <div className="relative -ml-1.5 flex h-7 items-center rounded-control pr-s pl-1.5">
            <FocusRing id={ringId} active={focus === "linkedin"} />
            {linkedInConnected && postAs.length > 0 ? (
              <AvatarGroup className="-space-x-1.5 *:data-[slot=avatar]:ring-imagine-surface">
                {postAs.slice(0, FACES).map((profile) => (
                  <Avatar
                    key={profile.id}
                    size="sm"
                    shape={profile.kind === "company" ? "square" : "circle"}
                  >
                    {profile.avatarUrl ? (
                      <AvatarImage src={profile.avatarUrl} alt="" />
                    ) : null}
                    <AvatarFallback>
                      {profile.kind === "company" ? (
                        <Icon name="building" size="s" />
                      ) : (
                        initials(profile.name)
                      )}
                    </AvatarFallback>
                  </Avatar>
                ))}
              </AvatarGroup>
            ) : (
              <span className="flex size-6 items-center justify-center rounded-full border border-dashed border-imagine-foreground-faint text-imagine-foreground-muted">
                <Icon name="user" size="s" />
              </span>
            )}
            <span className="ml-s flex items-baseline gap-xs text-sm whitespace-nowrap">
              <span className="text-imagine-foreground-muted">Posting as</span>
              <span className="font-medium">
                {linkedInConnected ? postingAs(postAs) : "no one"}
              </span>
            </span>
            <Icon
              name="chevron-down"
              size="s"
              className="ml-s text-imagine-foreground-faint"
            />
          </div>
          <div className="relative ml-auto flex items-center gap-m">
            <FocusRing id={ringId} active={focus === "team"} />
            <Icon
              name="gear"
              size="s"
              className="text-imagine-foreground-faint"
            />
            <Avatar size="sm">
              {owner.avatarUrl ? (
                <AvatarImage src={owner.avatarUrl} alt="" />
              ) : null}
              <AvatarFallback>{initials(owner.name)}</AvatarFallback>
            </Avatar>
          </div>
        </div>

        {/* The page, as blocks: a greeting, the composer, three cards for
            what needs the user, and the calendar below. */}
        <div className="flex min-h-0 flex-1 flex-col gap-l px-xxl pt-xl">
          <div className="flex flex-col gap-s">
            <span className="h-2.5 w-36 rounded-full bg-imagine-surface-raised" />
            <span className="h-2 w-52 rounded-full bg-imagine-surface-raised" />
          </div>
          <span className="h-20 rounded-panel bg-imagine-surface-raised" />
          <div className="grid grid-cols-3 gap-l">
            <span className="h-16 rounded-panel bg-imagine-surface-raised" />
            <span className="h-16 rounded-panel bg-imagine-surface-raised" />
            <span className="h-16 rounded-panel bg-imagine-surface-raised" />
          </div>
          <span className="min-h-48 flex-1 rounded-panel bg-imagine-surface-raised" />
        </div>
      </div>
    </div>
  );
}

interface PreviewPaneProps {
  /** Recent chats, for the rail. */
  threads: readonly SidebarThread[];
  /** The person setting up, for the account at the header's right. */
  owner: { name: string; avatarUrl?: string };
}

/**
 * The right half of the split. Sticks to the viewport while a long step
 * scrolls beside it. On a laptop the mock runs off the right and bottom
 * edges like a window behind the form. On a wide monitor it would stretch
 * into a tall empty slab, so there it stops at a desktop's worth of width
 * and height, rounds all four corners, and floats centered in the pane.
 */
export function PreviewPane({ threads, owner }: PreviewPaneProps) {
  const pathname = usePathname();
  const { orgName, orgLogoUrl, postAs, linkedInConnected } = useOnboarding();

  return (
    <aside
      aria-label="Workspace preview"
      className="hidden min-w-0 flex-col overflow-hidden bg-imagine-secondary-soft pt-section pl-xxl lg:sticky lg:top-0 lg:flex lg:h-svh lg:rounded-l-surface xl:pl-xxxl 2xl:items-center 2xl:justify-center 2xl:px-section 2xl:py-section"
    >
      <div className="flex min-h-0 w-full max-w-5xl flex-1 flex-col 2xl:max-h-[60rem] 2xl:max-w-[80rem]">
        <WorkspaceMock
          orgName={orgName}
          orgLogoUrl={orgLogoUrl}
          postAs={postAs}
          linkedInConnected={linkedInConnected}
          threads={threads}
          owner={owner}
          focus={focusFor(pathname)}
          className="min-h-0 flex-1 2xl:rounded-surface"
        />
      </div>
    </aside>
  );
}
