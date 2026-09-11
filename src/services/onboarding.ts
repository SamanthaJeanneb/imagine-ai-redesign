import type { TeamMember } from "@/components/features/onboarding/invite-team-form";
import type { ProfileSummary } from "@/components/features/settings/profile-list";
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

/**
 * Who the owner's LinkedIn account can post as once it connects. A member
 * profile is a login; these are the identities behind it (`app.clients`):
 * the owner's own profile, then every company page they administer.
 */
export function getPostingIdentities(): readonly ProfileSummary[] {
  const owner = getOwner();
  const self: ProfileSummary = {
    id: `member-${owner.id}`,
    name: owner.name ?? owner.email,
    headline: "Your profile",
    ...(owner.avatarUrl === undefined ? {} : { avatarUrl: owner.avatarUrl }),
    kind: "person",
    status: "connected",
  };
  const pages = getDb()
    .app.clients.filter((client) => client.is_company)
    .map<ProfileSummary>((client) => ({
      id: client.id,
      name: client.name,
      headline: "Company page you admin",
      ...(client.profile_picture_path === null
        ? {}
        : { avatarUrl: client.profile_picture_path }),
      kind: "company",
      status: "connected",
    }));
  return [self, ...pages];
}

/** The link that lands on the join screen. */
export function getInviteUrl(): string {
  return `https://imagine.ai/join/${getOrganization().id}`;
}
