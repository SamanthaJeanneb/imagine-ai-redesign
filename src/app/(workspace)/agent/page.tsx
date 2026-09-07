import { PagePlaceholder } from "@/app/(workspace)/page-placeholder";
import { getCurrentUser } from "@/services/workspace";

export default function AgentPage() {
  const user = getCurrentUser();
  const firstName = user.name.split(" ")[0] ?? user.name;

  return (
    <PagePlaceholder
      title={`How can I help with your LinkedIn content today, ${firstName}?`}
      note="The composer, the timeline, and the two-week calendar land here."
    />
  );
}
