"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import {
  ConnectLinkedIn,
  ConnectLinkedInActions,
} from "@/components/features/onboarding/connect-linkedin";
import { Button } from "@/components/ui/button";

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
    <ConnectLinkedIn
      accountName={accountName}
      accountNote={accountNote}
      permissions={PERMISSIONS}
    >
      <ConnectLinkedInActions pending={pending} onConnect={finish}>
        <Button
          variant="link"
          className="text-imagine-foreground-muted"
          onClick={finish}
        >
          Skip and do this later
        </Button>
      </ConnectLinkedInActions>
    </ConnectLinkedIn>
  );
}
