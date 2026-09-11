"use client";

import { cn } from "cn";
import { AnimatePresence, motion } from "motion/react";
import { usePathname } from "next/navigation";

import { useOnboarding } from "@/app/(auth)/onboarding/onboarding-provider";
import { SIDEBAR_NAV } from "@/components/layout/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BrandMark } from "@/components/ui/brand-mark";
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

/**
 * The workspace, sketched: the sidebar with the organization the user is
 * naming, the nav they will see, and the page as grey blocks. Name and logo
 * fill in as they type; the ring moves to the part each step sets up.
 */
function WorkspaceMock({
  orgName,
  orgLogoUrl,
  focus,
  className,
}: {
  orgName: string;
  orgLogoUrl: string | undefined;
  focus: Focus;
  className?: string;
}) {
  const named = orgName.trim() !== "";
  const ringId = "onboarding-2-focus";

  return (
    <div
      data-slot="workspace-mock"
      aria-hidden="true"
      className={cn(
        "flex min-h-0 overflow-hidden rounded-t-surface bg-imagine-surface shadow-floating",
        className,
      )}
    >
      {/* Sidebar */}
      <div className="flex w-48 shrink-0 flex-col gap-l bg-imagine-surface-raised p-m">
        <div className="relative flex items-center gap-s">
          <FocusRing id={ringId} active={focus === "organization"} />
          <Avatar size="sm" shape="square">
            {orgLogoUrl ? <AvatarImage src={orgLogoUrl} alt="" /> : null}
            <AvatarFallback
              className={cn(
                !named && !orgLogoUrl && "bg-imagine-border text-transparent",
              )}
            >
              {named ? (
                initials(orgName)
              ) : (
                <BrandMark
                  name="imagine"
                  className="size-3 text-imagine-foreground-faint"
                />
              )}
            </AvatarFallback>
          </Avatar>
          <AnimatePresence mode="wait" initial={false}>
            {named ? (
              <motion.span
                key="name"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={fade.fast}
                className="truncate type-small font-semibold"
              >
                {orgName}
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
        </div>

        <span className="flex h-control-sm items-center justify-center rounded-control bg-imagine-primary type-small font-semibold text-imagine-primary-foreground shadow-control">
          New post
        </span>

        <ul className="flex flex-col gap-xxs">
          {SIDEBAR_NAV.map((item, index) => (
            <li
              key={item.key}
              className={cn(
                "flex items-center gap-s rounded-control px-s py-xs type-small",
                index === 0
                  ? "bg-imagine-foreground/6 text-imagine-foreground"
                  : "text-imagine-foreground-muted",
              )}
            >
              <Icon name={item.icon} size="s" />
              {item.label}
            </li>
          ))}
        </ul>

        <div className="relative mt-auto flex items-center gap-xs">
          <FocusRing id={ringId} active={focus === "team"} />
          <span className="size-6 rounded-full bg-imagine-secondary-soft ring-2 ring-imagine-surface-raised" />
          <span className="-ml-3 size-6 rounded-full bg-imagine-border ring-2 ring-imagine-surface-raised" />
          <span className="-ml-3 size-6 rounded-full bg-imagine-border/70 ring-2 ring-imagine-surface-raised" />
          <span className="ml-xs type-small text-imagine-foreground-muted">
            Team
          </span>
        </div>
      </div>

      {/* Page */}
      <div className="flex min-w-0 flex-1 flex-col gap-l p-l">
        <div className="flex items-center justify-between gap-l">
          <div className="flex flex-col gap-s">
            <span className="h-2.5 w-36 rounded-full bg-imagine-surface-raised" />
            <span className="h-2 w-52 rounded-full bg-imagine-surface-raised" />
          </div>
          <div className="relative flex items-center gap-s">
            <FocusRing id={ringId} active={focus === "linkedin"} />
            <span className="flex h-control-xs items-center gap-xs rounded-full bg-imagine-surface-raised px-s type-small text-imagine-foreground-muted">
              <Icon name="linkedin-in" size="s" />
              LinkedIn
            </span>
            <span className="size-7 rounded-full bg-imagine-surface-raised" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-l">
          <span className="h-16 rounded-panel bg-imagine-surface-raised" />
          <span className="h-16 rounded-panel bg-imagine-surface-raised" />
        </div>
        <span className="min-h-48 flex-1 rounded-panel bg-imagine-surface-raised" />
      </div>
    </div>
  );
}

/**
 * The right half of the split. Sticks to the viewport while a long step
 * scrolls beside it. On a laptop the mock runs off the right and bottom
 * edges like a window behind the form. On a wide monitor it would stretch
 * into a tall empty slab, so there it stops at a desktop's worth of width
 * and height, rounds all four corners, and floats centered in the pane.
 */
export function PreviewPane() {
  const pathname = usePathname();
  const { orgName, orgLogoUrl } = useOnboarding();

  return (
    <aside
      aria-label="Workspace preview"
      className="hidden min-w-0 flex-col overflow-hidden pt-xxxl pl-xxl lg:sticky lg:top-0 lg:flex lg:h-svh xl:pl-xxxl 2xl:items-center 2xl:justify-center 2xl:px-section 2xl:py-section"
    >
      <div className="flex min-h-0 w-full max-w-5xl flex-1 flex-col gap-l 2xl:max-h-[60rem] 2xl:max-w-[80rem]">
        <p className="type-small text-imagine-foreground-muted">
          This is how it will look
        </p>
        <WorkspaceMock
          orgName={orgName}
          orgLogoUrl={orgLogoUrl}
          focus={focusFor(pathname)}
          className="min-h-0 flex-1 2xl:rounded-surface"
        />
      </div>
    </aside>
  );
}
