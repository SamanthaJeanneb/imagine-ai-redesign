import { getThreads } from "@/services/agent";

export function GET() {
  return Response.json({ threads: getThreads() });
}
