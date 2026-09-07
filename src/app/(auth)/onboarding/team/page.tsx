import { TeamStep } from "@/app/(auth)/onboarding/team/team-step";
import { StepHeading } from "@/components/features/onboarding/step-heading";
import { getInviteUrl, getOwner } from "@/services/onboarding";

export default function TeamStepPage() {
  return (
    <>
      <StepHeading title="Invite your team" step={2} total={3} />
      <TeamStep inviteUrl={getInviteUrl()} owner={getOwner()} />
    </>
  );
}
