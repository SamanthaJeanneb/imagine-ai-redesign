import type { ReactNode } from "react";

import { OnboardingPreview } from "@/app/(auth)/onboarding/onboarding-preview";
import { OnboardingProvider } from "@/app/(auth)/onboarding/onboarding-provider";
import { OnboardingRail } from "@/app/(auth)/onboarding/onboarding-rail";
import type { AccountUser } from "@/components/layout/account";
import { formatFullDate } from "@/lib/format";
import { getNow } from "@/mocks/db";
import { getOwner } from "@/services/onboarding";

/**
 * Setup rail on the background, steps on a surface that rounds into it. On
 * wide screens the surface splits: the step on the left, and on the right a
 * live preview of the workspace being set up, so the page is never a form
 * floating in white.
 */
export default function OnboardingLayout({
  children,
}: {
  children: ReactNode;
}) {
  const owner = getOwner();
  const user: AccountUser = {
    name: owner.name ?? owner.email,
    ...(owner.avatarUrl === undefined ? {} : { avatarUrl: owner.avatarUrl }),
  };

  return (
    <OnboardingProvider>
      <div className="flex flex-1 bg-imagine-background">
        <OnboardingRail />
        <main className="grid min-w-0 flex-1 grid-cols-1 rounded-l-surface bg-imagine-surface xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
          <section className="flex justify-center px-xl pt-section pb-xxl md:px-section xl:justify-start">
            <div className="flex w-full max-w-lg flex-col gap-xl">{children}</div>
          </section>
          {/* Same top inset as the step, so the preview's top edge sits on
              the heading's line. It is clipped on the right and bottom. */}
          <aside className="relative hidden overflow-hidden pt-section xl:block">
            <OnboardingPreview
              user={user}
              dateLabel={formatFullDate(getNow())}
            />
          </aside>
        </main>
      </div>
    </OnboardingProvider>
  );
}
