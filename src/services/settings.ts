import type {
  AvailableIntegration,
  ConnectedIntegration,
} from "@/components/features/settings/integrations";
import type {
  Member,
  MemberRole,
} from "@/components/features/settings/members-list";
import type { ProfileDetailData } from "@/components/features/settings/profile-detail";
import type { ProfileSummary } from "@/components/features/settings/profile-list";
import type { IconName } from "@/components/ui/icon";
import {
  type Client,
  toConnectionState,
  transformClientRow,
} from "@/entities/client";
import { formatRelative } from "@/lib/format";
import { getDb, getNow, getOrganization } from "@/mocks/db";
import { getWorkspaceLogoUrl } from "@/services/workspace";

const MEMBER_ROLES: readonly MemberRole[] = ["owner", "admin", "member"];

function toMemberRole(value: string): MemberRole {
  return MEMBER_ROLES.find((role) => role === value) ?? "member";
}

export interface GeneralSettings {
  orgName: string;
  logoUrl?: string;
}

/** Settings, General. The organization and its appearance. */
export function getGeneralSettings(): GeneralSettings {
  const org = getOrganization();
  const logoUrl = getWorkspaceLogoUrl();

  return {
    orgName: org.name,
    ...(logoUrl === undefined ? {} : { logoUrl }),
  };
}

export interface MembersSettings {
  members: readonly Member[];
  /** Whoever is signed in, so the list can mark them. */
  currentUserId: string;
  /** Shareable join URL for this organization. */
  inviteUrl: string;
}

/** Settings, Members. Everyone with access to the organization. */
export function getMembersSettings(): MembersSettings {
  const db = getDb();
  const org = getOrganization();
  const usersById = new Map(db.public.users.map((user) => [user.id, user]));

  const members = db.app.organization_members
    .filter((member) => member.org_id === org.id)
    .map<Member>((member) => {
      const user = usersById.get(member.user_id);
      const avatarUrl = user?.avatar_url ?? null;
      return {
        id: member.user_id,
        name: member.member_name ?? user?.name ?? member.user_id,
        email: user?.email ?? "",
        ...(avatarUrl === null ? {} : { avatarUrl }),
        role: toMemberRole(member.role),
      };
    });

  return {
    members,
    currentUserId: org.created_by,
    inviteUrl: `https://imagine.ai/join/${org.id}`,
  };
}

/** The CRMs and channels the org can connect, keyed by `crm_connections.provider`. */
const PROVIDERS: Record<
  string,
  { name: string; description: string; icon: IconName }
> = {
  hubspot: {
    name: "HubSpot",
    description: "Match LinkedIn engagement to accounts, contacts, and deals.",
    icon: "hubspot",
  },
  salesforce: {
    name: "Salesforce",
    description: "Mirror pipeline stages and opportunities into reporting.",
    icon: "salesforce",
  },
  slack: {
    name: "Slack",
    description: "Send drafts and failures to a channel for review.",
    icon: "slack",
  },
};

function linkedInAuth(clientId: string) {
  return getDb().app.client_linkedin_auth.find(
    (row) => row.client_id === clientId,
  );
}

/**
 * Connection state and first-linked time. `client_linkedin_auth` is the
 * truth; `clients.status` is the fallback for a profile that was never linked.
 */
function connection(client: Client) {
  const auth = linkedInAuth(client.id);
  return {
    status: toConnectionState(auth?.status ?? client.status),
    ...(auth === undefined ? {} : { connectedAt: auth.created_at }),
  };
}

function headline(client: Client): string {
  return client.description ?? (client.isCompany ? "Company page" : "");
}

/** Settings, Profiles. Every LinkedIn identity the workspace posts as. */
export function getProfiles(): readonly ProfileSummary[] {
  return getDb()
    .app.clients.map(transformClientRow)
    .map((client) => ({
      id: client.id,
      name: client.name,
      headline: headline(client),
      ...(client.profilePicturePath === null
        ? {}
        : { avatarUrl: client.profilePicturePath }),
      kind: client.isCompany ? "company" : "person",
      ...connection(client),
    }));
}

/** How many of a profile's posts have gone out, which is what the agent reads. */
function publishedCount(clientId: string): number {
  return getDb().app.client_posts.filter(
    (post) => post.client_id === clientId && post.status === "published",
  ).length;
}

function toProfileDetail(client: Client): ProfileDetailData {
  const org = getOrganization();
  const logoUrl = getWorkspaceLogoUrl();

  return {
    id: client.id,
    name: client.name,
    headline: headline(client),
    ...(client.profilePicturePath === null
      ? {}
      : { avatarUrl: client.profilePicturePath }),
    kind: client.isCompany ? "company" : "person",
    ...connection(client),
    postsIndexed: publishedCount(client.id),
    ...(client.isCompany
      ? {}
      : {
          company: {
            name: org.name,
            ...(logoUrl === undefined ? {} : { logoUrl }),
            url: `linkedin.com/company/${org.name.toLowerCase()}`,
          },
        }),
    ...(client.persona.trim() === ""
      ? {}
      : { persona: { fileName: "persona.md" } }),
  };
}

/** Every profile's detail, keyed by id, so the pane can follow the list. */
export function getProfileDetails(): Record<string, ProfileDetailData> {
  return Object.fromEntries(
    getDb()
      .app.clients.map(transformClientRow)
      .map((client) => [client.id, toProfileDetail(client)]),
  );
}

export interface Integrations {
  connected: readonly ConnectedIntegration[];
  available: readonly AvailableIntegration[];
}

/**
 * LinkedIn is connected per profile through `client_linkedin_auth`, so it shows
 * as one row summarizing the connected identities. Profiles are connected or
 * not; they do not expire.
 */
function linkedInIntegration(): ConnectedIntegration | null {
  const auths = getDb().app.client_linkedin_auth.filter(
    (auth) => auth.status === "connected",
  );
  if (auths.length === 0) return null;

  return {
    id: "linkedin",
    name: "LinkedIn",
    description: "Publishing and analytics for every profile you manage.",
    icon: "linkedin-in",
    status: "connected",
    facts: [`${String(auths.length)} profiles`, "All connected"],
  };
}

/** "47 contacts, 9 deals": what a CRM connection has brought in. */
function crmFacts(connectionId: string): string {
  const db = getDb();
  const contacts = db.app.crm_contacts.filter(
    (contact) => contact.connection_id === connectionId,
  ).length;
  const deals = db.app.crm_opportunities.filter(
    (opportunity) => opportunity.connection_id === connectionId,
  ).length;
  return `${String(contacts)} contacts, ${String(deals)} deals`;
}

/** Settings, Integrations. Connected rows come from `crm_connections`. */
export function getIntegrations(): Integrations {
  const db = getDb();
  const now = getNow();
  const linkedIn = linkedInIntegration();

  const connected = [
    ...(linkedIn === null ? [] : [linkedIn]),
    ...db.app.crm_connections.flatMap<ConnectedIntegration>((connection) => {
      const provider = PROVIDERS[connection.provider];
      if (provider === undefined) return [];
      return [
        {
          id: connection.id,
          name: provider.name,
          description: provider.description,
          icon: provider.icon,
          status: connection.status === "connected" ? "connected" : "expired",
          facts: [
            connection.last_synced_at === null
              ? "Never synced"
              : `Synced ${formatRelative(connection.last_synced_at, now)}`,
            crmFacts(connection.id),
          ],
        },
      ];
    }),
  ];

  const connectedProviders = new Set(
    db.app.crm_connections.map((connection) => connection.provider),
  );

  return {
    connected,
    available: Object.entries(PROVIDERS)
      .filter(([provider]) => !connectedProviders.has(provider))
      .map(([provider, detail]) => ({
        id: provider,
        name: detail.name,
        description: detail.description,
        icon: detail.icon,
      })),
  };
}

export interface ApiKeyData {
  /** The full secret, or `null` before one has been created. */
  secret: string | null;
}

/** Settings, API. One key per workspace. */
export function getApiKeyData(): ApiKeyData {
  const org = getOrganization();
  const key = getDb().app.api_keys.find((row) => row.org_id === org.id);
  return { secret: key?.key ?? null };
}
