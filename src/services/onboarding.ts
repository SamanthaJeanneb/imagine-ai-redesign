import type { TeamMember } from "@/components/features/onboarding/invite-team-form";
import { getDb, getOrganization } from "@/mocks/db";

/**
 * Sign-in and onboarding. The org already exists in the mock, so onboarding
 * reads the signed-in member and the invite link and lets the screens pretend
 * the rest was just typed.
 */

/** `false` walks `/` through sign-in; `true` sends it straight to the app. */
export function isOnboarded(): boolean {
  return getDb().onboarded;
}

/** The person doing the setup, as the first row of the team list. */
export function getOwner(): TeamMember {
  const db = getDb();
  const org = getOrganization();
  const user = db.public.users.find((row) => row.id === org.created_by);

  return {
    id: org.created_by,
    email: user?.email ?? "",
    ...(user?.name === null || user?.name === undefined
      ? {}
      : { name: user.name }),
    ...(user?.avatar_url === null || user?.avatar_url === undefined
      ? {}
      : { avatarUrl: user.avatar_url }),
    role: "admin",
    status: "you",
  };
}

/** The link that lands on the join screen. */
export function getInviteUrl(): string {
  return `https://imagine.ai/join/${getOrganization().id}`;
}
