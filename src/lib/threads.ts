import type { SidebarThread } from "@/entities/agent";

/**
 * A conversation that has not been stored yet has no row of its own, so lists
 * that must show it put it in front under the name it is going by. Without a
 * title there is nothing to show, and a stored thread is already in the list.
 */
export function withEphemeralThread(
  threads: readonly SidebarThread[],
  id: string | null,
  title: string | undefined,
): readonly SidebarThread[] {
  if (id === null || title === undefined) return threads;
  if (threads.some((thread) => thread.id === id)) return threads;
  return [{ id, title }, ...threads];
}
