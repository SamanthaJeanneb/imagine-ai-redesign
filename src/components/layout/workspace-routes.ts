import type { ComposerPreview } from "@/components/features/agent/composer";
import type { SidebarNavKey } from "@/components/layout/sidebar";
import { toTitle } from "@/lib/format";
import type { AgentMessage } from "@/services/agent";

const NAV_KEYS: readonly SidebarNavKey[] = [
  "agent",
  "calendar",
  "analytics",
  "files",
];

/** `/calendar` and `/agent/t1` both resolve to their nav item; `/settings` to none. */
export function navKeyFor(pathname: string): SidebarNavKey | undefined {
  // The alternate agent landing is still the agent.
  if (pathname === "/landing-2") return "agent";
  // The alternate file manager is still Files.
  if (pathname === "/files-2") return "files";
  // The engagement analytics page is still Analytics.
  if (pathname === "/analytics-2") return "analytics";
  return NAV_KEYS.find(
    (key) => pathname === `/${key}` || pathname.startsWith(`/${key}/`),
  );
}

/** `/agent/t1` → `t1`. */
export function threadIdFor(pathname: string): string | undefined {
  const [, base, threadId] = pathname.split("/");
  return base === "agent" ? threadId : undefined;
}

/**
 * Where the chat goes. It fills the page on `/agent`; beside the calendar and
 * analytics it is a column on the right; everywhere else it is put away.
 */
export function chatColumnFor(pathname: string): ComposerPreview | undefined {
  if (pathname.startsWith("/calendar")) return "calendar";
  if (pathname.startsWith("/analytics")) return "analytics";
  return undefined;
}

/** The first thing the user said, as a name for a thread that has none yet. */
export function titleFrom(
  messages: readonly AgentMessage[],
): string | undefined {
  for (const message of messages) {
    if (message.role !== "user") continue;
    for (const part of message.parts) {
      if (part.type === "text" && part.text.trim() !== "") {
        return toTitle(part.text, 40);
      }
    }
  }
  return undefined;
}
