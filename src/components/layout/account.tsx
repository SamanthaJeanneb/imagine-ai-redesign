"use client";

import { cn } from "cn";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icon } from "@/components/ui/icon";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface AccountUser {
  name: string;
  /** The login the account is under; shown in the account menu. */
  email?: string;
  avatarUrl?: string;
}

interface AccountControlsProps {
  user: AccountUser;
  /** The gear, and the Settings row of the account menu. */
  onOpenSettings?: () => void;
  /** The Sign out row of the account menu. */
  onSignOut?: () => void;
  /** Face and gear only, when the header has no room for the name. */
  compact?: boolean;
  className?: string;
}

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

function initials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

/**
 * The theme row of the account menu: the same three choices as Settings,
 * behind a sun or moon for whatever is showing now. The choice is unknown
 * until the client mounts, so the indicator waits rather than jumping.
 */
function ThemeMenu() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  const isDark = mounted && resolvedTheme === "dark";

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        <Icon name={isDark ? "moon" : "sun"} />
        Theme
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent>
        <DropdownMenuRadioGroup
          value={mounted ? toThemeValue(theme) : ""}
          onValueChange={(next) => {
            setTheme(toThemeValue(next));
          }}
        >
          {THEMES.map((option) => (
            <DropdownMenuRadioItem key={option.value} value={option.value}>
              {option.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}

/**
 * Who is signed in, at the top right of every workspace page: avatar, name,
 * and the way into settings. The avatar and name open the account menu,
 * which shows the email the account is under, and holds Settings, Theme,
 * and Sign out. Sits in the page header row beside the sidebar expand control.
 */
export function AccountControls({
  user,
  onOpenSettings,
  onSignOut,
  compact = false,
  className,
}: AccountControlsProps) {
  const avatar = (
    <Avatar size="sm">
      {user.avatarUrl ? <AvatarImage src={user.avatarUrl} alt="" /> : null}
      <AvatarFallback>{initials(user.name)}</AvatarFallback>
    </Avatar>
  );

  return (
    <div className={cn("flex items-center gap-xs", className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label={`Account: ${user.name}`}
            className="-my-xs flex h-8 min-w-0 items-center gap-s rounded-control py-xs pr-s pl-xs text-left transition-colors outline-none hover:bg-imagine-foreground/5 focus-visible:ring-2 focus-visible:ring-ring/40 data-[state=open]:bg-imagine-foreground/5"
          >
            {avatar}
            <span
              className={cn(
                "max-w-36 truncate type-small font-medium",
                compact ? "hidden" : "max-md:hidden",
              )}
            >
              {user.name}
            </span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <div className="flex items-center gap-s px-1.5 py-1.5">
            <Avatar>
              {user.avatarUrl ? (
                <AvatarImage src={user.avatarUrl} alt="" />
              ) : null}
              <AvatarFallback>{initials(user.name)}</AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-col">
              <span className="truncate type-small font-medium text-imagine-foreground">
                {user.name}
              </span>
              {user.email === undefined ? null : (
                <span
                  title={user.email}
                  className="truncate type-caption text-imagine-foreground-muted"
                >
                  {user.email}
                </span>
              )}
            </div>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem onSelect={onOpenSettings}>
              <Icon name="gear" />
              Settings
            </DropdownMenuItem>
            <ThemeMenu />
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={onSignOut}>
            <Icon name="right-from-bracket" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="icon-sm"
            variant="ghost"
            aria-label="Settings"
            onClick={onOpenSettings}
            className="text-imagine-foreground-muted hover:text-imagine-foreground"
          >
            <Icon name="gear" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">Settings</TooltipContent>
      </Tooltip>
    </div>
  );
}
