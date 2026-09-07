"use client";

import { cn } from "cn";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

import { type ConnectionStatus } from "@/components/features/settings/profile-list";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { fade } from "@/styles/motion";

export interface ProfileDetailData {
  id: string;
  name: string;
  headline: string;
  avatarUrl?: string;
  kind: "person" | "company";
  status: ConnectionStatus;
  /** "Expires in 12 days" or "Reconnect to keep posting". */
  statusNote?: string;
  postsIndexed: number;
  company?: { name: string; logoUrl?: string; url: string };
  persona?: { fileName: string; updated: string };
}

interface ProfileDetailProps {
  profile: ProfileDetailData;
  onReconnect?: () => void;
  onChangeCompany?: () => void;
  onLinkCompany?: (url: string) => void;
  onViewPersona?: () => void;
  onIndexPosts?: () => void;
  onRemove?: () => void;
  className?: string;
}

const STATUS_LABEL: Record<ConnectionStatus, string> = {
  connected: "Connected",
  expired: "Expired",
  disconnected: "Not connected",
};

function initials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

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
 * The detail pane beside the profile list. Key facts as rows, then Company
 * and Persona groups on soft surfaces, with the destructive action alone at
 * the bottom.
 */
export function ProfileDetail({
  profile,
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
          "flex h-full flex-col gap-xl rounded-panel bg-imagine-surface-raised p-l",
          className,
        )}
      >
        <header className="flex items-center gap-m">
          <Avatar size="lg">
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
              variant={
                profile.status === "connected"
                  ? "success"
                  : profile.status === "expired"
                    ? "warning"
                    : "soft"
              }
            >
              {STATUS_LABEL[profile.status]}
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
          {profile.statusNote ? (
            <span className="pb-xs type-small text-imagine-foreground-muted">
              {profile.statusNote}
            </span>
          ) : null}
          <Row label="Posts indexed">
            <span className="tabular-nums">{profile.postsIndexed}</span>
          </Row>
        </div>

        {profile.kind === "person" ? (
          <Group title="Company">
            {profile.company ? (
              <div className="flex items-center gap-m py-xs">
                <Avatar size="sm">
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
                className="flex items-center gap-s"
                onSubmit={(event) => {
                  event.preventDefault();
                  if (companyUrl.trim()) onLinkCompany?.(companyUrl.trim());
                }}
              >
                <Input
                  value={companyUrl}
                  placeholder="linkedin.com/company/"
                  aria-label="Company page address"
                  className="bg-imagine-surface"
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
            <div className="flex items-center gap-m py-xs">
              <Icon
                name="file-lines"
                size="s"
                className="text-imagine-foreground-faint"
              />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate type-small font-medium">
                  {profile.persona.fileName}
                </span>
                <span className="truncate type-small text-imagine-foreground-muted">
                  {profile.persona.updated}
                </span>
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

        <div className="mt-auto flex items-center justify-between pt-l">
          <Button variant="ghost" size="sm" onClick={onIndexPosts}>
            <Icon name="arrows-rotate" size="s" data-icon="inline-start" />
            Index posts
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={onRemove}
          >
            Remove
          </Button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
