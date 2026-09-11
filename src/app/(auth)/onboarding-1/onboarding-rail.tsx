"use client";

import { usePathname, useRouter } from "next/navigation";

import { Stepper } from "@/components/features/onboarding/stepper";
import { Wordmark } from "@/components/ui/brand-mark";
import { getOwner } from "@/services/onboarding";

/**
 * The setup rail. Signing in counts as the first step, so it is always done and
 * the three routes below it are steps two through four.
 */
const STEPS: readonly { id: string; label: string; href?: string }[] = [
  { id: "account", label: "Account created" },
  {
    id: "organization",
    label: "Set up organization",
    href: "/onboarding-1/organization",
  },
  { id: "team", label: "Invite team", href: "/onboarding-1/team" },
  { id: "linkedin", label: "Connect LinkedIn", href: "/onboarding-1/linkedin" },
];

export function OnboardingRail() {
  const pathname = usePathname();
  const router = useRouter();
  const current = STEPS.findIndex((step) => step.href === pathname);
  const { email } = getOwner();

  return (
    // Logo and steps at the top, signed-in line at the bottom. Width follows
    // the viewport: never narrower than the labels need on one line, and never
    // a sliver beside a wide screen's surface.
    <div className="hidden w-[clamp(16rem,22vw,20rem)] shrink-0 flex-col justify-between self-stretch px-xl pt-section pb-xxl md:flex">
      <div className="flex flex-col gap-section">
        <Wordmark className="w-28 text-imagine-foreground" />
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
      {email ? (
        <p className="truncate type-caption text-imagine-foreground-muted">
          Signed in as <span className="text-imagine-foreground">{email}</span>
        </p>
      ) : null}
    </div>
  );
}
