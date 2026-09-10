import { LinkedInStep } from "@/app/(auth)/onboarding/linkedin/linkedin-step";
import { StepHeading } from "@/components/features/onboarding/step-heading";
import { getOwner } from "@/services/onboarding";

export default function LinkedInStepPage() {
  const owner = getOwner();

  return (
    <>
      <StepHeading
        title="Connect your LinkedIn"
        description="The agent drafts as you and publishes only what you approve. Connect now to post from day one, or skip and do it later."
        step={3}
        total={3}
      />
      <LinkedInStep
        accountName={owner.name ?? owner.email}
        accountNote={`${owner.email}, ${owner.role}`}
      />
    </>
  );
}
