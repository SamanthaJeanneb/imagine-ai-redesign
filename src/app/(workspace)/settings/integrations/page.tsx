import { IntegrationsSettings } from "@/components/features/settings/integrations-settings";
import { getIntegrations } from "@/services/settings";

/** Settings, Integrations: connected services and what can be added. */
export default function SettingsIntegrationsPage() {
  return <IntegrationsSettings {...getIntegrations()} />;
}
