import { ProfilesSettings } from "@/components/features/settings/profiles-settings";
import { getProfileDetails, getProfiles } from "@/services/settings";

/** Settings, Profiles: the LinkedIn identities the workspace posts as. */
export default function SettingsProfilesPage() {
  return (
    <ProfilesSettings profiles={getProfiles()} details={getProfileDetails()} />
  );
}
