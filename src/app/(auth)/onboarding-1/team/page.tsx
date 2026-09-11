import { TeamStep } from "@/app/(auth)/onboarding-1/team/team-step";
import { StepHeading } from "@/components/features/onboarding/step-heading";
import { getInviteUrl, getOwner } from "@/services/onboarding";

export default function TeamStepPage() {
  return (
    <>
      <StepHeading
        title="Who's on your team?"
        description="Add the people who write, review, or approve posts. You can always invite more from settings."
        step={3}
        total={4}
      />
      <TeamStep inviteUrl={getInviteUrl()} owner={getOwner()} />
    </>
  );
}
