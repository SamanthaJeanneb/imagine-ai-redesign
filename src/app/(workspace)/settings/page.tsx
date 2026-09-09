import { GeneralSettings } from "@/components/features/settings/general-settings";
import { getGeneralSettings } from "@/services/settings";

/** Settings, General: the organization, its members, and the theme. */
export default function SettingsPage() {
  return <GeneralSettings {...getGeneralSettings()} />;
}
