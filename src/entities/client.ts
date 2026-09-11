/**
 * A client is a LinkedIn identity the org posts as, not a human login. The app
 * has no `entities/clients` yet, so this follows the same row-transform
 * convention the assets entity established.
 */
import type { ClientRow } from "@/entities/rows";

export interface Client {
  id: string;
  orgId: string;
  name: string;
  description: string | null;
  isCompany: boolean;
  linkedinId: string | null;
  profilePicturePath: string | null;
  persona: string;
  status: string | null;
  createdAt: string;
  updatedAt: string;
}

/** How the profile list draws a connection. */
export type ConnectionState = "connected" | "disconnected";

const CONNECTION_STATES: readonly ConnectionState[] = [
  "connected",
  "disconnected",
];

export function toConnectionState(value: string | null): ConnectionState {
  return CONNECTION_STATES.find((state) => state === value) ?? "disconnected";
}

export function transformClientRow(row: ClientRow): Client {
  return {
    id: row.id,
    orgId: row.org_id,
    name: row.name,
    description: row.description,
    isCompany: row.is_company,
    linkedinId: row.linkedin_id,
    profilePicturePath: row.profile_picture_path,
    persona: row.persona,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
