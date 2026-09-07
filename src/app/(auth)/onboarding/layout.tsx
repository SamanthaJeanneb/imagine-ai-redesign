import type { ReactNode } from "react";

import { OnboardingRail } from "@/app/(auth)/onboarding/onboarding-rail";

/** Setup rail on the background, steps on a surface that rounds into it. */
export default function OnboardingLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="flex flex-1 bg-imagine-background">
      <OnboardingRail />
      <main className="flex min-w-0 flex-1 justify-center rounded-l-surface bg-imagine-surface px-xl pt-section pb-xxl">
        <div className="flex w-full max-w-md flex-col gap-xl">{children}</div>
      </main>
    </div>
  );
}
