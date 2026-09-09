import type { ReactNode } from "react";

import { SettingsPanel } from "@/components/features/settings/settings-panel";
import { SettingsTabs } from "@/components/features/settings/settings-tabs";
import { getWorkspace } from "@/services/workspace";

/**
 * Settings: one heading and the tab strip over every section. The tabs are
 * routes, so this layout persists across them and the indicator slides.
 */
export default function SettingsLayout({ children }: { children: ReactNode }) {
  const workspace = getWorkspace();

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-xl">
      <div className="flex flex-col gap-xxs">
        <h1 className="type-title">Settings</h1>
        <p className="type-small text-imagine-foreground-muted">
          {workspace.name}. {workspace.note}.
        </p>
      </div>
      <SettingsTabs />
      <SettingsPanel>{children}</SettingsPanel>
    </div>
  );
}
