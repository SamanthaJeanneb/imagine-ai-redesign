import type { ReactNode } from "react";

import { OnboardingProvider } from "@/app/(auth)/onboarding/onboarding-provider";
import { OnboardingRail } from "@/app/(auth)/onboarding/onboarding-rail";

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
          <div className="flex w-full max-w-lg flex-col gap-xl">{children}</div>
        </main>
      </div>
    </OnboardingProvider>
  );
}
