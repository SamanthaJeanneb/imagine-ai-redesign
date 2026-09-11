import type { ReactNode } from "react";

import { OnboardingProvider } from "@/app/(auth)/onboarding/onboarding-provider";
import { OnboardingRail } from "@/app/(auth)/onboarding-1/onboarding-rail";
import { Wordmark } from "@/components/ui/brand-mark";

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
      <div className="flex min-h-svh w-full min-w-0 flex-1 overflow-x-clip bg-imagine-background">
        <OnboardingRail />
        <main className="flex min-w-0 flex-1 justify-center overflow-x-clip rounded-none bg-imagine-surface px-l pt-xl pb-xl md:rounded-l-surface md:px-xl md:pt-section md:pb-xxl">
          {/* The step starts a little under the rail's mark, as the reference. */}
          <div className="flex w-full max-w-(--container-xl) flex-col md:pt-xxl">
            <Wordmark className="mb-xl w-28 text-imagine-foreground md:hidden" />
            {children}
          </div>
        </main>
      </div>
    </OnboardingProvider>
  );
}
