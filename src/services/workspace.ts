import type { JoinMember } from "@/components/features/onboarding/join-organization";
import type { SidebarUser } from "@/components/layout/sidebar";
import { getDb, getOrganization } from "@/mocks/db";

export interface Workspace {
  id: string;
  name: string;
  /** The company page's picture doubles as the workspace mark. */
  logoUrl?: string;
  memberCount: number;
  profileCount: number;
  /** "12 members · 3 LinkedIn profiles". */
  note: string;
  members: readonly JoinMember[];
}

/** The company client's picture. `organizations` has no logo column. */
export function getWorkspaceLogoUrl(): string | undefined {
  const company = getDb().app.clients.find((client) => client.is_company);
  return company?.profile_picture_path ?? undefined;
}

/** Everything the sidebar and the join screen need about the workspace. */

export function getWorkspace(): Workspace {
  const db = getDb();
  const org = getOrganization();
  const logoUrl = getWorkspaceLogoUrl();
  const members = db.app.organization_members.filter(
    (member) => member.org_id === org.id,
  );
  const profileCount = db.app.clients.filter(
    (client) => client.org_id === org.id,
  ).length;

  return {
    id: org.id,
    name: org.name,
    ...(logoUrl === undefined ? {} : { logoUrl }),
    memberCount: members.length,
    profileCount,
    note: `${String(members.length)} members · ${String(profileCount)} LinkedIn profiles`,
    members: members.map((member) => ({
      id: member.user_id,
      name: member.member_name ?? member.user_id,
    })),
  };
}

/** Whoever is signed in. The mock signs in as the user who created the org. */
export function getCurrentUser(): SidebarUser {
  const db = getDb();
  const org = getOrganization();
  const user = db.public.users.find((row) => row.id === org.created_by);

  return {
    name: user?.name ?? "Unknown user",
    ...(user?.avatar_url === null || user?.avatar_url === undefined
      ? {}
      : { avatarUrl: user.avatar_url }),
  };
}
