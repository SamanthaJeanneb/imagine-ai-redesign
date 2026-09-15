/**
 * Onboarding's own view of the people being invited into a new organization,
 * before any of them are `organization_members` yet. Built by
 * `services/onboarding`.
 */
import type { MemberRole } from "@/entities/settings";

export interface TeamMember {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
  role: MemberRole;
  status: "you" | "invited" | "active";
}
