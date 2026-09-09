"use client";

import { cn } from "cn";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icon, type IconName } from "@/components/ui/icon";

export type NewMenuIntent =
  | "folder"
  | "document"
  | "upload-files"
  | "upload-folder";

interface NewMenuProps {
  onIntent: (intent: NewMenuIntent) => void;
  /** Where the new item lands, for the menu's hint. */
  location?: string;
  className?: string;
}

const CREATE: readonly { intent: NewMenuIntent; label: string; icon: IconName }[] =
  [
    { intent: "folder", label: "New folder", icon: "folder-plus" },
    { intent: "document", label: "New document", icon: "file-plus" },
  ];

const UPLOAD: readonly { intent: NewMenuIntent; label: string; icon: IconName }[] =
  [
    { intent: "upload-files", label: "Upload files", icon: "upload" },
    { intent: "upload-folder", label: "Upload folder", icon: "cloud-arrow-up" },
  ];

function Item({
  label,
  icon,
  onSelect,
}: {
  label: string;
  icon: IconName;
  onSelect: () => void;
}) {
  return (
    <DropdownMenuItem onSelect={onSelect} className="h-8 gap-s px-s">
      <span className="flex size-5 shrink-0 items-center justify-center text-imagine-foreground-muted">
        <Icon name={icon} size="s" />
      </span>
      <span className="font-medium">{label}</span>
    </DropdownMenuItem>
  );
}

/**
 * The rail's primary action. One button, four intents: make a folder or a
 * document here, or bring files in. The menu takes the button's width so it
 * reads as the button unfolding.
 */
export function NewMenu({ onIntent, location, className }: NewMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="sm"
          data-slot="new-menu"
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
      <DropdownMenuContent align="start" sideOffset={6} className="p-xs">
        {CREATE.map((item) => (
          <Item
            key={item.intent}
            label={item.label}
            icon={item.icon}
            onSelect={() => {
              onIntent(item.intent);
            }}
          />
        ))}
        <DropdownMenuSeparator className="my-xs bg-imagine-border" />
        {UPLOAD.map((item) => (
          <Item
            key={item.intent}
            label={item.label}
            icon={item.icon}
            onSelect={() => {
              onIntent(item.intent);
            }}
          />
        ))}
        {location === undefined ? null : (
          <p className="truncate px-s pt-xs pb-xxs text-xs text-imagine-foreground-faint">
            Into {location}
          </p>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
