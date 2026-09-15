import type { ReactNode } from "react";

import { SettingsPanel } from "@/components/features/settings/settings-panel";
import { SettingsTabs } from "@/components/features/settings/settings-tabs";

/**
 * Settings: one heading and the tab strip over every section. The tabs are
 * routes, so this layout persists across them and the indicator slides.
 */
export default function SettingsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-l md:gap-xl">
      <h1 className="type-title">Settings</h1>
      <SettingsTabs />
      <SettingsPanel>{children}</SettingsPanel>
    </div>
  );
}
