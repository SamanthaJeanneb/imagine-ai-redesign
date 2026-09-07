"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { ConnectLinkedIn } from "@/components/features/onboarding/connect-linkedin";

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
      pending={pending}
      onConnect={finish}
      onSkip={finish}
    />
  );
}
