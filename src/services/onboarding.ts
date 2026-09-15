import type { TeamMember } from "@/entities/onboarding";
import type { ProfileSummary } from "@/entities/settings";
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

/** The owner's own LinkedIn, as it will read once linked. */
export function getOwnAccount(): ProfileSummary {
  const owner = getOwner();
  return {
    id: `member-${owner.id}`,
    name: owner.name ?? owner.email,
    headline: "Your profile",
    ...(owner.avatarUrl === undefined ? {} : { avatarUrl: owner.avatarUrl }),
    kind: "person",
    status: "connected",
  };
}

/**
 * What the other LinkedIn sign-ins during onboarding resolve to, in order:
 * the company page first, then the people the org posts for (`app.clients`).
 * A real sign-in would return whoever logged in; the mock hands these out.
 */
export function getConnectableAccounts(): readonly ProfileSummary[] {
  const owner = getOwner();
  return getDb()
    .app.clients.filter((client) => client.name !== owner.name)
    .toSorted((a, b) => Number(b.is_company) - Number(a.is_company))
    .map<ProfileSummary>((client) => ({
      id: client.id,
      name: client.name,
      headline: client.is_company
        ? "Company page"
        : (client.description ?? "LinkedIn profile"),
      ...(client.profile_picture_path === null
        ? {}
        : { avatarUrl: client.profile_picture_path }),
      kind: client.is_company ? "company" : "person",
      status: "connected",
    }));
}

/** Where the last step books the strategy meeting with the team. */
export function getStrategyMeetingUrl(): string {
  return "https://cal.com/imagine-ai/strategy";
}

/** The link that lands on the join screen. */
export function getInviteUrl(): string {
  return `https://imagine.ai/join/${getOrganization().id}`;
}
