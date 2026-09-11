import { LinkedInStep } from "@/app/(auth)/onboarding-2/linkedin/linkedin-step";
import { getOwner, getPostingIdentities } from "@/services/onboarding";

export default function LinkedInStepPage() {
  const owner = getOwner();

  return (
    <LinkedInStep
      accountName={owner.name ?? owner.email}
      accountNote={`${owner.email}, ${owner.role}`}
      identities={getPostingIdentities()}
    />
  );
}
