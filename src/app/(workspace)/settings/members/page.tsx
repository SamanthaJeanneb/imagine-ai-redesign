import { MembersSettings } from "@/components/features/settings/members-settings";
import { getMembersSettings } from "@/services/settings";

/** Settings, Members: invite teammates and manage organization access. */
export default function SettingsMembersPage() {
  return <MembersSettings {...getMembersSettings()} />;
}
