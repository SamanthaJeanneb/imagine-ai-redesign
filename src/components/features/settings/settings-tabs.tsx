"use client";

import { cn } from "cn";
import { motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useId } from "react";

import { press, spring } from "@/styles/motion";

export interface SettingsTab {
  href: string;
  label: string;
}

export const SETTINGS_TABS: readonly SettingsTab[] = [
  { href: "/settings", label: "General" },
  { href: "/settings/profiles", label: "Profiles" },
  { href: "/settings/integrations", label: "Integrations" },
  { href: "/settings/api", label: "API" },
];

/** `/settings/profiles/anything` is Profiles; `/settings` alone is General. */
function isActive(tab: SettingsTab, pathname: string, first: boolean): boolean {
  if (first) return pathname === tab.href;
  return pathname === tab.href || pathname.startsWith(`${tab.href}/`);
}

interface SettingsTabsProps {
  tabs?: readonly SettingsTab[];
  /** Overrides the pathname, for previews outside the router. */
  activeHref?: string;
  onNavigate?: (href: string) => void;
  className?: string;
}

/**
 * The settings sections as routes. Each tab is a link, so the page keeps its
 * URL and prefetches; one underline slides between them with a shared
 * `layoutId`, the same selection language as the tab strip and nav.
 */
export function SettingsTabs({
  tabs = SETTINGS_TABS,
  activeHref,
  onNavigate,
  className,
}: SettingsTabsProps) {
  const pathname = usePathname();
  const indicatorId = useId();
  const current = activeHref ?? pathname;

  return (
    <nav
      aria-label="Settings sections"
      data-slot="settings-tabs"
      className={cn(
        "flex items-center gap-xs overflow-x-auto border-b border-imagine-border",
        className,
      )}
    >
      {tabs.map((tab, index) => {
        const active = isActive(tab, current, index === 0);
        return (
          <motion.span
            key={tab.href}
            whileTap={press.whileTap}
            transition={press.transition}
            className="relative flex"
          >
            <Link
              href={tab.href}
              aria-current={active ? "page" : undefined}
              onClick={(event) => {
                if (onNavigate === undefined) return;
                event.preventDefault();
                onNavigate(tab.href);
              }}
              className={cn(
                "relative inline-flex h-control-base items-center rounded-control px-1.5 text-sm font-medium whitespace-nowrap transition-colors outline-none select-none focus-visible:ring-2 focus-visible:ring-ring/40",
                active
                  ? "text-imagine-foreground"
                  : "text-imagine-foreground-muted hover:text-imagine-foreground",
              )}
            >
              {tab.label}
            </Link>
            {active ? (
              <motion.span
                layoutId={indicatorId}
                aria-hidden="true"
                transition={spring.snappy}
                className="absolute inset-x-1.5 -bottom-px h-0.5 rounded-full bg-imagine-foreground"
              />
            ) : null}
          </motion.span>
        );
      })}
    </nav>
  );
}
