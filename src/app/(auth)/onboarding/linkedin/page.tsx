import { LinkedInStep } from "@/app/(auth)/onboarding/linkedin/linkedin-step";
import {
  getConnectableAccounts,
  getOwnAccount,
  getOwner,
} from "@/services/onboarding";

export default function LinkedInStepPage() {
  const owner = getOwner();

  return (
    <LinkedInStep
      ownAccount={getOwnAccount()}
      ownAccountNote={`${owner.email}, ${owner.role}`}
      connectable={getConnectableAccounts()}
    />
  );
}
