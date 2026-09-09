import { ApiSettings } from "@/components/features/settings/api-settings";
import { getApiKeyData } from "@/services/settings";

/** Settings, API: the workspace key. */
export default function SettingsApiPage() {
  return <ApiSettings {...getApiKeyData()} />;
}
