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
    // Logo anchors the top; the stepper sits below with room to breathe. Width
    // follows the viewport: never narrower than the labels need on one line,
    // and never a sliver beside a wide screen's surface.
    <div className="hidden w-[clamp(16rem,18vw,20rem)] shrink-0 flex-col gap-xxxl px-xl pt-section pb-xxl md:flex">
      <span
        role="img"
        aria-label="Imagine AI"
        className="block w-28 aspect-[138/43] bg-imagine-foreground mask-[url(/brand/imagine-logo.png)] mask-contain mask-no-repeat mask-center"
      />
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
