"use client";

import {
  createContext,
  useContext,
  type DragEvent,
  type ReactNode,
} from "react";

import type { FileMoveDest } from "@/components/features/files/file-move";
import type {
  BrowserItem,
  MediaItem,
  Place,
} from "@/components/features/files/files-library-types";
import {
  LibraryCardDocument,
  LibraryCardDraggable,
  LibraryCardDropTarget,
  LibraryCardFolder,
  LibraryCardMedia,
  LibraryCardMenu,
  LibraryCardMenuDestructiveItem,
  LibraryCardMenuItem,
  LibraryCardMenuSeparator,
  LibraryCardRow,
} from "@/components/features/files/library-card";
import { Stagger, StaggerItem } from "@/components/motion/stagger";

function GroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="type-small font-medium text-imagine-foreground-muted">
      {children}
    </h3>
  );
}

/* ------------------------------------------------------------------------ */
/* Cards                                                                    */
/* ------------------------------------------------------------------------ */

type MoveHandler = (event: DragEvent<HTMLElement>) => void;

/** What every card in the browser can do, supplied by the page. */
export interface BrowserApi {
  draggingId: string | null;
  dropTargetId: string | null;
  press: (item: BrowserItem) => void;
  open: (item: BrowserItem) => void;
  send: (item: BrowserItem) => void;
  rename: (item: BrowserItem) => void;
  remove: (item: BrowserItem) => void;
  startMove: (item: BrowserItem, event: DragEvent<HTMLElement>) => void;
  endMove: () => void;
  overMoveDest: (dest: FileMoveDest, key: string) => MoveHandler;
  leaveMoveDest: (key: string) => MoveHandler;
  dropMoveDest: (dest: FileMoveDest) => MoveHandler;
}

export const BrowserContext = createContext<BrowserApi | null>(null);

function useBrowser(): BrowserApi {
  const context = useContext(BrowserContext);
  if (context === null) throw new Error("Cards belong inside FilesLibrary");
  return context;
}

/** Picks the item up to move it somewhere else. */
function MovableItem({
  item,
  children,
}: {
  item: BrowserItem;
  children: ReactNode;
}) {
  const browser = useBrowser();
  return (
    <LibraryCardDraggable
      dragging={browser.draggingId === item.id}
      onDragStart={(event) => {
        browser.startMove(item, event);
      }}
      onDragEnd={browser.endMove}
    >
      {children}
    </LibraryCardDraggable>
  );
}

/** Catches an item dropped on a library or folder card. */
function ItemDropTarget({
  item,
  dest,
  children,
}: {
  item: BrowserItem;
  dest: FileMoveDest;
  children: ReactNode;
}) {
  const browser = useBrowser();
  return (
    <LibraryCardDropTarget
      active={browser.dropTargetId === item.id}
      onDragOver={browser.overMoveDest(dest, item.id)}
      onDragLeave={browser.leaveMoveDest(item.id)}
      onDrop={browser.dropMoveDest(dest)}
    >
      {children}
    </LibraryCardDropTarget>
  );
}

function FolderMenu({ item }: { item: BrowserItem }) {
  const browser = useBrowser();
  return (
    <LibraryCardMenu>
      <LibraryCardMenuItem
        icon="pen"
        onSelect={() => {
          browser.rename(item);
        }}
      >
        Rename
      </LibraryCardMenuItem>
      <LibraryCardMenuSeparator />
      <LibraryCardMenuDestructiveItem
        icon="trash"
        onSelect={() => {
          browser.remove(item);
        }}
      >
        Delete
      </LibraryCardMenuDestructiveItem>
    </LibraryCardMenu>
  );
}

function DocumentMenu({ item }: { item: BrowserItem }) {
  const browser = useBrowser();
  return (
    <LibraryCardMenu>
      <LibraryCardMenuItem
        icon="file-lines"
        onSelect={() => {
          browser.open(item);
        }}
      >
        Open
      </LibraryCardMenuItem>
      <LibraryCardMenuItem
        icon="imagine"
        onSelect={() => {
          browser.send(item);
        }}
      >
        Send to agent
      </LibraryCardMenuItem>
      <LibraryCardMenuItem
        icon="pen"
        onSelect={() => {
          browser.rename(item);
        }}
      >
        Rename
      </LibraryCardMenuItem>
      <LibraryCardMenuSeparator />
      <LibraryCardMenuDestructiveItem
        icon="trash"
        onSelect={() => {
          browser.remove(item);
        }}
      >
        Delete
      </LibraryCardMenuDestructiveItem>
    </LibraryCardMenu>
  );
}

function MediaMenu({ item }: { item: BrowserItem }) {
  const browser = useBrowser();
  return (
    <LibraryCardMenu>
      <LibraryCardMenuItem
        icon="imagine"
        onSelect={() => {
          browser.send(item);
        }}
      >
        Send to agent
      </LibraryCardMenuItem>
      <LibraryCardMenuSeparator />
      <LibraryCardMenuDestructiveItem
        icon="trash"
        onSelect={() => {
          browser.remove(item);
        }}
      >
        Delete
      </LibraryCardMenuDestructiveItem>
    </LibraryCardMenu>
  );
}

/**
 * How an item behaves where it sits, which is the same whichever way the
 * browser draws it: a library at the root takes drops but stays put, a folder
 * inside one also moves, and documents and images only move.
 */
function ItemFrame({
  item,
  place,
  children,
}: {
  item: BrowserItem;
  place: Place;
  children: ReactNode;
}) {
  if (place.kind === "root") {
    return (
      <ItemDropTarget item={item} dest={{ sectionId: item.id }}>
        {children}
      </ItemDropTarget>
    );
  }
  if (item.kind === "folder") {
    return (
      <MovableItem item={item}>
        <ItemDropTarget
          item={item}
          dest={{ sectionId: place.sectionId, folderId: item.id }}
        >
          {children}
        </ItemDropTarget>
      </MovableItem>
    );
  }
  return <MovableItem item={item}>{children}</MovableItem>;
}

/** A labelled run of cards, laid out however the view arranges them. */
function CardGroup({
  label,
  arrangement,
  children,
}: {
  label: string;
  arrangement: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-s">
      <GroupLabel>{label}</GroupLabel>
      <Stagger kind="grid" className={arrangement}>
        {children}
      </Stagger>
    </div>
  );
}

interface BrowserContentProps {
  place: Place;
  folders: readonly BrowserItem[];
  docs: readonly BrowserItem[];
  media: readonly MediaItem[];
}

const ROWS = "flex flex-col gap-px";
const TILES =
  "grid grid-cols-[repeat(auto-fill,minmax(min(100%,12rem),1fr))] gap-m";

/** Everything in the open location as one name per line. */
export function BrowserRows({
  place,
  folders,
  docs,
  media,
}: BrowserContentProps) {
  const browser = useBrowser();
  const press = (item: BrowserItem) => () => {
    browser.press(item);
  };

  return (
    <>
      {folders.length > 0 ? (
        <CardGroup
          label={place.kind === "root" ? "Libraries" : "Folders"}
          arrangement={ROWS}
        >
          {folders.map((item) => (
            <StaggerItem key={item.id}>
              <ItemFrame item={item} place={place}>
                <LibraryCardRow
                  kind="folder"
                  name={item.name}
                  onPress={press(item)}
                >
                  {/* A library at the root has no menu: it is not the
                      user's to rename or delete from here. */}
                  {place.kind === "root" ? null : <FolderMenu item={item} />}
                </LibraryCardRow>
              </ItemFrame>
            </StaggerItem>
          ))}
        </CardGroup>
      ) : null}

      {docs.length > 0 ? (
        <CardGroup label="Documents" arrangement={ROWS}>
          {docs.map((item) => (
            <StaggerItem key={item.id}>
              <ItemFrame item={item} place={place}>
                <LibraryCardRow
                  kind="document"
                  name={item.name}
                  onPress={press(item)}
                >
                  <DocumentMenu item={item} />
                </LibraryCardRow>
              </ItemFrame>
            </StaggerItem>
          ))}
        </CardGroup>
      ) : null}

      {media.length > 0 ? (
        <CardGroup label="Images" arrangement={ROWS}>
          {media.map((item) => (
            <StaggerItem key={item.id}>
              <ItemFrame item={item} place={place}>
                <LibraryCardRow
                  kind={item.kind}
                  name={item.name}
                  onPress={press(item)}
                >
                  <MediaMenu item={item} />
                </LibraryCardRow>
              </ItemFrame>
            </StaggerItem>
          ))}
        </CardGroup>
      ) : null}
    </>
  );
}

/** Everything in the open location as cards with a face. */
export function BrowserTiles({
  place,
  folders,
  docs,
  media,
}: BrowserContentProps) {
  const browser = useBrowser();
  const press = (item: BrowserItem) => () => {
    browser.press(item);
  };

  return (
    <>
      {folders.length > 0 ? (
        <CardGroup
          label={place.kind === "root" ? "Libraries" : "Folders"}
          arrangement={TILES}
        >
          {folders.map((item) => (
            <StaggerItem key={item.id}>
              <ItemFrame item={item} place={place}>
                <LibraryCardFolder name={item.name} onPress={press(item)}>
                  {place.kind === "root" ? null : <FolderMenu item={item} />}
                </LibraryCardFolder>
              </ItemFrame>
            </StaggerItem>
          ))}
        </CardGroup>
      ) : null}

      {docs.length > 0 ? (
        <CardGroup label="Documents" arrangement={TILES}>
          {docs.map((item) => (
            <StaggerItem key={item.id}>
              <ItemFrame item={item} place={place}>
                <LibraryCardDocument
                  name={item.name}
                  {...(item.excerpt === undefined
                    ? {}
                    : { excerpt: item.excerpt })}
                  onPress={press(item)}
                >
                  <DocumentMenu item={item} />
                </LibraryCardDocument>
              </ItemFrame>
            </StaggerItem>
          ))}
        </CardGroup>
      ) : null}

      {media.length > 0 ? (
        <CardGroup label="Images" arrangement={TILES}>
          {media.map((item) => (
            <StaggerItem key={item.id}>
              <ItemFrame item={item} place={place}>
                <LibraryCardMedia
                  kind={item.kind}
                  name={item.name}
                  {...(item.src === undefined ? {} : { src: item.src })}
                  onPress={press(item)}
                >
                  <MediaMenu item={item} />
                </LibraryCardMedia>
              </ItemFrame>
            </StaggerItem>
          ))}
        </CardGroup>
      ) : null}
    </>
  );
}
