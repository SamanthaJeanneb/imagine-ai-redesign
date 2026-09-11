import { cn } from "cn";
import type { ReactNode } from "react";

interface SettingsSectionProps {
  title: string;
  description?: string;
  /** Sits at the end of the heading row: Invite, Add profile. */
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

/**
 * One block of a settings tab: a heading with room for an action, then the
 * content in plain rows on the page surface. Sections are separated by
 * spacing, not rules or cards.
 */
export function SettingsSection({
  title,
  description,
  action,
  children,
  className,
}: SettingsSectionProps) {
  return (
    <section
      data-slot="settings-section"
      className={cn("flex flex-col gap-l", className)}
    >
      <div className="flex flex-wrap items-start justify-between gap-m">
        <div className="flex flex-col gap-xxs">
          <h2 className="type-heading">{title}</h2>
          {description === undefined ? null : (
            <p className="type-small text-imagine-foreground-muted">
              {description}
            </p>
          )}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
