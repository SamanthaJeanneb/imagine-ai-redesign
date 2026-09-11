import type { ReactNode } from "react";

import { OnboardingProvider } from "@/app/(auth)/onboarding/onboarding-provider";
import { OnboardingRail } from "@/app/(auth)/onboarding-1/onboarding-rail";

/**
 * Setup rail on the background, steps centered on a surface that rounds into
 * it. The provider keeps what has been typed across steps, so going back to
 * an earlier one does not clear it.
 */
export default function OnboardingLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <OnboardingProvider>
      <div className="flex min-h-svh flex-1 bg-imagine-background">
        <OnboardingRail />
        <main className="flex min-w-0 flex-1 justify-center rounded-none bg-imagine-surface px-l pt-section pb-xxl md:rounded-l-surface md:px-xl">
          {/* The step starts a little under the rail's mark, as the reference. */}
          <div className="flex w-full max-w-(--container-xl) flex-col md:pt-xxl">
            {children}
          </div>
        </main>
      </div>
    </OnboardingProvider>
  );
}
