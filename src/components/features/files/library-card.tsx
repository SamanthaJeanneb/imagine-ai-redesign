"use client";

import { cn } from "cn";
import { motion } from "motion/react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icon, type IconName } from "@/components/ui/icon";
import { hoverLift, pressRow } from "@/styles/motion";

export type LibraryCardKind = "folder" | "document" | "image" | "video";

export type LibraryCardView = "grid" | "list";

export interface LibraryCardAction {
  id: string;
  label: string;
  icon?: IconName;
  destructive?: boolean;
}

interface LibraryCardProps {
  kind: LibraryCardKind;
  name: string;
  /** A second line: what is inside a folder, or where a file lives. */
  meta?: string;
  /** Document preview: its opening lines. */
  excerpt?: string;
  /** Image and video preview. */
  src?: string;
  /** Read by the agent (documents) or attached to a post (media). */
  inUse?: boolean;
  selected?: boolean;
  view?: LibraryCardView;
  /** Click. Folders navigate; files select. */
  onPress: () => void;
  /** Double click or Enter on a file. Omit when pressing already opens it. */
  onOpen?: () => void;
  actions?: readonly LibraryCardAction[];
  onAction?: (id: string) => void;
  className?: string;
}

const KIND_ICON: Record<LibraryCardKind, IconName> = {
  folder: "folder",
  document: "file-lines",
  image: "image",
  video: "video",
};

const KIND_LABEL: Record<LibraryCardKind, string> = {
  folder: "Folder",
  document: "Document",
  image: "Image",
  video: "Video",
};

function ActionsMenu({
  name,
  actions,
  onAction,
  className,
}: {
  name: string;
  actions: readonly LibraryCardAction[];
  onAction?: (id: string) => void;
  className?: string;
}) {
  const plain = actions.filter((action) => !action.destructive);
  const destructive = actions.filter((action) => action.destructive);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="icon-xs"
          variant="ghost"
          aria-label={`Actions for ${name}`}
          className={cn(
            "size-7 text-imagine-foreground-faint hover:text-imagine-foreground data-open:text-imagine-foreground",
            className,
          )}
        >
          <Icon name="ellipsis" size="s" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44 p-xs">
        {plain.map((action) => (
          <DropdownMenuItem
            key={action.id}
            onSelect={() => onAction?.(action.id)}
            className="h-8 gap-s px-s"
          >
            {action.icon === undefined ? null : (
              <Icon
                name={action.icon}
                size="s"
                className="text-imagine-foreground-muted"
              />
            )}
            {action.label}
          </DropdownMenuItem>
        ))}
        {destructive.length > 0 && plain.length > 0 ? (
          <DropdownMenuSeparator className="my-xs bg-imagine-border" />
        ) : null}
        {destructive.map((action) => (
          <DropdownMenuItem
            key={action.id}
            variant="destructive"
            onSelect={() => onAction?.(action.id)}
            className="h-8 gap-s px-s"
          >
            {action.icon === undefined ? null : (
              <Icon name={action.icon} size="s" />
            )}
            {action.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** The document card's face: its first lines, fading out before the footer. */
function DocumentPreview({ excerpt }: { excerpt?: string }) {
  const lines = excerpt === undefined ? [] : excerpt.split("\n");
  return (
    <span
      aria-hidden="true"
      className="relative flex aspect-[7/4] w-full flex-col gap-xs overflow-hidden rounded-t-panel bg-imagine-surface-raised/70 px-m pt-m"
    >
      {lines.length === 0 ? (
        <span className="mt-auto mb-m flex items-center justify-center text-imagine-foreground-faint">
          <Icon name="file-lines" size="xl" />
        </span>
      ) : (
        lines.map((line, index) => (
          <span
            key={index}
            className={cn(
              "block truncate text-xs leading-5",
              index === 0
                ? "font-semibold text-imagine-foreground"
                : "text-imagine-foreground-muted",
            )}
          >
            {line}
          </span>
        ))
      )}
      <span className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-linear-to-b from-transparent to-imagine-surface-raised/70" />
    </span>
  );
}

function MediaPreview({ kind, src }: { kind: "image" | "video"; src?: string }) {
  return (
    <span className="relative block aspect-[7/4] w-full overflow-hidden rounded-t-panel bg-imagine-surface-raised">
      {src === undefined ? (
        <span className="flex size-full items-center justify-center text-imagine-foreground-faint">
          <Icon name={KIND_ICON[kind]} size="xl" />
        </span>
      ) : (
        // Mock media comes from arbitrary hosts; next/image needs a domain list.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          loading="lazy"
          className="size-full object-cover transition-transform duration-300 ease-out group-hover/card:scale-[1.03]"
        />
      )}
      {kind === "video" && src !== undefined ? (
        <span className="absolute right-s bottom-s flex size-6 items-center justify-center rounded-control bg-imagine-foreground/70 text-imagine-primary-foreground">
          <Icon name="video" size="s" active />
        </span>
      ) : null}
    </span>
  );
}

/**
 * One item in the browser. Folders are a single line; documents and media
 * show a face above their name. In list view every kind is a row. The menu
 * appears on hover; "In use" stays, because it is information.
 */
export function LibraryCard({
  kind,
  name,
  meta,
  excerpt,
  src,
  inUse = false,
  selected = false,
  view = "grid",
  onPress,
  onOpen,
  actions,
  onAction,
  className,
}: LibraryCardProps) {
  const row = view === "list" || kind === "folder";
  const hasMenu = actions !== undefined && actions.length > 0;

  const footer = (
    <span
      className={cn(
        "flex min-w-0 items-center gap-s",
        row ? "h-11 flex-1 px-s" : "h-10 px-s",
      )}
    >
      <span className="flex size-6 shrink-0 items-center justify-center text-imagine-foreground-muted">
        <Icon name={KIND_ICON[kind]} size="s" active={kind === "folder"} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate type-small font-medium">{name}</span>
        {row && meta !== undefined ? (
          <span className="truncate text-xs text-imagine-foreground-faint">
            {meta}
          </span>
        ) : null}
      </span>
      {view === "list" ? (
        <span className="hidden w-20 shrink-0 text-xs text-imagine-foreground-faint @3xl:inline">
          {KIND_LABEL[kind]}
        </span>
      ) : null}
      {inUse ? (
        <Badge variant="soft" className="h-5 shrink-0 px-1.5">
          In use
        </Badge>
      ) : null}
      {hasMenu ? <span aria-hidden="true" className="w-7 shrink-0" /> : null}
    </span>
  );

  return (
    <motion.div
      data-slot="library-card"
      data-kind={kind}
      data-view={view}
      data-selected={selected || undefined}
      whileHover={hoverLift.whileHover}
      whileTap={pressRow.whileTap}
      transition={pressRow.transition}
      className={cn(
        "group/card relative min-w-0 transition-[background-color,border-color,box-shadow]",
        row
          ? "rounded-panel border border-imagine-border hover:bg-imagine-surface-raised/60"
          : "rounded-panel border border-imagine-border bg-imagine-surface hover:shadow-raised",
        view === "list" && "rounded-control border-transparent",
        selected && "border-imagine-foreground shadow-control",
        className,
      )}
    >
      <button
        type="button"
        aria-pressed={onOpen === undefined ? undefined : selected}
        onClick={onPress}
        onDoubleClick={onOpen}
        onKeyDown={(event) => {
          if (event.key === "Enter" && onOpen !== undefined) {
            event.preventDefault();
            onOpen();
          }
        }}
        className={cn(
          "flex w-full min-w-0 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
          row
            ? "items-center rounded-panel"
            : "flex-col rounded-panel",
          view === "list" && "rounded-control",
        )}
      >
        {row ? null : kind === "document" ? (
          <DocumentPreview excerpt={excerpt} />
        ) : (
          <MediaPreview kind={kind} src={src} />
        )}
        {footer}
      </button>
      {hasMenu ? (
        <span
          className={cn(
            "absolute right-xs flex opacity-0 transition-opacity group-focus-within/card:opacity-100 group-hover/card:opacity-100 has-[[data-state=open]]:opacity-100",
            row ? "top-1/2 -translate-y-1/2" : "bottom-1.5",
          )}
        >
          <ActionsMenu name={name} actions={actions} onAction={onAction} />
        </span>
      ) : null}
    </motion.div>
  );
}
