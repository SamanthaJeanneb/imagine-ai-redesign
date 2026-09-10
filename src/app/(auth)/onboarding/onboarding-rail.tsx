"use client";

import { usePathname, useRouter } from "next/navigation";

import { Stepper } from "@/components/features/onboarding/stepper";

/**
 * The setup rail. Signing in counts as the first step, so it is always done and
 * the three routes below it are steps two through four.
 */
const STEPS: readonly { id: string; label: string; href?: string }[] = [
  { id: "account", label: "Account created" },
  {
    id: "organization",
    label: "Set up organization",
    href: "/onboarding/organization",
  },
  { id: "team", label: "Invite team", href: "/onboarding/team" },
  { id: "linkedin", label: "Connect LinkedIn", href: "/onboarding/linkedin" },
];

export function OnboardingRail() {
  const pathname = usePathname();
  const router = useRouter();
  const current = STEPS.findIndex((step) => step.href === pathname);

  return (
    // Same top inset as the step surface, so the first step sits on the same
    // line as the step's heading now that no mark stands above it. The width
    // follows the viewport: never narrower than the labels need on one line,
    // and never a sliver beside a wide screen's surface.
    <div className="flex w-[clamp(14rem,17vw,20rem)] shrink-0 flex-col px-l pt-section pb-xxl">
      <Stepper
        steps={STEPS}
        current={current === -1 ? 1 : current}
        onSelect={(index) => {
          // Signing in has no step to go back to.
          const href = STEPS[index]?.href;
          if (href !== undefined) router.push(href);
        }}
      />
    </div>
  );
}
