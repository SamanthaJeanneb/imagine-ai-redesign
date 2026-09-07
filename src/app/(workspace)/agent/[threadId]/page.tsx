import { notFound } from "next/navigation";

import { PagePlaceholder } from "@/app/(workspace)/page-placeholder";
import { getThread } from "@/services/agent";

export default async function ThreadPage({
  params,
}: {
  params: Promise<{ threadId: string }>;
}) {
  const { threadId } = await params;
  const thread = getThread(threadId);
  if (thread === null) notFound();

  return (
    <PagePlaceholder title={thread.title} note="The conversation lands here." />
  );
}
