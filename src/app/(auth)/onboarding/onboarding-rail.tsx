"use client";

import { usePathname, useRouter } from "next/navigation";

import { Stepper } from "@/components/features/onboarding/stepper";
import { Icon } from "@/components/ui/icon";

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
    <div className="flex w-56 shrink-0 flex-col gap-xxl px-l py-xl">
      <span className="flex size-8 items-center justify-center rounded-control accent-gradient text-imagine-secondary-foreground">
        <Icon name="sparkles" size="s" active />
      </span>
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
