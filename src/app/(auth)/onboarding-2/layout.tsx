import type { ReactNode } from "react";

import { OnboardingProvider } from "@/app/(auth)/onboarding/onboarding-provider";
import { PreviewPane } from "@/app/(auth)/onboarding-2/preview-pane";
import { BrandMark } from "@/components/ui/brand-mark";

/**
 * Setup as a split: the step on a surface at left, a live preview of the
 * workspace on the background at right. The left column stops growing at a
 * reading width and the preview stops growing at a screen's worth, so a wide
 * monitor gets margin rather than a stretched form beside a giant mock.
 */
export default function Onboarding2Layout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <OnboardingProvider>
      <div className="grid min-h-svh flex-1 bg-imagine-background lg:grid-cols-[minmax(26rem,42%)_minmax(0,1fr)] 2xl:grid-cols-[40rem_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col bg-imagine-surface lg:rounded-r-surface">
          <div className="mx-auto flex w-full max-w-lg flex-1 flex-col px-xl pt-xxl pb-xxl lg:px-xxxl lg:pt-xxxl">
            <div className="flex items-center gap-s">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-control bg-imagine-foreground">
                <BrandMark
                  name="imagine"
                  className="size-4 text-imagine-surface"
                />
              </span>
              <span className="type-title">Imagine AI</span>
            </div>
            {children}
          </div>
        </div>
        <PreviewPane />
      </div>
    </OnboardingProvider>
  );
}
