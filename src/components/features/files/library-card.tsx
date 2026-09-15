"use client";

import { cn } from "cn";
import { motion } from "motion/react";
import {
  createContext,
  useContext,
  type DragEvent,
  type ReactNode,
} from "react";

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

const KIND_ICON: Record<LibraryCardKind, IconName> = {
  folder: "folder",
  document: "file-lines",
  image: "image",
  video: "video",
};

/* ------------------------------------------------------------------------ */
/* Moving: wrap a card to drag it, or to catch what is dragged onto it      */
/* ------------------------------------------------------------------------ */

const DragContext = createContext<{ dragging: boolean } | null>(null);
const DropContext = createContext<{ active: boolean } | null>(null);

/**
 * Makes the card inside a native drag source, so it can be moved to a folder
 * in the library. Plain element: motion's own drag props never see it.
 */
export function LibraryCardDraggable({
  dragging = false,
  onDragStart,
  onDragEnd,
  className,
  children,
}: {
  /** This card is the one in flight; it fades and stops reacting to hover. */
  dragging?: boolean;
  onDragStart: (event: DragEvent<HTMLElement>) => void;
  onDragEnd: (event: DragEvent<HTMLElement>) => void;
  className?: string;
  children: ReactNode;
}) {
  return (
    <DragContext value={{ dragging }}>
      <div
        draggable
        data-slot="library-card-draggable"
        data-dragging={dragging || undefined}
        onDragStart={(event) => {
          event.stopPropagation();
          onDragStart(event);
        }}
        onDragEnd={onDragEnd}
        className={cn("min-w-0 cursor-grab active:cursor-grabbing", className)}
      >
        {children}
      </div>
    </DragContext>
  );
}

/** Lets a folder card accept a dragged file; `active` lights it up. */
export function LibraryCardDropTarget({
  active = false,
  onDragOver,
  onDragLeave,
  onDrop,
  className,
  children,
}: {
  active?: boolean;
  onDragOver: (event: DragEvent<HTMLElement>) => void;
  onDragLeave: (event: DragEvent<HTMLElement>) => void;
  onDrop: (event: DragEvent<HTMLElement>) => void;
  className?: string;
  children: ReactNode;
}) {
  return (
    <DropContext value={{ active }}>
      <div
        data-slot="library-card-drop-target"
        data-drop-active={active || undefined}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={cn("min-w-0", className)}
      >
        {children}
      </div>
    </DropContext>
  );
}

/* ------------------------------------------------------------------------ */
/* Menu                                                                     */
/* ------------------------------------------------------------------------ */

const NameContext = createContext("");

/**
 * The card's actions, revealed on hover. Children are `LibraryCardMenuItem`,
 * `LibraryCardMenuSeparator`, and `LibraryCardMenuDestructiveItem`.
 */
export function LibraryCardMenu({ children }: { children: ReactNode }) {
  const name = useContext(NameContext);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="icon-xs"
          variant="ghost"
          aria-label={`Actions for ${name}`}
          className="size-7 text-imagine-foreground-faint hover:text-imagine-foreground data-open:text-imagine-foreground"
        >
          <Icon name="ellipsis" size="s" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44 p-xs">
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface LibraryCardMenuItemProps {
  icon?: IconName;
  onSelect: () => void;
  children: ReactNode;
}

export function LibraryCardMenuItem({
  icon,
  onSelect,
  children,
}: LibraryCardMenuItemProps) {
  return (
    <DropdownMenuItem onSelect={onSelect} className="h-8 gap-s px-s">
      {icon === undefined ? null : (
        <Icon name={icon} size="s" className="text-imagine-foreground-muted" />
      )}
      {children}
    </DropdownMenuItem>
  );
}

export function LibraryCardMenuDestructiveItem({
  icon,
  onSelect,
  children,
}: LibraryCardMenuItemProps) {
  return (
    <DropdownMenuItem
      variant="destructive"
      onSelect={onSelect}
      className="h-8 gap-s px-s"
    >
      {icon === undefined ? null : <Icon name={icon} size="s" />}
      {children}
    </DropdownMenuItem>
  );
}

export function LibraryCardMenuSeparator() {
  return <DropdownMenuSeparator className="my-xs bg-imagine-border" />;
}

/* ------------------------------------------------------------------------ */
/* Shared internals                                                         */
/* ------------------------------------------------------------------------ */

/** The document card's face: its first lines, fading out before the footer. */
function DocumentPreview({ excerpt }: { excerpt?: string }) {
  const lines = excerpt === undefined ? [] : excerpt.split("\n");
  return (
    <span
      aria-hidden="true"
      className="relative flex aspect-[7/4] w-full flex-col gap-xs overflow-hidden rounded-t-control bg-imagine-surface-raised/70 px-m pt-m"
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

function MediaPreview({
  kind,
  src,
}: {
  kind: "image" | "video";
  src?: string;
}) {
  return (
    <span className="relative block aspect-[7/4] w-full overflow-hidden rounded-t-control bg-imagine-surface-raised">
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

/** Icon and name under a face, or the whole of a row. */
function Footer({
  kind,
  name,
  row,
  reserveMenu,
}: {
  kind: LibraryCardKind;
  name: string;
  row: boolean;
  reserveMenu: boolean;
}) {
  return (
    <span
      className={cn(
        "flex min-w-0 items-center gap-s",
        row ? "h-11 flex-1 px-s" : "h-10 px-s",
      )}
    >
      <span className="flex size-6 shrink-0 items-center justify-center text-imagine-foreground-muted">
        <Icon name={KIND_ICON[kind]} size="s" active={kind === "folder"} />
      </span>
      <span className="min-w-0 flex-1 truncate type-small font-medium">
        {name}
      </span>
      {reserveMenu ? (
        <span aria-hidden="true" className="w-7 shrink-0" />
      ) : null}
    </span>
  );
}

interface ShellProps {
  kind: LibraryCardKind;
  view: LibraryCardView;
  name: string;
  selected: boolean;
  onPress: () => void;
  /** Rendered above the footer in a grid card. */
  face?: ReactNode;
  /** The menu, if any. */
  children?: ReactNode;
  className?: string;
}

/**
 * The card's box, press target, and hover menu slot. A row when it is a
 * folder or the list is in list view; otherwise a face over a footer.
 */
function Shell({
  kind,
  view,
  name,
  selected,
  onPress,
  face,
  children,
  className,
}: ShellProps) {
  const drag = useContext(DragContext);
  const drop = useContext(DropContext);
  const dragging = drag?.dragging ?? false;
  const dropActive = drop?.active ?? false;
  const row = face === undefined;
  const hasMenu = children !== undefined && children !== null;

  return (
    <NameContext value={name}>
      <motion.div
        data-slot="library-card"
        data-kind={kind}
        data-view={view}
        data-selected={selected || undefined}
        data-drop-active={dropActive || undefined}
        whileHover={dragging ? undefined : hoverLift.whileHover}
        whileTap={dragging ? undefined : pressRow.whileTap}
        transition={pressRow.transition}
        className={cn(
          "group/card relative min-w-0 transition-[background-color,border-color,box-shadow]",
          "rounded-control border border-imagine-border",
          row
            ? "hover:bg-imagine-surface-raised/60"
            : "bg-imagine-surface hover:shadow-raised",
          view === "list" && "border-transparent",
          selected && "border-imagine-foreground shadow-control",
          dragging && "opacity-40",
          dropActive &&
            "border-imagine-secondary bg-imagine-secondary-soft shadow-none",
          className,
        )}
      >
        <button
          type="button"
          // Some browsers only start a drag from the element under the pointer.
          draggable={drag === null ? undefined : true}
          onClick={onPress}
          className={cn(
            "flex w-full min-w-0 rounded-control text-left outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
            row ? "items-center" : "flex-col",
          )}
        >
          {face}
          <Footer kind={kind} name={name} row={row} reserveMenu={hasMenu} />
        </button>
        {hasMenu ? (
          <span
            className={cn(
              "absolute right-xs flex opacity-0 transition-opacity group-focus-within/card:opacity-100 group-hover/card:opacity-100 has-[[data-state=open]]:opacity-100",
              row ? "top-1/2 -translate-y-1/2" : "bottom-1.5",
            )}
          >
            {children}
          </span>
        ) : null}
      </motion.div>
    </NameContext>
  );
}

/* ------------------------------------------------------------------------ */
/* Cards                                                                    */
/* ------------------------------------------------------------------------ */

interface CardProps {
  name: string;
  selected?: boolean;
  /** Click. Folders navigate; files select. */
  onPress: () => void;
  /** A `LibraryCardMenu`. */
  children?: ReactNode;
  className?: string;
}

/** A folder in the grid: a single line, no face. */
export function LibraryCardFolder({
  name,
  selected = false,
  onPress,
  children,
  className,
}: CardProps) {
  return (
    <Shell
      kind="folder"
      view="grid"
      name={name}
      selected={selected}
      onPress={onPress}
      className={className}
    >
      {children}
    </Shell>
  );
}

/** A document in the grid: its opening lines over its name. */
export function LibraryCardDocument({
  name,
  excerpt,
  selected = false,
  onPress,
  children,
  className,
}: CardProps & {
  /** The document's opening lines. */
  excerpt?: string;
}) {
  return (
    <Shell
      kind="document"
      view="grid"
      name={name}
      selected={selected}
      onPress={onPress}
      face={<DocumentPreview excerpt={excerpt} />}
      className={className}
    >
      {children}
    </Shell>
  );
}

/** An image or video in the grid: the picture over its name. */
export function LibraryCardMedia({
  kind,
  name,
  src,
  selected = false,
  onPress,
  children,
  className,
}: CardProps & {
  kind: "image" | "video";
  src?: string;
}) {
  return (
    <Shell
      kind={kind}
      view="grid"
      name={name}
      selected={selected}
      onPress={onPress}
      face={<MediaPreview kind={kind} src={src} />}
      className={className}
    >
      {children}
    </Shell>
  );
}

/** Any item in list view: icon, name, and the menu at the row's end. */
export function LibraryCardRow({
  kind,
  name,
  selected = false,
  onPress,
  children,
  className,
}: CardProps & { kind: LibraryCardKind }) {
  return (
    <Shell
      kind={kind}
      view="list"
      name={name}
      selected={selected}
      onPress={onPress}
      className={className}
    >
      {children}
    </Shell>
  );
}
