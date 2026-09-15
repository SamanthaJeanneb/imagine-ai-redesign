import type { Metadata } from "next";

import { MembersSettings } from "@/components/features/settings/members-settings";
import { getMembersSettings } from "@/services/settings";

export const metadata: Metadata = {
  title: "Members",
  description: "Invite teammates and manage organization access.",
};

/** Settings, Members: invite teammates and manage organization access. */
export default function SettingsMembersPage() {
  return <MembersSettings {...getMembersSettings()} />;
}
