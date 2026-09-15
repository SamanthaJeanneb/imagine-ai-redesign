/**
 * The settings screens' view of an organization: its connected LinkedIn
 * profiles, its members, and its third-party integrations. Built by
 * `services/settings` from `clients`, `organization_members`, and the
 * connection state each client is in.
 */
import type { IconName } from "@/styles/icons";

export type ConnectionStatus = "connected" | "disconnected";

export interface ProfileSummary {
  id: string;
  name: string;
  /** Headline or "Company page". */
  headline: string;
  avatarUrl?: string;
  kind: "person" | "company";
  status: ConnectionStatus;
  /** ISO time LinkedIn was first linked. Absent until they connect. */
  connectedAt?: string;
}

export interface ProfileDetailData {
  id: string;
  name: string;
  headline: string;
  avatarUrl?: string;
  kind: "person" | "company";
  status: ConnectionStatus;
  /** ISO time LinkedIn was first linked. Absent until they connect. */
  connectedAt?: string;
  /** Published posts the agent has read for voice and analytics. */
  postsIndexed?: number;
  company?: { name: string; logoUrl?: string; url: string };
  persona?: { fileName: string };
}

/** `organization_members.role`, narrowed to what settings can assign. */
export type MemberRole = "admin" | "member";

export interface Member {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role: MemberRole;
  /** Invited but not yet signed in. */
  pending?: boolean;
}

export interface ConnectedIntegration {
  id: string;
  name: string;
  description: string;
  icon: IconName;
  status: "connected" | "expired";
}

export interface AvailableIntegration {
  id: string;
  name: string;
  description: string;
  icon: IconName;
}
