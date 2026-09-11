import { TeamStep } from "@/app/(auth)/onboarding-2/team/team-step";
import { getInviteUrl, getOwner } from "@/services/onboarding";

export default function TeamStepPage() {
  return <TeamStep inviteUrl={getInviteUrl()} owner={getOwner()} />;
}
