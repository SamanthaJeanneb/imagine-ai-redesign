import type { Metadata } from "next";

import { ProfilesSettings } from "@/components/features/settings/profiles-settings";
import { getProfileDetails, getProfiles } from "@/services/settings";

export const metadata: Metadata = {
  title: "Profiles",
  description: "The LinkedIn identities the workspace posts as.",
};

/** Settings, Profiles: the LinkedIn identities the workspace posts as. */
export default function SettingsProfilesPage() {
  return (
    <ProfilesSettings profiles={getProfiles()} details={getProfileDetails()} />
  );
}
