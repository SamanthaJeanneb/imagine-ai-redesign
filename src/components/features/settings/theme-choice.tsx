"use client";

import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

const THEMES = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
] as const;

type ThemeValue = (typeof THEMES)[number]["value"];

const subscribe = () => () => undefined;

function toThemeValue(value: string | undefined): ThemeValue {
  return THEMES.find((theme) => theme.value === value)?.value ?? "system";
}

/**
 * Settings, General: the same switch as the header toggle, spelled out. The
 * choice is unknown until the client mounts, so the indicator waits for it
 * rather than jumping from a server guess.
 */
export function ThemeChoice({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

  return (
    <ToggleGroup
      size="sm"
      aria-label="Theme"
      value={mounted ? toThemeValue(theme) : ""}
      onValueChange={(next) => {
        setTheme(toThemeValue(next));
      }}
      {...(className === undefined ? {} : { className })}
    >
      {THEMES.map((option) => (
        <ToggleGroupItem key={option.value} value={option.value}>
          {option.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
