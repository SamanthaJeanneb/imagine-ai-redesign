import { LinkedInStep } from "@/app/(auth)/onboarding/linkedin/linkedin-step";
import { StepHeading } from "@/components/features/onboarding/step-heading";
import { getOwner } from "@/services/onboarding";

export default function LinkedInStepPage() {
  const owner = getOwner();

  return (
    <>
      <StepHeading title="Connect your LinkedIn" step={3} total={3} />
      <LinkedInStep
        accountName={owner.name ?? owner.email}
        accountNote={`${owner.email}, ${owner.role}`}
      />
    </>
  );
}
