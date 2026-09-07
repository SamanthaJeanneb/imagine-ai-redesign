import { getThread } from "@/services/agent";

export async function GET(
  _request: Request,
  context: RouteContext<"/api/threads/[threadId]">,
) {
  const { threadId } = await context.params;
  const thread = getThread(threadId);

  if (thread === null) {
    return Response.json({ error: "Thread not found" }, { status: 404 });
  }

  return Response.json(thread);
}
