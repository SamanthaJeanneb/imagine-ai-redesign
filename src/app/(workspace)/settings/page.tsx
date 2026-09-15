import type { Metadata } from "next";

import { GeneralSettings } from "@/components/features/settings/general-settings";
import { getGeneralSettings } from "@/services/settings";

export const metadata: Metadata = {
  title: "General",
  description: "The organization's name, logo, and theme.",
};

/** Settings, General: the organization and theme. */
export default function SettingsPage() {
  return <GeneralSettings {...getGeneralSettings()} />;
}
