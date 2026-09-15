"use client";

import { cn } from "cn";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type DragEvent,
  type ReactNode,
} from "react";
import { toast } from "sonner";

import type { AssetTileData } from "@/components/features/files/asset-tile";
import {
  searchFiles,
  searchSkills,
  toSearchResults,
} from "@/components/features/files/file-search";
import type {
  FileNode,
  FileSection,
} from "@/components/features/files/file-tree";
import {
  findFolder,
  insertAsset,
  insertNode,
  leaves,
  mapNodes,
  removeAsset,
} from "@/components/features/files/file-tree-ops";
import {
  beginFileMove,
  canMoveLibraryItem,
  endFileMove,
  fileMoveId,
  isFileMove,
  isLeavingDropTarget,
  moveLibraryItem,
  preventFileMove,
  type FileMoveDest,
} from "@/components/features/files/file-move";
import {
  MovableFileTreeNav,
  type TreeLocation,
} from "@/components/features/files/file-tree-nav";
import {
  LibraryCardDocument,
  LibraryCardDraggable,
  LibraryCardDropTarget,
  LibraryCardFolder,
  type LibraryCardKind,
  LibraryCardMedia,
  LibraryCardMenu,
  LibraryCardMenuDestructiveItem,
  LibraryCardMenuItem,
  LibraryCardMenuSeparator,
  LibraryCardRow,
  type LibraryCardView,
} from "@/components/features/files/library-card";
import { MarkdownEditor } from "@/components/features/files/markdown-editor";
import { NewMenu } from "@/components/features/files/new-menu";
import type { DraggableResource } from "@/components/features/files/resource-drag";
import {
  type Skill,
  SkillsList,
} from "@/components/features/files/skills-list";
import { Stagger, StaggerItem } from "@/components/motion/stagger";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbMenu,
  type BreadcrumbMenuItem,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Chip, ChipGroup } from "@/components/ui/chip-group";
import {
  Dialog,
  DialogCloseButton,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Field, FieldLabel } from "@/components/ui/field";
import { Icon, type IconName } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { ResizeHandle } from "@/components/ui/resize-handle";
import { SearchBox } from "@/components/ui/search-box";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { MOBILE_QUERY, useMediaQuery } from "@/lib/use-media-query";
import { useResizable } from "@/lib/use-resizable";
import type { OpenDocument } from "@/services/files";
import { fade, spring } from "@/styles/motion";

interface FilesLibraryProps {
  /** Workspace name, the organization library's title. */
  title: string;
  sections: readonly FileSection[];
  skills: readonly Skill[];
  documents: readonly OpenDocument[];
  /** Attach the resource to the chat and go there. Omit to hide the action. */
  onSendToChat?: (resource: DraggableResource) => void;
  className?: string;
}

/** What the browser is looking at. */
type Place =
  { kind: "root" } | { kind: "library"; sectionId: string; folderId?: string };

type Tab = "files" | "skills";
type Filter = "all" | "documents" | "images";
type Sort = "name-asc" | "name-desc";

/** One thing the browser can show, whatever it came from. */
interface BrowserItem {
  id: string;
  kind: LibraryCardKind;
  name: string;
  excerpt?: string;
  src?: string;
}

type MediaItem = BrowserItem & { kind: "image" | "video" };

/** Enough to put a deleted item back where it was. */
interface RemovedItem {
  name: string;
  sectionId: string;
  folderId?: string;
  payload:
    { type: "node"; node: FileNode } | { type: "asset"; asset: AssetTileData };
}

type DialogState =
  { kind: "new-folder" } | { kind: "rename"; id: string; name: string } | null;

const FILTERS: readonly { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "documents", label: "Documents" },
  { value: "images", label: "Images" },
];

const SORTS: readonly { value: Sort; label: string }[] = [
  { value: "name-asc", label: "Name, A to Z" },
  { value: "name-desc", label: "Name, Z to A" },
];

const SORT_SHORT: Record<Sort, string> = {
  "name-asc": "Name",
  "name-desc": "Name",
};

/* ------------------------------------------------------------------------ */
/* Tree helpers                                                             */
/* ------------------------------------------------------------------------ */

function slug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/* ------------------------------------------------------------------------ */
/* Small pieces                                                             */
/* ------------------------------------------------------------------------ */

function GroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="type-small font-medium text-imagine-foreground-muted">
      {children}
    </h3>
  );
}

function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon: IconName;
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center gap-s text-center">
      <span className="flex size-10 items-center justify-center rounded-panel bg-imagine-surface-raised text-imagine-foreground-muted">
        <Icon name={icon} size="l" />
      </span>
      <p className="type-small font-medium">{title}</p>
      <p className="max-w-xs type-small text-imagine-foreground-muted">
        {body}
      </p>
      {action === undefined ? null : <div className="pt-xs">{action}</div>}
    </div>
  );
}

function deleteCopy(item: BrowserItem): {
  title: string;
  description: string;
} {
  const title = `Delete “${item.name}”?`;
  switch (item.kind) {
    case "folder":
      return {
        title,
        description: "Everything in this folder will be deleted too.",
      };
    case "document":
      return {
        title,
        description: "The agent won't be able to use this document.",
      };
    case "video":
      return {
        title,
        description: "This video will be removed from the library.",
      };
    default:
      return {
        title,
        description: "This image will be removed from the library.",
      };
  }
}

/** Confirm before a file, folder, or image is removed from the library. */
function DeleteConfirmDialog({
  item,
  onConfirm,
  onClose,
}: {
  item: BrowserItem;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const copy = deleteCopy(item);

  return (
    <AlertDialog
      open
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{copy.title}</AlertDialogTitle>
          <AlertDialogDescription>{copy.description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={onConfirm}>
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/** The shared frame for naming something: one field, Enter submits. */
function NameDialog({
  title,
  description,
  initialValue,
  submitLabel,
  onSubmit,
  onClose,
}: {
  title: string;
  description: string;
  initialValue: string;
  submitLabel: string;
  onSubmit: (name: string) => void;
  onClose: () => void;
}) {
  const [value, setValue] = useState(initialValue);
  const trimmed = value.trim();

  return (
    <Dialog
      open
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent className="sm:max-w-sm">
        <form
          className="flex flex-col gap-l"
          onSubmit={(event) => {
            event.preventDefault();
            if (trimmed === "") return;
            onSubmit(trimmed);
          }}
        >
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <Field>
            <FieldLabel htmlFor="files-name">Name</FieldLabel>
            <Input
              id="files-name"
              autoFocus
              value={value}
              onChange={(event) => {
                setValue(event.target.value);
              }}
              onFocus={(event) => {
                event.target.select();
              }}
            />
          </Field>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={trimmed === ""}>
              {submitLabel}
            </Button>
          </DialogFooter>
        </form>
        <DialogCloseButton />
      </DialogContent>
    </Dialog>
  );
}

/** A folder in the browsed location, named before it is made. */
function NewFolderDialog({
  locationTitle,
  onSubmit,
  onClose,
}: {
  locationTitle: string;
  onSubmit: (name: string) => void;
  onClose: () => void;
}) {
  return (
    <NameDialog
      title="New folder"
      description={`Goes into ${locationTitle}.`}
      initialValue="New folder"
      submitLabel="Create"
      onSubmit={onSubmit}
      onClose={onClose}
    />
  );
}

/** Renaming a folder, a document, or an image. Opens on its current name. */
function RenameDialog({
  name,
  onSubmit,
  onClose,
}: {
  name: string;
  onSubmit: (name: string) => void;
  onClose: () => void;
}) {
  return (
    <NameDialog
      title="Rename"
      description="The agent finds files by name, so keep it descriptive."
      initialValue={name}
      submitLabel="Rename"
      onSubmit={onSubmit}
      onClose={onClose}
    />
  );
}

/* ------------------------------------------------------------------------ */
/* Cards                                                                    */
/* ------------------------------------------------------------------------ */

type MoveHandler = (event: DragEvent<HTMLElement>) => void;

/** What every card in the browser can do, supplied by the page. */
interface BrowserApi {
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

const BrowserContext = createContext<BrowserApi | null>(null);

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
function BrowserRows({ place, folders, docs, media }: BrowserContentProps) {
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
function BrowserTiles({ place, folders, docs, media }: BrowserContentProps) {
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

/* ------------------------------------------------------------------------ */
/* Page                                                                     */
/* ------------------------------------------------------------------------ */

/**
 * The Files workspace at `/files`. A full-height sidebar on the left holds
 * the tree and the way to add things; the browser on the right shows one
 * location as folders, documents, and images, with a breadcrumb that always
 * says where you are and lets you switch libraries or folders in place.
 * Documents open in an editor sheet over the browser — from the bottom on
 * a phone, from the right on a wider frame, framed like a page of its own;
 * the tree stays live to switch files.
 * Images open in a preview. Deleting asks first, then an undo on the toast.
 */
export function FilesLibrary({
  title,
  sections: initialSections,
  skills: initialSkills,
  documents: initialDocuments,
  onSendToChat,
  className,
}: FilesLibraryProps) {
  const [tab, setTab] = useState<Tab>("files");
  const [sections, setSections] = useState(initialSections);
  const [skills, setSkills] = useState(initialSkills);
  const [documents, setDocuments] = useState(initialDocuments);
  const [place, setPlace] = useState<Place>(() => {
    const first = initialSections[0];
    return first === undefined
      ? { kind: "root" }
      : { kind: "library", sectionId: first.id };
  });
  const [documentId, setDocumentId] = useState<string>();
  const [previewId, setPreviewId] = useState<string>();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<Sort>("name-asc");
  const [view, setView] = useState<LibraryCardView>("list");
  const [dialog, setDialog] = useState<DialogState>(null);
  const [pendingDelete, setPendingDelete] = useState<BrowserItem | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const isMobile = useMediaQuery(MOBILE_QUERY);
  const [navOpen, setNavOpen] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});
  const [savedValues, setSavedValues] = useState<Record<string, string>>({});
  const resize = useResizable({
    defaultWidth: 256,
    min: 208,
    max: 420,
    edge: "end",
  });
  // The editor sheet. Wide by default: it is a page, not a side panel.
  const editorResize = useResizable({
    defaultWidth: 880,
    min: 560,
    max: 1280,
    edge: "start",
  });
  const reduceMotion = useReducedMotion();
  // Ids for things made here; only ever read inside event handlers.
  const counter = useRef(0);
  const nextId = () => {
    counter.current += 1;
    return String(counter.current);
  };

  /* --- Where things live ---------------------------------------------- */

  const sectionById = new Map(sections.map((section) => [section.id, section]));
  const documentById = new Map(documents.map((doc) => [doc.id, doc]));
  // Every leaf and folder, keyed by id, with its library and parent folder.
  const home = new Map<string, { sectionId: string; folderId?: string }>();
  const assetById = new Map<string, AssetTileData>();
  const walk = (
    nodes: readonly FileNode[],
    sectionId: string,
    folderId?: string,
  ) => {
    for (const node of nodes) {
      home.set(node.id, { sectionId, ...(folderId ? { folderId } : {}) });
      if (node.type === "folder") walk(node.children, sectionId, node.id);
      else if (node.type === "assets") {
        for (const asset of node.assets) {
          home.set(asset.id, { sectionId, ...(folderId ? { folderId } : {}) });
          assetById.set(asset.id, asset);
        }
      }
    }
  };
  for (const section of sections) walk(section.nodes, section.id);

  const currentSection =
    place.kind === "library" ? sectionById.get(place.sectionId) : undefined;
  const currentFolder =
    place.kind === "library" &&
    place.folderId !== undefined &&
    currentSection !== undefined
      ? findFolder(currentSection.nodes, place.folderId)
      : undefined;
  const openDocument =
    documentId === undefined ? undefined : documentById.get(documentId);
  const previewAsset =
    previewId === undefined ? undefined : assetById.get(previewId);

  const locationTitle =
    tab === "skills"
      ? "Skills"
      : place.kind === "root"
        ? "Files"
        : (currentFolder?.name ?? currentSection?.title ?? title);

  const canCreate =
    tab === "files" && place.kind === "library" && currentSection !== undefined;

  /* --- What the browser shows ---------------------------------------- */

  const scopeNodes =
    place.kind === "library"
      ? (currentSection?.nodes ?? [])
      : sections.flatMap((section) => section.nodes);
  const locationNodes =
    place.kind === "library"
      ? (currentFolder?.children ?? scopeNodes)
      : scopeNodes;

  const toItems = (nodes: readonly FileNode[]) => {
    const items: BrowserItem[] = [];
    for (const node of nodes) {
      if (node.type === "folder") {
        items.push({
          id: node.id,
          kind: "folder",
          name: node.name,
        });
      } else if (node.type === "file") {
        items.push({
          id: node.id,
          kind: "document",
          name: node.name,
          ...(node.excerpt === undefined ? {} : { excerpt: node.excerpt }),
        });
      } else {
        for (const asset of node.assets) {
          items.push({
            id: asset.id,
            kind: asset.kind,
            name: asset.caption ?? "Untitled image",
            ...(asset.src === undefined ? {} : { src: asset.src }),
          });
        }
      }
    }
    return items;
  };

  const items: BrowserItem[] =
    place.kind === "root"
      ? sections.map((section) => ({
          id: section.id,
          kind: "folder",
          name: section.title,
        }))
      : toItems(locationNodes);

  const passesFilter = (item: BrowserItem) => {
    switch (filter) {
      case "all":
        return true;
      case "documents":
        return item.kind === "document";
      case "images":
        return item.kind === "image" || item.kind === "video";
    }
  };
  const compare = (a: BrowserItem, b: BrowserItem) => {
    const order = a.name.localeCompare(b.name);
    return sort === "name-desc" ? -order : order;
  };
  const shown = items.filter(passesFilter).toSorted(compare);
  const folders = shown.filter((item) => item.kind === "folder");
  const docs = shown.filter((item) => item.kind === "document");
  const media = shown.filter(
    (item): item is MediaItem => item.kind === "image" || item.kind === "video",
  );

  /* --- Search: results drop down under the field ---------------------- */

  // Search looks across the whole library, folders included, not just the
  // open folder. Same dropdown the calendar uses; a click opens the hit.
  const results = toSearchResults(
    tab === "skills"
      ? searchSkills(skills, query)
      : searchFiles(
          place.kind === "library" && currentSection !== undefined
            ? [currentSection]
            : sections,
          query,
          { includeFolders: true },
        ),
  );

  /* --- Moving around -------------------------------------------------- */

  /** The sheet covers the browser, so going somewhere closes it. */
  const goTo = (next: Place) => {
    setPlace(next);
    setDocumentId(undefined);
    setQuery("");
  };

  const goToLocation = ({ sectionId, folderId }: TreeLocation) => {
    setTab("files");
    goTo({ kind: "library", sectionId, ...(folderId ? { folderId } : {}) });
    setNavOpen(false);
  };

  /** Documents open over the browser, so the location underneath stays put. */
  const open = (id: string) => {
    if (!documentById.has(id)) return;
    setDocumentId(id);
    setNavOpen(false);
  };

  const closeEditor = () => {
    setDocumentId(undefined);
  };

  // Escape closes the sheet, unless a dialog above it already took the key.
  useEffect(() => {
    if (documentId === undefined) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !event.defaultPrevented) {
        setDocumentId(undefined);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [documentId]);

  const send = (resource: DraggableResource) => {
    if (onSendToChat === undefined) {
      toast("Chat is not connected in this preview");
      return;
    }
    onSendToChat(resource);
  };

  /* --- Changing things ------------------------------------------------ */

  const updateSection = (
    sectionId: string,
    fn: (nodes: readonly FileNode[]) => FileNode[],
  ) => {
    setSections((current) =>
      current.map((section) =>
        section.id === sectionId
          ? { ...section, nodes: fn(section.nodes) }
          : section,
      ),
    );
  };

  const createFolder = (name: string) => {
    if (!canCreate) return;
    const id = `folder:${place.sectionId}:${slug(name)}:${nextId()}`;
    updateSection(place.sectionId, (nodes) =>
      insertNode(nodes, place.folderId, {
        id,
        type: "folder",
        name,
        children: [],
      }),
    );
    setDialog(null);
    toast(`Created “${name}”`);
  };

  const createDocument = () => {
    if (!canCreate) return;
    const id = `doc:${place.sectionId}:${nextId()}`;
    const name = "untitled.md";
    updateSection(place.sectionId, (nodes) =>
      insertNode(nodes, place.folderId, { id, type: "file", name }),
    );
    const value = "# Untitled\n\n";
    setDocuments((current) => [
      ...current,
      { id, meta: { title: name }, value },
    ]);
    setValues((current) => ({ ...current, [id]: value }));
    setSavedValues((current) => ({ ...current, [id]: value }));
    setDocumentId(id);
  };

  const rename = (id: string, name: string) => {
    const at = home.get(id);
    if (at === undefined) return;
    updateSection(at.sectionId, (nodes) =>
      mapNodes(nodes, (node) =>
        node.id === id && node.type !== "assets" ? { ...node, name } : node,
      ),
    );
    setDocuments((current) =>
      current.map((doc) =>
        doc.id === id ? { ...doc, meta: { ...doc.meta, title: name } } : doc,
      ),
    );
    setDialog(null);
  };

  const restore = (removed: RemovedItem) => {
    if (!sectionById.has(removed.sectionId)) return;
    updateSection(removed.sectionId, (nodes) => {
      // If the folder it came from is gone, it lands at the library root.
      const folderId =
        removed.folderId !== undefined &&
        findFolder(nodes, removed.folderId) !== undefined
          ? removed.folderId
          : undefined;
      return removed.payload.type === "asset"
        ? insertAsset(nodes, folderId, removed.payload.asset)
        : insertNode(nodes, folderId, removed.payload.node);
    });
    toast(`Restored “${removed.name}”`);
  };

  const remove = (item: BrowserItem) => {
    const at = home.get(item.id);
    if (at === undefined) return;
    const section = sectionById.get(at.sectionId);
    if (section === undefined) return;
    const asset = assetById.get(item.id);
    const node =
      asset !== undefined
        ? undefined
        : (leaves(section.nodes).find((leaf) => leaf.id === item.id) ??
          findFolder(section.nodes, item.id));
    const payload: RemovedItem["payload"] | undefined =
      asset !== undefined
        ? { type: "asset", asset }
        : node !== undefined
          ? { type: "node", node }
          : undefined;
    if (payload === undefined) return;
    const removed: RemovedItem = { name: item.name, ...at, payload };

    updateSection(at.sectionId, (nodes) =>
      asset === undefined
        ? mapNodes(nodes, (current) =>
            current.id === item.id ? null : current,
          )
        : removeAsset(nodes, item.id),
    );
    if (documentId === item.id) setDocumentId(undefined);
    if (previewId === item.id) setPreviewId(undefined);
    // Deleting the open folder, or one above it, sends you up to the library.
    if (
      place.kind === "library" &&
      place.folderId !== undefined &&
      (place.folderId === item.id ||
        (node?.type === "folder" &&
          findFolder(node.children, place.folderId) !== undefined))
    ) {
      setPlace({ kind: "library", sectionId: at.sectionId });
    }
    toast(`Deleted “${item.name}”`, {
      action: {
        label: "Undo",
        onClick: () => {
          restore(removed);
        },
      },
    });
  };

  const moveTo = (itemId: string, dest: FileMoveDest) => {
    const result = moveLibraryItem(sections, itemId, dest);
    if (result === null) return;
    setSections(result.sections);
    setDraggingId(null);
    setDropTargetId(null);
    toast(`Moved “${result.name}” to ${result.destName}`);
  };

  const overMoveDest =
    (dest: FileMoveDest, key: string) => (event: DragEvent<HTMLElement>) => {
      const id = fileMoveId();
      if (id === null || !isFileMove(Array.from(event.dataTransfer.types))) {
        return;
      }
      if (!canMoveLibraryItem(sections, id, dest)) {
        event.dataTransfer.dropEffect = "none";
        return;
      }
      preventFileMove(event);
      setDropTargetId(key);
    };

  const leaveMoveDest = (key: string) => (event: DragEvent<HTMLElement>) => {
    if (!isFileMove(Array.from(event.dataTransfer.types))) return;
    if (!isLeavingDropTarget(event)) return;
    setDropTargetId((current) => (current === key ? null : current));
  };

  const dropMoveDest =
    (dest: FileMoveDest) => (event: DragEvent<HTMLElement>) => {
      const id = fileMoveId();
      if (id === null) return;
      event.preventDefault();
      moveTo(id, dest);
    };

  const sendItem = (item: BrowserItem) => {
    if (item.kind === "document") {
      send({ kind: "file", file: { id: item.id, title: item.name } });
      return;
    }
    const asset = assetById.get(item.id);
    if (asset !== undefined) send({ kind: "asset", asset });
  };

  const pressItem = (item: BrowserItem) => {
    if (item.kind === "folder") {
      if (place.kind === "root") {
        goTo({ kind: "library", sectionId: item.id });
      } else {
        goTo({
          kind: "library",
          sectionId: place.sectionId,
          folderId: item.id,
        });
      }
      return;
    }
    if (item.kind === "document") {
      open(item.id);
      return;
    }
    setPreviewId(item.id);
  };

  /** A search hit: folders become the location, the rest open. */
  const openResult = (id: string) => {
    setQuery("");
    if (tab === "skills" || documentById.has(id)) {
      open(id);
      return;
    }
    const at = home.get(id);
    if (assetById.has(id)) {
      setPreviewId(id);
    } else if (at !== undefined) {
      goTo({ kind: "library", sectionId: at.sectionId, folderId: id });
    }
  };

  /* --- Breadcrumb ----------------------------------------------------- */

  const libraryMenu: readonly BreadcrumbMenuItem[] = sections.map(
    (section) => ({
      id: section.id,
      label: section.title,
      icon: section.kind === "person" ? "user" : "building",
    }),
  );
  const folderMenu: readonly BreadcrumbMenuItem[] =
    currentSection === undefined
      ? []
      : currentSection.nodes.flatMap((node) =>
          node.type === "folder"
            ? [{ id: node.id, label: node.name, icon: "folder" as const }]
            : [],
        );

  const treeSelectedId =
    documentId ??
    (place.kind === "library"
      ? (place.folderId ?? place.sectionId)
      : undefined);

  // Where the open document lives, for the editor's breadcrumb.
  const openDocumentHome =
    openDocument === undefined ? undefined : home.get(openDocument.id);
  const openDocumentSection =
    openDocumentHome === undefined
      ? undefined
      : sectionById.get(openDocumentHome.sectionId);
  const openDocumentFolder =
    openDocumentHome?.folderId === undefined ||
    openDocumentSection === undefined
      ? undefined
      : findFolder(openDocumentSection.nodes, openDocumentHome.folderId);

  const bodyKey =
    tab === "skills"
      ? "skills"
      : `${place.kind}:${currentSection?.id ?? ""}:${currentFolder?.id ?? ""}:${filter}:${view}`;

  const browser: BrowserApi = {
    draggingId,
    dropTargetId,
    press: pressItem,
    open: (item) => {
      open(item.id);
    },
    send: sendItem,
    rename: (item) => {
      setDialog({ kind: "rename", id: item.id, name: item.name });
    },
    remove: setPendingDelete,
    startMove: (item, event) => {
      beginFileMove(event, item.id);
      setDraggingId(item.id);
    },
    endMove: () => {
      endFileMove();
      setDraggingId(null);
      setDropTargetId(null);
    },
    overMoveDest,
    leaveMoveDest,
    dropMoveDest,
  };

  return (
    <div
      data-slot="files-library"
      className={cn(
        "@container relative flex min-h-0 min-w-0 flex-1",
        className,
      )}
    >
      {navOpen ? (
        <button
          type="button"
          aria-label="Close files navigation"
          className="absolute inset-0 z-20 bg-imagine-foreground/10 md:hidden"
          onClick={() => {
            setNavOpen(false);
          }}
        />
      ) : null}
      {/* Sidebar: full height, page-white, a rule against the browser. */}
      <aside
        aria-label="Files navigation"
        style={isMobile ? undefined : { width: resize.width }}
        className={cn(
          "relative flex h-full shrink-0 flex-col gap-m border-r border-imagine-border bg-imagine-surface px-s pt-l pb-s",
          "max-md:absolute max-md:inset-y-0 max-md:left-0 max-md:z-30 max-md:w-72 max-md:shadow-floating",
          !navOpen && "max-md:hidden",
        )}
      >
        <ResizeHandle
          edge="end"
          binding={resize.handle}
          dragging={resize.dragging}
          label="Resize files sidebar"
          className="max-md:hidden"
        />
        <Tabs
          variant="line"
          value={tab}
          onValueChange={(next) => {
            if (next !== "files" && next !== "skills") return;
            setTab(next);
            setDocumentId(undefined);
            setQuery("");
          }}
          className="px-xs"
        >
          <TabsList>
            <TabsTrigger value="files">Files</TabsTrigger>
            <TabsTrigger value="skills">Skills</TabsTrigger>
          </TabsList>
        </Tabs>

        {tab === "files" ? (
          <NewMenu
            disabled={!canCreate}
            onIntent={(intent) => {
              if (intent === "folder") setDialog({ kind: "new-folder" });
              else createDocument();
            }}
          />
        ) : (
          <Button
            size="sm"
            className="w-full"
            onClick={() => {
              toast("New skills are not part of this prototype");
            }}
          >
            <Icon name="plus" size="s" data-icon="inline-start" />
            New skill
          </Button>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto">
          <AnimatePresence initial={false} mode="wait">
            {tab === "files" ? (
              <motion.div
                key="tree"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={fade.fast}
                className="flex flex-col gap-s"
              >
                <MovableFileTreeNav
                  sections={sections}
                  {...(treeSelectedId === undefined
                    ? {}
                    : { selectedId: treeSelectedId })}
                  onSelectLocation={goToLocation}
                  onOpenFile={open}
                  onMoveFile={moveTo}
                />
              </motion.div>
            ) : (
              <motion.div
                key="skills"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={fade.fast}
                className="flex flex-col gap-px"
              >
                {skills.map((skill) => {
                  const selected = documentId === skill.id;
                  return (
                    <button
                      key={skill.id}
                      type="button"
                      aria-current={selected ? "location" : undefined}
                      onClick={() => {
                        open(skill.id);
                      }}
                      className={cn(
                        "flex h-8 w-full items-center gap-xs rounded-control pr-s pl-xs text-left transition-colors outline-none select-none focus-visible:ring-2 focus-visible:ring-ring/40",
                        selected
                          ? "bg-imagine-foreground/8 text-imagine-foreground"
                          : "text-imagine-foreground-muted hover:bg-imagine-foreground/5 hover:text-imagine-foreground",
                      )}
                    >
                      <span className="flex size-6 shrink-0 items-center justify-center">
                        <Icon name="puzzle-piece" size="s" />
                      </span>
                      <span
                        className={cn(
                          "min-w-0 flex-1 truncate type-small",
                          selected ? "font-semibold" : "font-medium",
                        )}
                      >
                        {skill.name}
                      </span>
                      {skill.enabled ? null : (
                        <span className="text-xs text-imagine-foreground-faint">
                          Off
                        </span>
                      )}
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </aside>

      {/* Browser, with the editor sheet layered over it. */}
      <div className="relative flex min-h-0 min-w-0 flex-1">
        <section
          aria-label="Browser"
          // The page's inset: on a wide frame the browser is a centered column.
          className="flex min-h-0 min-w-0 flex-1 flex-col gap-m px-page pt-l pb-l md:pt-xl md:pb-xxl"
        >
          <header className="flex min-h-9 shrink-0 flex-wrap items-center gap-s">
            <Button
              size="icon-sm"
              variant="ghost"
              aria-label="Browse files"
              aria-expanded={navOpen}
              onClick={() => {
                setNavOpen(true);
              }}
              className="md:hidden"
            >
              <Icon name="sidebar" />
            </Button>
            <Breadcrumb className="min-w-0 flex-1">
              {tab === "skills" ? (
                <BreadcrumbItem>
                  <BreadcrumbPage>Skills</BreadcrumbPage>
                </BreadcrumbItem>
              ) : (
                <BreadcrumbItem>
                  {place.kind === "root" ? (
                    <BreadcrumbPage>Files</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink
                      onClick={() => {
                        goTo({ kind: "root" });
                      }}
                    >
                      Files
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              )}
              {tab === "files" && currentSection !== undefined ? (
                <>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    {currentFolder === undefined ? (
                      <BreadcrumbPage>{currentSection.title}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink
                        onClick={() => {
                          goTo({
                            kind: "library",
                            sectionId: currentSection.id,
                          });
                        }}
                        onDragOver={overMoveDest(
                          { sectionId: currentSection.id },
                          `crumb:${currentSection.id}`,
                        )}
                        onDragLeave={leaveMoveDest(
                          `crumb:${currentSection.id}`,
                        )}
                        onDrop={dropMoveDest({ sectionId: currentSection.id })}
                        className={
                          dropTargetId === `crumb:${currentSection.id}`
                            ? "text-imagine-secondary"
                            : undefined
                        }
                      >
                        {currentSection.title}
                      </BreadcrumbLink>
                    )}
                    {currentFolder === undefined ? (
                      <BreadcrumbMenu
                        label="Switch library"
                        items={libraryMenu}
                        selectedId={currentSection.id}
                        onSelect={(id) => {
                          goTo({ kind: "library", sectionId: id });
                        }}
                      />
                    ) : null}
                  </BreadcrumbItem>
                </>
              ) : null}
              {tab === "files" &&
              currentSection !== undefined &&
              currentFolder !== undefined ? (
                <>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>{currentFolder.name}</BreadcrumbPage>
                    {folderMenu.length > 1 ? (
                      <BreadcrumbMenu
                        label="Switch folder"
                        items={folderMenu}
                        selectedId={currentFolder.id}
                        onSelect={(id) => {
                          goTo({
                            kind: "library",
                            sectionId: currentSection.id,
                            folderId: id,
                          });
                        }}
                      />
                    ) : null}
                  </BreadcrumbItem>
                </>
              ) : null}
            </Breadcrumb>

            <SearchBox
              value={query}
              onValueChange={setQuery}
              results={results}
              onSelect={openResult}
              placeholder={`Search in ${tab === "skills" ? "skills" : (currentSection?.title ?? "all files")}`}
              emptyLabel={`Nothing matches “${query.trim()}”`}
              listLabel="Files"
              className="w-full min-w-0 sm:w-64 sm:shrink-0"
            />
            {tab === "files" ? (
              <ToggleGroup
                size="sm"
                value={view}
                onValueChange={(next) => {
                  if (next === "grid" || next === "list") setView(next);
                }}
                aria-label="Layout"
                className="shrink-0"
              >
                <ToggleGroupItem value="list" aria-label="List">
                  <Icon name="list" size="s" />
                </ToggleGroupItem>
                <ToggleGroupItem value="grid" aria-label="Grid">
                  <Icon name="grip" size="s" />
                </ToggleGroupItem>
              </ToggleGroup>
            ) : null}
          </header>

          {tab === "files" ? (
            <div className="flex min-w-0 shrink-0 flex-wrap items-center justify-between gap-s">
              <ChipGroup
                value={filter}
                onValueChange={(next) => {
                  setFilter(next as Filter);
                }}
                aria-label="Filter"
              >
                {FILTERS.map((entry) => (
                  <Chip key={entry.value} value={entry.value}>
                    {entry.label}
                  </Chip>
                ))}
              </ChipGroup>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="shrink-0 text-imagine-foreground-muted data-open:text-imagine-foreground"
                  >
                    {SORT_SHORT[sort]}
                    <Icon name="chevron-down" size="s" data-icon="inline-end" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuRadioGroup
                    value={sort}
                    onValueChange={(next) => {
                      setSort(next as Sort);
                    }}
                  >
                    {SORTS.map((entry) => (
                      <DropdownMenuRadioItem
                        key={entry.value}
                        value={entry.value}
                      >
                        {entry.label}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : null}

          <div className="relative min-h-0 flex-1">
            <AnimatePresence initial={false} mode="wait">
              <motion.div
                key={bodyKey}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={fade.fast}
                className="absolute inset-0 flex flex-col gap-xl overflow-y-auto pb-xxl"
              >
                {tab === "skills" ? (
                  <>
                    <p className="type-small text-imagine-foreground-muted">
                      Skills are instructions the agent follows. Switch one off
                      to pause it, or open its file to change what it does.
                    </p>
                    <SkillsList
                      skills={skills}
                      {...(documentId === undefined
                        ? {}
                        : { openSkillId: documentId })}
                      onToggle={(id, enabled) => {
                        setSkills((current) =>
                          current.map((skill) =>
                            skill.id === id ? { ...skill, enabled } : skill,
                          ),
                        );
                      }}
                      onOpenFile={open}
                    />
                  </>
                ) : shown.length === 0 && !(canCreate && filter === "all") ? (
                  <EmptyState
                    icon={filter === "images" ? "image" : "folder"}
                    title={
                      filter === "all" ? "Nothing here" : `No ${filter} here`
                    }
                    body="Try another filter, or look in a different folder."
                    {...(filter !== "all"
                      ? {
                          action: (
                            <Button
                              size="sm"
                              variant="soft"
                              onClick={() => {
                                setFilter("all");
                              }}
                            >
                              Show everything
                            </Button>
                          ),
                        }
                      : {})}
                  />
                ) : (
                  <BrowserContext value={browser}>
                    {view === "list" ? (
                      <BrowserRows
                        place={place}
                        folders={folders}
                        docs={docs}
                        media={media}
                      />
                    ) : (
                      <BrowserTiles
                        place={place}
                        folders={folders}
                        docs={docs}
                        media={media}
                      />
                    )}

                    {docs.length === 0 &&
                    media.length === 0 &&
                    folders.length === 0 &&
                    canCreate ? (
                      <p className="px-xs type-small text-imagine-foreground-muted">
                        Nothing in {locationTitle} yet. Use New to add a
                        document or folder.
                      </p>
                    ) : null}
                  </BrowserContext>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </section>

        {/* Editor: a sheet over the browser. On a phone it rises from the
          bottom; on a wider frame it slides in from the right, framed the
          way a page is (rounded left corners on a dimmed backdrop). The
          tree stays reachable to switch documents; the scrim, Escape, and
          the close button all put the browser back. */}
        <AnimatePresence initial={false}>
          {openDocument === undefined ? null : (
            <motion.div
              key="editor"
              data-slot="files-editor-scrim"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={fade.fast}
              className="absolute inset-0 z-20 flex bg-imagine-foreground/10 max-md:items-end md:justify-end"
              onClick={closeEditor}
            >
              <motion.div
                role="dialog"
                aria-label={openDocument.meta.title}
                data-slot="files-editor"
                initial={
                  reduceMotion
                    ? { opacity: 0 }
                    : isMobile
                      ? { y: "100%" }
                      : { x: "100%" }
                }
                animate={
                  reduceMotion ? { opacity: 1 } : isMobile ? { y: 0 } : { x: 0 }
                }
                exit={
                  reduceMotion
                    ? { opacity: 0 }
                    : isMobile
                      ? { y: "100%" }
                      : { x: "100%" }
                }
                transition={reduceMotion ? fade.fast : spring.sheet}
                style={isMobile ? undefined : { width: editorResize.width }}
                className={cn(
                  "relative flex h-full max-w-full flex-col overflow-hidden bg-imagine-surface shadow-raised",
                  "max-md:h-[calc(100%-var(--spacing-l))] max-md:w-full max-md:rounded-t-surface",
                  "md:rounded-l-surface",
                )}
                onClick={(event) => {
                  event.stopPropagation();
                }}
              >
                <ResizeHandle
                  edge="start"
                  binding={editorResize.handle}
                  dragging={editorResize.dragging}
                  label="Resize editor"
                  className="max-md:hidden"
                />
                <div
                  aria-hidden
                  className="flex shrink-0 justify-center pt-s md:hidden"
                >
                  <span className="h-1 w-10 rounded-full bg-imagine-border" />
                </div>
                {/* Where the document lives, and the way out. Stays put while
                  the page below scrolls. */}
                <div className="flex shrink-0 items-center gap-s px-l pt-s md:px-xxl md:pt-xl">
                  <Breadcrumb
                    aria-label="Document location"
                    className="min-w-0 flex-1"
                  >
                    {openDocumentHome === undefined ? (
                      <BreadcrumbItem>
                        <BreadcrumbPage>Skills</BreadcrumbPage>
                      </BreadcrumbItem>
                    ) : (
                      <>
                        <BreadcrumbItem>
                          <BreadcrumbLink
                            onClick={() => {
                              setTab("files");
                              goTo({ kind: "root" });
                            }}
                          >
                            Files
                          </BreadcrumbLink>
                        </BreadcrumbItem>
                        {openDocumentSection === undefined ? null : (
                          <>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                              {openDocumentFolder === undefined ? (
                                <BreadcrumbPage>
                                  {openDocumentSection.title}
                                </BreadcrumbPage>
                              ) : (
                                <BreadcrumbLink
                                  onClick={() => {
                                    setTab("files");
                                    goTo({
                                      kind: "library",
                                      sectionId: openDocumentSection.id,
                                    });
                                  }}
                                  onDragOver={overMoveDest(
                                    { sectionId: openDocumentSection.id },
                                    `crumb:${openDocumentSection.id}`,
                                  )}
                                  onDragLeave={leaveMoveDest(
                                    `crumb:${openDocumentSection.id}`,
                                  )}
                                  onDrop={dropMoveDest({
                                    sectionId: openDocumentSection.id,
                                  })}
                                  className={
                                    dropTargetId ===
                                    `crumb:${openDocumentSection.id}`
                                      ? "text-imagine-secondary"
                                      : undefined
                                  }
                                >
                                  {openDocumentSection.title}
                                </BreadcrumbLink>
                              )}
                            </BreadcrumbItem>
                          </>
                        )}
                        {openDocumentFolder === undefined ||
                        openDocumentSection === undefined ? null : (
                          <>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                              <BreadcrumbPage>
                                {openDocumentFolder.name}
                              </BreadcrumbPage>
                            </BreadcrumbItem>
                          </>
                        )}
                      </>
                    )}
                  </Breadcrumb>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="shrink-0"
                    onClick={() => {
                      send({
                        kind: "file",
                        file: {
                          id: openDocument.id,
                          title: openDocument.meta.title,
                        },
                      });
                    }}
                  >
                    <Icon name="imagine" size="s" data-icon="inline-start" />
                    Send to agent
                  </Button>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    aria-label="Close editor"
                    onClick={closeEditor}
                    className="-mr-xs shrink-0 text-imagine-foreground-muted hover:text-imagine-foreground"
                  >
                    <Icon name="xmark" size="s" />
                  </Button>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto px-l pt-l pb-l md:px-xxl md:pt-xl md:pb-xxl">
                  <AnimatePresence initial={false} mode="wait">
                    <motion.div
                      key={openDocument.id}
                      initial={{ opacity: 0, x: 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -8 }}
                      transition={fade.fast}
                      className="w-full"
                    >
                      <MarkdownEditor
                        meta={openDocument.meta}
                        value={values[openDocument.id] ?? openDocument.value}
                        savedValue={
                          savedValues[openDocument.id] ?? openDocument.value
                        }
                        onValueChange={(value) => {
                          setValues((current) => ({
                            ...current,
                            [openDocument.id]: value,
                          }));
                        }}
                        onSave={() => {
                          setSavedValues((current) => ({
                            ...current,
                            [openDocument.id]:
                              values[openDocument.id] ?? openDocument.value,
                          }));
                        }}
                        className="mx-auto max-w-3xl"
                      />
                    </motion.div>
                  </AnimatePresence>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Naming */}
      {pendingDelete === null ? null : (
        <DeleteConfirmDialog
          item={pendingDelete}
          onConfirm={() => {
            remove(pendingDelete);
            setPendingDelete(null);
          }}
          onClose={() => {
            setPendingDelete(null);
          }}
        />
      )}

      {dialog === null ? null : dialog.kind === "rename" ? (
        <RenameDialog
          key={dialog.id}
          name={dialog.name}
          onSubmit={(name) => {
            rename(dialog.id, name);
          }}
          onClose={() => {
            setDialog(null);
          }}
        />
      ) : (
        <NewFolderDialog
          locationTitle={locationTitle}
          onSubmit={createFolder}
          onClose={() => {
            setDialog(null);
          }}
        />
      )}

      {/* Image preview */}
      <Dialog
        open={previewAsset !== undefined}
        onOpenChange={(next) => {
          if (!next) setPreviewId(undefined);
        }}
      >
        <DialogContent className="gap-m sm:max-w-2xl">
          {previewAsset === undefined ? null : (
            <>
              <DialogHeader>
                <DialogTitle className="truncate">
                  {previewAsset.caption ?? "Untitled image"}
                </DialogTitle>
                <DialogDescription className="sr-only">
                  {previewAsset.kind === "video" ? "Video" : "Image"}
                </DialogDescription>
              </DialogHeader>
              <div className="overflow-hidden rounded-panel bg-imagine-surface-raised">
                {previewAsset.src === undefined ? (
                  <div className="flex aspect-video items-center justify-center text-imagine-foreground-faint">
                    <Icon name={previewAsset.kind} size="xl" />
                  </div>
                ) : (
                  // Mock media comes from arbitrary hosts.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={previewAsset.src}
                    alt={previewAsset.caption ?? ""}
                    className="max-h-[60vh] w-full object-contain"
                  />
                )}
              </div>
              <DialogFooter>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setPendingDelete({
                      id: previewAsset.id,
                      kind: previewAsset.kind,
                      name: previewAsset.caption ?? "Untitled image",
                    });
                  }}
                >
                  <Icon name="trash" size="s" data-icon="inline-start" />
                  Delete
                </Button>
                <Button
                  onClick={() => {
                    setPreviewId(undefined);
                    send({ kind: "asset", asset: previewAsset });
                  }}
                >
                  <Icon name="imagine" size="s" data-icon="inline-start" />
                  Send to agent
                </Button>
              </DialogFooter>
            </>
          )}
          <DialogCloseButton />
        </DialogContent>
      </Dialog>
    </div>
  );
}
