import type {
  AvailableIntegration,
  ConnectedIntegration,
} from "@/components/features/settings/integrations";
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
  return getDb().app.clients.map(transformClientRow).map((client) => ({
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

export function getProfileDetail(clientId: string): ProfileDetailData | null {
  const row = getDb().app.clients.find((client) => client.id === clientId);
  if (row === undefined) return null;
  const client = transformClientRow(row);

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
    ...(client.isCompany
      ? {}
      : {
          company: {
            name: org.name,
            ...(logoUrl === undefined ? {} : { logoUrl }),
            url: `https://www.linkedin.com/company/${org.name.toLowerCase()}`,
          },
        }),
    persona: { fileName: "persona.md" },
  };
}

export interface Integrations {
  connected: readonly ConnectedIntegration[];
  available: readonly AvailableIntegration[];
}

/** Settings, Integrations. Connected rows come from `crm_connections`. */
export function getIntegrations(): Integrations {
  const db = getDb();
  const now = getNow();

  const connected = db.app.crm_connections.flatMap<ConnectedIntegration>(
    (connection) => {
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
            "Accounts, contacts, and deals",
          ],
        },
      ];
    },
  );

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

/** Settings, API. One key per workspace, or `null` before one is created. */
export function getApiKey(): string | null {
  const org = getOrganization();
  const key = getDb().app.api_keys.find((row) => row.org_id === org.id);
  return key?.key ?? null;
}
