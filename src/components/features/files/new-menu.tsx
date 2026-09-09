"use client";

import { cn } from "cn";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icon, type IconName } from "@/components/ui/icon";

export type NewMenuIntent = "document" | "folder";

interface NewMenuProps {
  onIntent: (intent: NewMenuIntent) => void;
  disabled?: boolean;
  className?: string;
}

const ITEMS: readonly { intent: NewMenuIntent; label: string; icon: IconName }[] =
  [
    { intent: "document", label: "Document", icon: "file-plus" },
    { intent: "folder", label: "Folder", icon: "folder-plus" },
  ];

/**
 * The sidebar's primary action. One button, two intents: a new document or a
 * new folder in the current location. The menu opens under the button at the
 * button's width so it reads as the button unfolding.
 */
export function NewMenu({ onIntent, disabled = false, className }: NewMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="sm"
          data-slot="new-menu"
          disabled={disabled}
          className={cn("w-full justify-center", className)}
        >
          <Icon name="plus" size="s" data-icon="inline-start" />
          New
          <Icon
            name="chevron-down"
            size="s"
            data-icon="inline-end"
            className="text-imagine-primary-foreground/60"
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        sideOffset={6}
        className="w-(--radix-dropdown-menu-trigger-width) p-xs"
      >
        {ITEMS.map((item) => (
          <DropdownMenuItem
            key={item.intent}
            className="h-8 gap-s px-s"
            onSelect={() => {
              onIntent(item.intent);
            }}
          >
            <span className="flex size-5 shrink-0 items-center justify-center text-imagine-foreground-muted">
              <Icon name={item.icon} size="s" />
            </span>
            <span className="font-medium">{item.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
