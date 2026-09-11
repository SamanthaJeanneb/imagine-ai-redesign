"use client";

import { cn } from "cn";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

import {
  CONNECTION_LABEL,
  type ConnectionStatus,
} from "@/components/features/settings/profile-list";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { formatDayMonthYear } from "@/lib/format";
import { fade, swapUp } from "@/styles/motion";

export interface ProfileDetailData {
  id: string;
  name: string;
  headline: string;
  avatarUrl?: string;
  kind: "person" | "company";
  status: ConnectionStatus;
  /** ISO time LinkedIn was first linked. Absent until they connect. */
  connectedAt?: string;
  /** Published posts the agent has read for voice and analytics. */
  postsIndexed?: number;
  company?: { name: string; logoUrl?: string; url: string };
  persona?: { fileName: string };
}

interface ProfileDetailProps {
  profile: ProfileDetailData;
  /** Index posts is running; the button shows it and cannot start another. */
  indexing?: boolean;
  onReconnect?: () => void;
  onChangeCompany?: () => void;
  onLinkCompany?: (url: string) => void;
  onViewPersona?: () => void;
  onIndexPosts?: () => void;
  /** Called once the user has confirmed. */
  onRemove?: () => void;
  className?: string;
}

function initials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

/** A white row on the panel's grey: company and persona. */
const CARD =
  "flex items-center gap-m rounded-control bg-imagine-surface px-m py-s";

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-l py-xs">
      <span className="type-small text-imagine-foreground-muted">{label}</span>
      <span className="flex items-center gap-s type-small">{children}</span>
    </div>
  );
}

function Group({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-s">
      <span className="type-small text-imagine-foreground-muted">{title}</span>
      {children}
    </section>
  );
}

/**
 * The detail pane beside the profile list: a raised (grey) panel with key
 * facts as rows, then Company and Persona as white cards on it, and the
 * destructive action alone at the bottom. Callers shape the panel's edges.
 */
export function ProfileDetail({
  profile,
  indexing = false,
  onReconnect,
  onChangeCompany,
  onLinkCompany,
  onViewPersona,
  onIndexPosts,
  onRemove,
  className,
}: ProfileDetailProps) {
  const [companyUrl, setCompanyUrl] = useState("");

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={profile.id}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={fade.base}
        data-slot="profile-detail"
        className={cn(
          "flex h-full flex-col gap-xl overflow-y-auto rounded-panel bg-imagine-surface-raised p-l",
          className,
        )}
      >
        <header className="flex items-center gap-m">
          <Avatar
            size="lg"
            shape={profile.kind === "company" ? "square" : "circle"}
          >
            {profile.avatarUrl ? (
              <AvatarImage src={profile.avatarUrl} alt={profile.name} />
            ) : null}
            <AvatarFallback>
              {profile.kind === "company" ? (
                <Icon name="building" />
              ) : (
                initials(profile.name)
              )}
            </AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-col">
            <span className="truncate type-heading">{profile.name}</span>
            <span className="truncate type-small text-imagine-foreground-muted">
              {profile.headline}
            </span>
          </div>
        </header>

        <div className="flex flex-col">
          <Row label="Connection">
            <Badge
              variant={profile.status === "connected" ? "success" : "soft"}
            >
              {CONNECTION_LABEL[profile.status]}
            </Badge>
            {profile.status !== "connected" && onReconnect ? (
              <Button
                size="xs"
                variant="soft"
                className="bg-imagine-surface"
                onClick={onReconnect}
              >
                Reconnect
              </Button>
            ) : null}
          </Row>
          <Row label="First connected">
            {profile.connectedAt === undefined
              ? "Not yet"
              : formatDayMonthYear(profile.connectedAt)}
          </Row>
          {profile.postsIndexed === undefined ? null : (
            <Row label="Posts indexed">
              <AnimatePresence initial={false} mode="popLayout">
                <motion.span
                  key={profile.postsIndexed}
                  {...swapUp}
                  transition={fade.fast}
                  className="tabular-nums"
                >
                  {profile.postsIndexed}
                </motion.span>
              </AnimatePresence>
            </Row>
          )}
        </div>

        {profile.kind === "person" ? (
          <Group title="Company">
            {profile.company ? (
              <div className={CARD}>
                <Avatar size="sm" shape="square">
                  {profile.company.logoUrl ? (
                    <AvatarImage
                      src={profile.company.logoUrl}
                      alt={profile.company.name}
                    />
                  ) : null}
                  <AvatarFallback>
                    <Icon name="building" size="s" />
                  </AvatarFallback>
                </Avatar>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate type-small font-medium">
                    {profile.company.name}
                  </span>
                  <span className="truncate type-small text-imagine-foreground-muted">
                    {profile.company.url}
                  </span>
                </span>
                <Button size="xs" variant="ghost" onClick={onChangeCompany}>
                  Change
                </Button>
              </div>
            ) : (
              <form
                className="flex min-w-0 flex-col gap-s sm:flex-row sm:items-center"
                onSubmit={(event) => {
                  event.preventDefault();
                  if (companyUrl.trim()) onLinkCompany?.(companyUrl.trim());
                }}
              >
                <Input
                  value={companyUrl}
                  placeholder="linkedin.com/company/"
                  aria-label="Company page address"
                  className="min-w-0 bg-imagine-surface"
                  onChange={(event) => {
                    setCompanyUrl(event.target.value);
                  }}
                />
                <Button
                  type="submit"
                  size="sm"
                  variant="soft"
                  className="bg-imagine-surface"
                  disabled={!companyUrl.trim()}
                >
                  Link
                </Button>
              </form>
            )}
          </Group>
        ) : null}

        <Group title="Persona">
          {profile.persona ? (
            <div className={CARD}>
              <Icon
                name="file-lines"
                size="s"
                className="text-imagine-foreground-faint"
              />
              <span className="min-w-0 flex-1 truncate type-small font-medium">
                {profile.persona.fileName}
              </span>
              <Button size="xs" variant="ghost" onClick={onViewPersona}>
                View in Files
              </Button>
            </div>
          ) : (
            <p className="type-small text-imagine-foreground-muted">
              No persona yet. The agent writes one after indexing posts.
            </p>
          )}
        </Group>

        <div className="mt-auto flex flex-wrap items-center justify-between gap-s border-t border-imagine-border pt-l">
          <Button
            variant="ghost"
            size="sm"
            disabled={indexing}
            aria-busy={indexing}
            onClick={onIndexPosts}
          >
            {indexing ? (
              <Spinner size="s" data-icon="inline-start" />
            ) : (
              <Icon name="arrows-rotate" size="s" data-icon="inline-start" />
            )}
            {indexing ? "Indexing" : "Index posts"}
          </Button>
          {onRemove ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                >
                  Remove
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Remove {profile.name}?</AlertDialogTitle>
                  <AlertDialogDescription>
                    The agent stops posting as this profile and its scheduled
                    posts are unscheduled. Published posts stay on LinkedIn.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction variant="destructive" onClick={onRemove}>
                    Remove
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : null}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
