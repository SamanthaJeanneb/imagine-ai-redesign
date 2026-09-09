"use client";

import { useState } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbMenu,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Chip, ChipGroup } from "@/components/ui/chip-group";
import { DashedAction } from "@/components/ui/dashed-action";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const PROFILES = ["All profiles", "Acme (company)", "Sarah Chen", "Ravi Patel"];

export function FormDemo() {
  return (
    <div className="grid gap-xl sm:grid-cols-2">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="kit-org">Organization name</FieldLabel>
          <Input id="kit-org" placeholder="Acme Inc." />
          <FieldDescription>
            Shown on every profile you manage.
          </FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor="kit-profile">Profile</FieldLabel>
          <Select defaultValue={PROFILES[0]}>
            <SelectTrigger id="kit-profile" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {PROFILES.map((profile) => (
                  <SelectItem key={profile} value={profile}>
                    {profile}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>
        <Field data-invalid>
          <FieldLabel htmlFor="kit-url">LinkedIn URL</FieldLabel>
          <Input id="kit-url" aria-invalid defaultValue="linkedin.com/in/" />
          <FieldDescription className="text-destructive">
            Enter the full profile address.
          </FieldDescription>
        </Field>
      </FieldGroup>

      <div className="flex flex-col gap-l">
        <Textarea placeholder="Persona notes" />
        <InputGroup className="h-auto items-end rounded-panel bg-imagine-surface-raised p-xs">
          <InputGroupTextarea
            placeholder="Ask the agent anything about your LinkedIn"
            rows={2}
          />
          <InputGroupAddon align="inline-end">
            <InputGroupButton
              variant="ghost"
              size="icon-xs"
              aria-label="Attach"
            >
              <Icon name="paperclip" />
            </InputGroupButton>
            <InputGroupButton size="icon-xs" aria-label="Send">
              <Icon name="arrow-up" />
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
      </div>
    </div>
  );
}

export function SelectionDemo() {
  return (
    <div className="flex flex-col gap-xl">
      <div className="flex flex-wrap items-center gap-xl">
        <ToggleGroup defaultValue="week" aria-label="Calendar view">
          <ToggleGroupItem value="day">Day</ToggleGroupItem>
          <ToggleGroupItem value="week">Week</ToggleGroupItem>
          <ToggleGroupItem value="month">Month</ToggleGroupItem>
        </ToggleGroup>
        <ToggleGroup defaultValue="30d" size="sm" aria-label="Range">
          <ToggleGroupItem value="7d">7d</ToggleGroupItem>
          <ToggleGroupItem value="30d">30d</ToggleGroupItem>
          <ToggleGroupItem value="90d">90d</ToggleGroupItem>
        </ToggleGroup>
      </div>

      <Tabs defaultValue="profiles">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="profiles">Profiles</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="api">API</TabsTrigger>
        </TabsList>
        <TabsContent value="general">Organization, members, theme.</TabsContent>
        <TabsContent value="profiles">
          The LinkedIn identities this organization manages.
        </TabsContent>
        <TabsContent value="integrations">
          HubSpot and what else is available.
        </TabsContent>
        <TabsContent value="api">Keys, prefixes, last used.</TabsContent>
      </Tabs>

      <Tabs defaultValue="files" variant="line">
        <TabsList>
          <TabsTrigger value="files">
            <Icon name="folder" data-icon="inline-start" />
            Files
          </TabsTrigger>
          <TabsTrigger value="skills">
            <Icon name="puzzle-piece" data-icon="inline-start" />
            Skills
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
}

export function OverlayDemo() {
  return (
    <div className="flex flex-wrap items-center gap-m">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="soft">
            Sarah Chen
            <Icon name="chevron-down" data-icon="inline-end" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuGroup>
            <DropdownMenuItem>
              <Icon name="user" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Icon name="gear" />
              Settings
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem variant="destructive">
              <Icon name="arrow-right" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline">Post details</Button>
        </PopoverTrigger>
        <PopoverContent>
          <PopoverHeader>
            <PopoverTitle>Why founders should post weekly</PopoverTitle>
            <PopoverDescription>
              Scheduled for Tue, 9 Sep at 9:00 from Sarah Chen.
            </PopoverDescription>
          </PopoverHeader>
          <Button size="sm" className="self-start">
            Open in chat
          </Button>
        </PopoverContent>
      </Popover>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Open files">
            <Icon name="folder" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Files</TooltipContent>
      </Tooltip>

      <Dialog>
        <DialogTrigger asChild>
          <Button variant="soft">Add profile</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add a LinkedIn profile</DialogTitle>
            <DialogDescription>
              Paste the profile address. You can connect it afterwards.
            </DialogDescription>
          </DialogHeader>
          <Input placeholder="linkedin.com/in/" />
          <DialogFooter showCloseButton>
            <Button>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive">Remove profile</Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Ravi Patel?</AlertDialogTitle>
            <AlertDialogDescription>
              Scheduled posts for this profile will be unscheduled. Published
              posts and analytics stay.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep</AlertDialogCancel>
            <AlertDialogAction variant="destructive">Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Button
        variant="ghost"
        onClick={() => {
          toast.success("Post scheduled", {
            description: "Tue, 9 Sep at 9:00 from Sarah Chen.",
          });
        }}
      >
        Show toast
      </Button>
    </div>
  );
}

export function AvatarDemo() {
  return (
    <div className="flex items-center gap-m">
      <Avatar size="sm">
        <AvatarFallback>SC</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarFallback>SC</AvatarFallback>
      </Avatar>
      <Avatar size="lg">
        <AvatarImage src="https://i.pravatar.cc/80?img=47" alt="Sarah Chen" />
        <AvatarFallback>SC</AvatarFallback>
      </Avatar>
      <Avatar size="lg">
        <AvatarFallback>
          <Icon name="linkedin-in" />
        </AvatarFallback>
      </Avatar>
      {/* Organizations and company pages are square. */}
      <Avatar size="lg" shape="square">
        <AvatarImage src="/brand/acme-logo.png" alt="Acme" />
        <AvatarFallback>AC</AvatarFallback>
      </Avatar>
      <Avatar shape="square">
        <AvatarFallback>
          <Icon name="building" size="s" />
        </AvatarFallback>
      </Avatar>
    </div>
  );
}

const LIBRARIES = [
  { id: "acme", label: "Acme", icon: "building" as const },
  { id: "sarah", label: "Sarah Chen", icon: "user" as const },
  { id: "ravi", label: "Ravi Patel", icon: "user" as const },
];

/** Filters, the file manager's breadcrumb, and the dashed "add" affordance. */
export function FileChromeDemo() {
  const [filter, setFilter] = useState("all");
  const [library, setLibrary] = useState("acme");
  const current = LIBRARIES.find((entry) => entry.id === library);

  return (
    <div className="flex flex-col gap-xl">
      <div className="flex flex-wrap items-center justify-between gap-l">
        <ChipGroup value={filter} onValueChange={setFilter} aria-label="Filter">
          <Chip value="all">All</Chip>
          <Chip value="documents">Documents</Chip>
          <Chip value="images">Images</Chip>
          <Chip value="agent">Used by agent</Chip>
        </ChipGroup>
        <span className="type-small text-imagine-foreground-muted">
          Chips filter; the toggle group above switches views.
        </span>
      </div>

      <Breadcrumb>
        <BreadcrumbItem>
          <BreadcrumbLink
            onClick={() => {
              toast("Back to Files");
            }}
          >
            Files
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>{current?.label ?? "Acme"}</BreadcrumbPage>
          <BreadcrumbMenu
            label="Switch library"
            items={LIBRARIES}
            selectedId={library}
            onSelect={setLibrary}
          />
        </BreadcrumbItem>
      </Breadcrumb>

      <div className="grid gap-m sm:grid-cols-[14rem_1fr]">
        <DashedAction
          onClick={() => {
            toast("New folder");
          }}
        >
          New folder
        </DashedAction>
        <DashedAction
          shape="tile"
          icon="file-plus"
          onClick={() => {
            toast("New document");
          }}
        >
          New document
        </DashedAction>
      </div>
    </div>
  );
}
