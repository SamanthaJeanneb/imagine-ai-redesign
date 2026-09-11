import type { ReactNode } from "react";

import { OnboardingProvider } from "@/app/(auth)/onboarding/onboarding-provider";
import { PreviewPane } from "@/app/(auth)/onboarding/preview-pane";
import { getThreads } from "@/services/agent";
import { getOwner } from "@/services/onboarding";

/** Enough recent chats to fill the rail's list without scrolling. */
const RECENT_CHATS = 6;

/**
 * Setup as a split: the step on a surface at left, a live preview of the
 * workspace on a rose wash at right. The left column stops growing at a
 * reading width and the preview stops growing at a screen's worth, so a wide
 * monitor gets margin rather than a stretched form beside a giant mock.
 */
export default function Onboarding2Layout({
  children,
}: {
  children: ReactNode;
}) {
  const owner = getOwner();
  const threads = getThreads()
    .slice(0, RECENT_CHATS)
    .map(({ id, title, unread }) => ({
      id,
      title,
      ...(unread === undefined ? {} : { unread }),
    }));

  return (
    <OnboardingProvider>
      <div className="grid min-h-svh w-full min-w-0 flex-1 overflow-x-clip bg-imagine-surface lg:grid-cols-[minmax(26rem,42%)_minmax(0,1fr)] 2xl:grid-cols-[40rem_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col">
          <div className="mx-auto flex w-full max-w-lg flex-1 flex-col px-l pt-xl pb-0 md:px-xl md:pt-xxl md:pb-xxl lg:pt-xxxl xl:px-xxxl">
            <span
              role="img"
              aria-label="Imagine AI"
              className="block aspect-[138/43] w-28 bg-imagine-foreground mask-[url(/brand/imagine-logo.png)] mask-contain mask-center mask-no-repeat"
            />
            {children}
          </div>
        </div>
        <PreviewPane
          threads={threads}
          owner={{
            name: owner.name ?? owner.email,
            ...(owner.avatarUrl === undefined
              ? {}
              : { avatarUrl: owner.avatarUrl }),
          }}
        />
      </div>
    </OnboardingProvider>
  );
}
