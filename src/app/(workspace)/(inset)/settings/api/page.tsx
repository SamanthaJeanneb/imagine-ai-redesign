import type { Metadata } from "next";

import { ApiSettings } from "@/components/features/settings/api-settings";
import { getApiKeyData } from "@/services/settings";

export const metadata: Metadata = {
  title: "API",
  description: "The workspace API key.",
};

/** Settings, API: the workspace key. */
export default function SettingsApiPage() {
  return <ApiSettings {...getApiKeyData()} />;
}
