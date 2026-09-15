import type { SearchBoxResult } from "@/components/ui/search-box";
import type { SidebarThread } from "@/entities/agent";

/** Chats whose title or preview contains every word in the query. */
export function searchThreads(
  threads: readonly SidebarThread[],
  query: string,
): SearchBoxResult[] {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  return threads.flatMap((thread) => {
    const hay = `${thread.title} ${thread.preview ?? ""}`.toLowerCase();
    if (!words.every((word) => hay.includes(word))) return [];
    return [
      {
        id: thread.id,
        icon: "message" as const,
        title: thread.title,
        ...(thread.preview === undefined ? {} : { detail: thread.preview }),
      },
    ];
  });
}
