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

interface ProfileDetailProps {
  /** Which profile is showing; changing it cross-fades the whole pane. */
  profileId: string;
  className?: string;
  children: React.ReactNode;
}

/**
 * The detail pane beside the profile list: a raised (grey) panel that callers
 * fill with a header, `ProfileDetailFacts`, the Company and Persona groups,
 * and `ProfileDetailFooter`. Callers shape the panel's edges. One instance
 * cross-fades between profiles by `profileId`.
 */
export function ProfileDetail({
  profileId,
  className,
  children,
}: ProfileDetailProps) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={profileId}
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
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

interface HeaderProps {
  name: string;
  headline: string;
  avatarUrl?: string;
}

function Header({
  name,
  headline,
  children,
}: Pick<HeaderProps, "name" | "headline"> & { children: React.ReactNode }) {
  return (
    <header className="flex items-center gap-m">
      {children}
      <div className="flex min-w-0 flex-col">
        <span className="truncate type-heading">{name}</span>
        <span className="truncate type-small text-imagine-foreground-muted">
          {headline}
        </span>
      </div>
    </header>
  );
}

/** A person: round avatar, initials when there is no photo. */
export function ProfileDetailPersonHeader({
  name,
  headline,
  avatarUrl,
}: HeaderProps) {
  return (
    <Header name={name} headline={headline}>
      <Avatar size="lg">
        {avatarUrl ? <AvatarImage src={avatarUrl} alt={name} /> : null}
        <AvatarFallback>{initials(name)}</AvatarFallback>
      </Avatar>
    </Header>
  );
}

/** A company page: square logo, the building mark when there is none. */
export function ProfileDetailCompanyHeader({
  name,
  headline,
  avatarUrl,
}: HeaderProps) {
  return (
    <Header name={name} headline={headline}>
      <Avatar size="lg" shape="square">
        {avatarUrl ? <AvatarImage src={avatarUrl} alt={name} /> : null}
        <AvatarFallback>
          <Icon name="building" />
        </AvatarFallback>
      </Avatar>
    </Header>
  );
}

/** The key facts, one `Row` per line. */
export function ProfileDetailFacts({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="flex flex-col">{children}</div>;
}

interface ProfileDetailConnectionProps {
  status: ConnectionStatus;
  /** An action beside the badge, e.g. `ProfileDetailReconnectButton`. */
  children?: React.ReactNode;
}

export function ProfileDetailConnection({
  status,
  children,
}: ProfileDetailConnectionProps) {
  return (
    <Row label="Connection">
      <Badge variant={status === "connected" ? "success" : "soft"}>
        {CONNECTION_LABEL[status]}
      </Badge>
      {children}
    </Row>
  );
}

export function ProfileDetailReconnectButton({
  onClick,
}: {
  onClick: () => void;
}) {
  return (
    <Button
      size="xs"
      variant="soft"
      className="bg-imagine-surface"
      onClick={onClick}
    >
      Reconnect
    </Button>
  );
}

export function ProfileDetailFirstConnected({
  connectedAt,
}: {
  /** ISO time; absent until they connect. */
  connectedAt?: string;
}) {
  return (
    <Row label="First connected">
      {connectedAt === undefined ? "Not yet" : formatDayMonthYear(connectedAt)}
    </Row>
  );
}

export function ProfileDetailPostsIndexed({ count }: { count: number }) {
  return (
    <Row label="Posts indexed">
      <AnimatePresence initial={false} mode="popLayout">
        <motion.span
          key={count}
          {...swapUp}
          transition={fade.fast}
          className="tabular-nums"
        >
          {count}
        </motion.span>
      </AnimatePresence>
    </Row>
  );
}

/** The Company group; fill with `ProfileDetailCompanyCard` or the link form. */
export function ProfileDetailCompany({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Group title="Company">{children}</Group>;
}

interface ProfileDetailCompanyCardProps {
  company: NonNullable<ProfileDetailData["company"]>;
  onChange: () => void;
}

export function ProfileDetailCompanyCard({
  company,
  onChange,
}: ProfileDetailCompanyCardProps) {
  return (
    <div className={CARD}>
      <Avatar size="sm" shape="square">
        {company.logoUrl ? (
          <AvatarImage src={company.logoUrl} alt={company.name} />
        ) : null}
        <AvatarFallback>
          <Icon name="building" size="s" />
        </AvatarFallback>
      </Avatar>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate type-small font-medium">{company.name}</span>
        <span className="truncate type-small text-imagine-foreground-muted">
          {company.url}
        </span>
      </span>
      <Button size="xs" variant="ghost" onClick={onChange}>
        Change
      </Button>
    </div>
  );
}

/** No company yet: paste the page address to link one. */
export function ProfileDetailLinkCompanyForm({
  onLink,
}: {
  onLink: (url: string) => void;
}) {
  const [companyUrl, setCompanyUrl] = useState("");

  return (
    <form
      className="flex min-w-0 flex-col gap-s sm:flex-row sm:items-center"
      onSubmit={(event) => {
        event.preventDefault();
        if (companyUrl.trim()) onLink(companyUrl.trim());
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
  );
}

/** The Persona group; fill with `ProfileDetailPersonaCard` or the empty note. */
export function ProfileDetailPersona({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Group title="Persona">{children}</Group>;
}

export function ProfileDetailPersonaCard({
  fileName,
  onView,
}: {
  fileName: string;
  onView: () => void;
}) {
  return (
    <div className={CARD}>
      <Icon
        name="file-lines"
        size="s"
        className="text-imagine-foreground-faint"
      />
      <span className="min-w-0 flex-1 truncate type-small font-medium">
        {fileName}
      </span>
      <Button size="xs" variant="ghost" onClick={onView}>
        View in Files
      </Button>
    </div>
  );
}

export function ProfileDetailPersonaEmpty() {
  return (
    <p className="type-small text-imagine-foreground-muted">
      No persona yet. The agent writes one after indexing posts.
    </p>
  );
}

/** Pinned to the bottom: the routine action left, the destructive one right. */
export function ProfileDetailFooter({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mt-auto flex flex-wrap items-center justify-between gap-s border-t border-imagine-border pt-l">
      {children}
    </div>
  );
}

interface ProfileDetailIndexPostsButtonProps {
  /** Indexing is running; the button shows it and cannot start another. */
  indexing?: boolean;
  onClick: () => void;
}

export function ProfileDetailIndexPostsButton({
  indexing = false,
  onClick,
}: ProfileDetailIndexPostsButtonProps) {
  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={indexing}
      aria-busy={indexing}
      onClick={onClick}
    >
      {indexing ? (
        <Spinner size="s" data-icon="inline-start" />
      ) : (
        <Icon name="arrows-rotate" size="s" data-icon="inline-start" />
      )}
      {indexing ? "Indexing" : "Index posts"}
    </Button>
  );
}

interface ProfileDetailRemoveButtonProps {
  /** Named in the confirmation. */
  name: string;
  /** Called once the user has confirmed. */
  onRemove: () => void;
}

export function ProfileDetailRemoveButton({
  name,
  onRemove,
}: ProfileDetailRemoveButtonProps) {
  return (
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
          <AlertDialogTitle>Remove {name}?</AlertDialogTitle>
          <AlertDialogDescription>
            The agent stops posting as this profile and its scheduled posts are
            unscheduled. Published posts stay on LinkedIn.
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
  );
}
