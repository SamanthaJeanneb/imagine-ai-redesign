import { getTimeline } from "@/services/agent";

export function GET() {
  return Response.json({ entries: getTimeline() });
}
