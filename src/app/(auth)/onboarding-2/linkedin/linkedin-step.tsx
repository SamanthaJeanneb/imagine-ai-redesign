"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { StepFrame } from "@/app/(auth)/onboarding-2/step-frame";
import { ConnectLinkedIn } from "@/components/features/onboarding/connect-linkedin";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Spinner } from "@/components/ui/spinner";

const PERMISSIONS = [
  "Publish posts you approve, on the schedule you set",
  "Read post analytics to plan what to write next",
];

interface LinkedInStepProps {
  accountName: string;
  accountNote: string;
}

/** Last step, so both actions finish setup and open the workspace. */
export function LinkedInStep({ accountName, accountNote }: LinkedInStepProps) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function finish() {
    start(() => {
      router.push("/agent");
    });
  }

  return (
    <StepFrame
      step={4}
      total={4}
      title="Connect your LinkedIn"
      description="The agent drafts as you and publishes only what you approve. Connect now to post from day one, or skip and do it later."
      actions={
        <>
          <Button size="lg" disabled={pending} onClick={finish}>
            {pending ? (
              <Spinner size="s" data-icon="inline-start" />
            ) : (
              <Icon name="linkedin-in" data-icon="inline-start" />
            )}
            Connect LinkedIn
          </Button>
          <Button
            variant="link"
            className="text-imagine-foreground-muted"
            disabled={pending}
            onClick={finish}
          >
            Skip and do this later
          </Button>
          <Button
            variant="link"
            className="ml-auto text-imagine-foreground-muted"
            disabled={pending}
            onClick={() => {
              router.push("/onboarding-2/team");
            }}
          >
            Back
          </Button>
        </>
      }
    >
      <ConnectLinkedIn
        accountName={accountName}
        accountNote={accountNote}
        permissions={PERMISSIONS}
        pending={pending}
        showActions={false}
        onConnect={finish}
        onSkip={finish}
      />
    </StepFrame>
  );
}
