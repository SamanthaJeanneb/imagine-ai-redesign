"use client";

import { motion } from "motion/react";

import { useOnboarding } from "@/app/(auth)/onboarding/onboarding-provider";
import { CenteredIntro } from "@/components/features/agent/agent-landing-2";
import { AccountControls, type AccountUser } from "@/components/layout/account";
import { Sidebar, type SidebarThread } from "@/components/layout/sidebar";
import { fade } from "@/styles/motion";

/** Stand-ins for the conversations the rail will hold once setup is done. */
const PREVIEW_THREADS: readonly SidebarThread[] = [
  { id: "welcome", title: "Welcome to Imagine", unread: true },
  { id: "first-post", title: "Your first post" },
];

interface OnboardingPreviewProps {
  user: AccountUser;
  /** Today, formatted the way the landing shows it. */
  dateLabel: string;
}

/**
 * The workspace being set up, shown beside the steps the way Slack previews a
 * new workspace while you name it. It is the real shell, the same `Sidebar`,
 * header and landing intro the app uses, filled in from what has been typed
 * so far, and it is a picture: inert, so nothing in it can take focus or a
 * click. It bleeds off the right and bottom edges so it reads as a glimpse of
 * the app, not a second app.
 */
export function OnboardingPreview({ user, dateLabel }: OnboardingPreviewProps) {
  const { orgName, orgLogoUrl } = useOnboarding();
  const [firstName] = user.name.split(" ");

  return (
    <motion.div
      aria-hidden="true"
      inert
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={fade.slow}
      // Drawn at a reduced scale, as a preview is, and sized up by the same
      // factor so it still fills the column and runs off its right and
      // bottom edges by one section.
      className="absolute top-section left-0 flex h-[calc(100%/var(--preview-scale))] w-[calc((100%+var(--imagine-spacing-section))/var(--preview-scale))] origin-top-left scale-[var(--preview-scale)] overflow-hidden rounded-surface border border-imagine-border bg-imagine-background shadow-floating [--preview-scale:0.85]"
    >
      <Sidebar
        orgName={orgName.trim() === "" ? "Your organization" : orgName}
        {...(orgLogoUrl === undefined ? {} : { orgLogoUrl })}
        active="agent"
        threads={PREVIEW_THREADS}
      />
      {/* The page beside the rail: the workspace header row, then the landing
          the user will see first, greeting them by name. The right padding is
          the part that bleeds off screen, so the content centers on what is
          actually visible. */}
      <div className="flex min-w-0 flex-1 flex-col rounded-l-surface bg-imagine-surface pr-section shadow-raised">
        <div className="relative mt-m mb-m flex h-8 shrink-0 items-center px-xxl after:absolute after:inset-x-0 after:-bottom-m after:border-b after:border-imagine-border">
          <AccountControls user={user} className="-mr-s ml-auto" />
        </div>
        <div className="px-xxl">
          <CenteredIntro
            greeting={`Hi ${firstName ?? "there"}, what are we posting next?`}
            dateLabel={dateLabel}
          />
        </div>
      </div>
    </motion.div>
  );
}
