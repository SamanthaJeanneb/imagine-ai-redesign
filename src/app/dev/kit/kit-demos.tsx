"use client";

import { toast } from "sonner";
import { Bar, BarChart, Area, AreaChart, XAxis, YAxis } from "recharts";

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
import {
  Attachment,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
} from "@/components/ui/attachment";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bubble, BubbleContent } from "@/components/ui/bubble";
import { Button } from "@/components/ui/button";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
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
import { Marker, MarkerContent, MarkerIcon } from "@/components/ui/marker";
import {
  Message,
  MessageAvatar,
  MessageContent,
} from "@/components/ui/message";
import {
  MessageScroller,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "@/components/ui/message-scroller";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
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

const IMPRESSIONS = [
  { day: "Mon", impressions: 820 },
  { day: "Tue", impressions: 1240 },
  { day: "Wed", impressions: 980 },
  { day: "Thu", impressions: 1610 },
  { day: "Fri", impressions: 1390 },
  { day: "Sat", impressions: 640 },
  { day: "Sun", impressions: 710 },
];

const BY_TYPE = [
  { type: "Story", posts: 14 },
  { type: "Insight", posts: 22 },
  { type: "Launch", posts: 6 },
  { type: "Hiring", posts: 9 },
];

const chartConfig = {
  impressions: { label: "Impressions", color: "var(--color-chart-1)" },
  posts: { label: "Posts", color: "var(--color-chart-1)" },
} satisfies ChartConfig;

const SCROLLER_LINES = Array.from(
  { length: 12 },
  (_, i) =>
    `Draft ${String(i + 1)}: what we learned shipping the new onboarding`,
);

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
            <Icon name="sparkles" data-icon="inline-start" />
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
    </div>
  );
}

export function ChartDemo() {
  return (
    <div className="grid gap-xl sm:grid-cols-2">
      <div className="flex flex-col gap-s rounded-panel bg-imagine-surface-raised p-l">
        <span className="type-small text-imagine-foreground-muted">
          Impressions, last 7 days
        </span>
        <ChartContainer config={chartConfig} className="h-40 w-full">
          <AreaChart data={IMPRESSIONS} margin={{ left: 0, right: 0 }}>
            <XAxis dataKey="day" tickLine={false} axisLine={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area
              dataKey="impressions"
              type="monotone"
              fill="var(--color-impressions)"
              fillOpacity={0.18}
              stroke="var(--color-impressions)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </div>
      <div className="flex flex-col gap-s rounded-panel bg-imagine-surface-raised p-l">
        <span className="type-small text-imagine-foreground-muted">
          Posts by type
        </span>
        <ChartContainer config={chartConfig} className="h-40 w-full">
          <BarChart data={BY_TYPE} layout="vertical" margin={{ left: 0 }}>
            <XAxis type="number" hide />
            <YAxis
              dataKey="type"
              type="category"
              tickLine={false}
              axisLine={false}
              width={56}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="posts" fill="var(--color-posts)" radius={4} />
          </BarChart>
        </ChartContainer>
      </div>
    </div>
  );
}

export function ChatDemo() {
  return (
    <div className="grid gap-xl sm:grid-cols-[2fr_1fr]">
      <div className="flex h-72 flex-col rounded-panel bg-imagine-surface-raised p-l">
        <MessageScrollerProvider>
          <MessageScroller>
            <MessageScrollerViewport>
              <MessageScrollerContent>
                <MessageScrollerItem>
                  <Marker>
                    <MarkerIcon>
                      <Icon name="calendar" size="s" />
                    </MarkerIcon>
                    <MarkerContent>Today</MarkerContent>
                  </Marker>
                </MessageScrollerItem>
                <MessageScrollerItem>
                  <Message align="end">
                    <MessageContent>
                      <Bubble align="end">
                        <BubbleContent>
                          Draft a post about the onboarding launch for Tuesday.
                        </BubbleContent>
                      </Bubble>
                    </MessageContent>
                  </Message>
                </MessageScrollerItem>
                <MessageScrollerItem>
                  <Message>
                    <MessageAvatar>
                      <Avatar>
                        <AvatarFallback>
                          <Icon name="sparkles" size="s" />
                        </AvatarFallback>
                      </Avatar>
                    </MessageAvatar>
                    <MessageContent>
                      <Bubble variant="ghost">
                        <BubbleContent>
                          Here is a first draft. I pulled the numbers from last
                          week and kept the hook short.
                        </BubbleContent>
                      </Bubble>
                      <Attachment>
                        <AttachmentMedia>
                          <Icon name="image" />
                        </AttachmentMedia>
                        <AttachmentContent>
                          <AttachmentTitle>onboarding-hero.png</AttachmentTitle>
                          <AttachmentDescription>1.2 MB</AttachmentDescription>
                        </AttachmentContent>
                      </Attachment>
                    </MessageContent>
                  </Message>
                </MessageScrollerItem>
                <MessageScrollerItem>
                  <Message align="end">
                    <MessageContent>
                      <Bubble variant="tinted" align="end">
                        <BubbleContent>Schedule it.</BubbleContent>
                      </Bubble>
                    </MessageContent>
                  </Message>
                </MessageScrollerItem>
              </MessageScrollerContent>
            </MessageScrollerViewport>
          </MessageScroller>
        </MessageScrollerProvider>
      </div>

      <div className="flex flex-col gap-s">
        <span className="type-small text-imagine-foreground-muted">
          Scroll area and command
        </span>
        <ScrollArea className="h-28 rounded-control bg-imagine-surface-raised p-s">
          <div className="flex flex-col gap-xs">
            {SCROLLER_LINES.map((line) => (
              <span key={line} className="truncate type-small">
                {line}
              </span>
            ))}
          </div>
        </ScrollArea>
        <Command className="rounded-panel bg-imagine-surface-raised">
          <CommandInput placeholder="Search files" />
          <CommandList>
            <CommandEmpty>No files match.</CommandEmpty>
            <CommandGroup heading="Organization">
              <CommandItem>
                <Icon name="file-lines" />
                Brand voice
              </CommandItem>
              <CommandItem>
                <Icon name="file-lines" />
                Content pillars
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </div>
    </div>
  );
}
