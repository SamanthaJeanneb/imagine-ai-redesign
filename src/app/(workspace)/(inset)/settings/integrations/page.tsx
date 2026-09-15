import type { Metadata } from "next";

import { IntegrationsSettings } from "@/components/features/settings/integrations-settings";
import { getIntegrations } from "@/services/settings";

export const metadata: Metadata = {
  title: "Integrations",
  description: "Connected services and what can be added.",
};

/** Settings, Integrations: connected services and what can be added. */
export default function SettingsIntegrationsPage() {
  return <IntegrationsSettings {...getIntegrations()} />;
}
