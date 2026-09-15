"use client";

import { usePathname } from "next/navigation";

import { useOnboarding } from "@/components/features/onboarding/onboarding-provider";
import {
  WorkspaceMock,
  type Focus,
} from "@/components/features/onboarding/workspace-mock";
import type { SidebarThread } from "@/components/layout/sidebar";

function focusFor(pathname: string): Focus {
  if (pathname.endsWith("/team")) return "team";
  if (pathname.endsWith("/linkedin") || pathname.endsWith("/accounts")) {
    return "linkedin";
  }
  if (pathname.endsWith("/meeting")) return "none";
  return "organization";
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
  const { orgName, orgLogoUrl, accounts } = useOnboarding();

  return (
    <aside
      aria-label="Workspace preview"
      className="hidden min-w-0 flex-col overflow-hidden bg-imagine-secondary-soft pt-section pl-xxl lg:sticky lg:top-0 lg:flex lg:h-svh lg:rounded-l-surface xl:pl-xxxl 2xl:items-center 2xl:justify-center 2xl:px-section 2xl:py-section"
    >
      <div className="flex min-h-0 w-full max-w-5xl flex-1 flex-col 2xl:max-h-[60rem] 2xl:max-w-[80rem]">
        <WorkspaceMock
          orgName={orgName}
          orgLogoUrl={orgLogoUrl}
          accounts={accounts}
          threads={threads}
          owner={owner}
          focus={focusFor(pathname)}
          className="min-h-0 flex-1 2xl:rounded-surface"
        />
      </div>
    </aside>
  );
}
