"use client";

import { cn } from "cn";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface AccountUser {
  name: string;
  avatarUrl?: string;
}

interface AccountControlsProps {
  user: AccountUser;
  /** The avatar and name. */
  onOpenAccount?: () => void;
  /** The gear. */
  onOpenSettings?: () => void;
  className?: string;
}

function initials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

/**
 * Who is signed in, at the top right of every workspace page: avatar, name,
 * and the way into settings. Sits in the page header row beside the sidebar
 * expand control.
 */
export function AccountControls({
  user,
  onOpenAccount,
  onOpenSettings,
  className,
}: AccountControlsProps) {
  return (
    <div className={cn("flex items-center gap-xs", className)}>
      <button
        type="button"
        onClick={onOpenAccount}
        className="-my-xs flex h-8 items-center gap-s rounded-control py-xs pr-s pl-xs text-left transition-colors outline-none hover:bg-imagine-foreground/5 focus-visible:ring-2 focus-visible:ring-ring/40"
      >
        <Avatar size="sm">
          {user.avatarUrl ? <AvatarImage src={user.avatarUrl} alt="" /> : null}
          <AvatarFallback>{initials(user.name)}</AvatarFallback>
        </Avatar>
        <span className="truncate type-small font-medium">{user.name}</span>
      </button>
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
