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
import { formatDayMonth, formatRelative } from "@/lib/format";
import { getDb, getNow, getOrganization } from "@/mocks/db";
import { getWorkspaceLogoUrl } from "@/services/workspace";

const MEMBER_ROLES: readonly MemberRole[] = ["owner", "admin", "member"];

function toMemberRole(value: string): MemberRole {
  return MEMBER_ROLES.find((role) => role === value) ?? "member";
}

export interface GeneralSettings {
  orgName: string;
  logoUrl?: string;
  members: readonly Member[];
  /** Whoever is signed in, so the list can mark them. */
  currentUserId: string;
}

/** Settings, General. The organization and everyone in it. */
export function getGeneralSettings(): GeneralSettings {
  const db = getDb();
  const org = getOrganization();
  const logoUrl = getWorkspaceLogoUrl();
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
    orgName: org.name,
    ...(logoUrl === undefined ? {} : { logoUrl }),
    members,
    currentUserId: org.created_by,
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

/**
 * A client's connection state. `client_linkedin_auth` is the truth; `clients.status`
 * is the fallback for a profile that was never linked.
 */
function connectionState(client: Client) {
  const auth = getDb().app.client_linkedin_auth.find(
    (row) => row.client_id === client.id,
  );
  return toConnectionState(auth?.status ?? client.status);
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
      status: connectionState(client),
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
    status: connectionState(client),
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
 * as one row summarizing them. It needs attention as soon as one has lapsed.
 */
function linkedInIntegration(): ConnectedIntegration | null {
  const auths = getDb().app.client_linkedin_auth;
  if (auths.length === 0) return null;
  const lapsed = auths.filter((auth) => auth.status !== "connected").length;

  return {
    id: "linkedin",
    name: "LinkedIn",
    description: "Publishing and analytics for every profile you manage.",
    icon: "linkedin-in",
    status: lapsed > 0 ? "expired" : "connected",
    facts: [
      `${String(auths.length)} profiles`,
      lapsed > 0
        ? `${String(lapsed)} ${lapsed === 1 ? "needs" : "need"} reconnecting`
        : "All connected",
    ],
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
  /** "Last used 2h ago", "Created 2 May". Empty without a key. */
  facts: readonly string[];
}

/** Settings, API. One key per workspace. */
export function getApiKeyData(): ApiKeyData {
  const org = getOrganization();
  const now = getNow();
  const key = getDb().app.api_keys.find((row) => row.org_id === org.id);
  if (key === undefined) return { secret: null, facts: [] };

  return {
    secret: key.key,
    facts: [
      key.last_used_at === null
        ? "Never used"
        : `Last used ${formatRelative(key.last_used_at, now)}`,
      key.rotated_at === null
        ? `Created ${formatDayMonth(key.created_at)}`
        : `Rotated ${formatDayMonth(key.rotated_at)}`,
    ],
  };
}
