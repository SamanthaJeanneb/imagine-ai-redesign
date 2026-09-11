"use client";

import { cn } from "cn";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
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
  FileTreeNav,
  type TreeLocation,
} from "@/components/features/files/file-tree-nav";
import {
  LibraryCard,
  type LibraryCardAction,
  type LibraryCardKind,
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

type FolderNode = Extract<FileNode, { type: "folder" }>;

/** One thing the browser can show, whatever it came from. */
interface BrowserItem {
  id: string;
  kind: LibraryCardKind;
  name: string;
  excerpt?: string;
  src?: string;
}

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

const DOCUMENT_ACTIONS: readonly LibraryCardAction[] = [
  { id: "open", label: "Open", icon: "file-lines" },
  { id: "send", label: "Send to chat", icon: "imagine" },
  { id: "rename", label: "Rename", icon: "pen" },
  { id: "delete", label: "Delete", icon: "trash", destructive: true },
];

const MEDIA_ACTIONS: readonly LibraryCardAction[] = [
  { id: "send", label: "Send to chat", icon: "imagine" },
  { id: "delete", label: "Delete", icon: "trash", destructive: true },
];

const FOLDER_ACTIONS: readonly LibraryCardAction[] = [
  { id: "rename", label: "Rename", icon: "pen" },
  { id: "delete", label: "Delete", icon: "trash", destructive: true },
];

/* ------------------------------------------------------------------------ */
/* Tree helpers                                                             */
/* ------------------------------------------------------------------------ */

/** Leaves only; folders are walked into. */
function leaves(nodes: readonly FileNode[]): readonly FileNode[] {
  return nodes.flatMap((node) =>
    node.type === "folder" ? leaves(node.children) : [node],
  );
}

function findFolder(
  nodes: readonly FileNode[],
  id: string,
): FolderNode | undefined {
  for (const node of nodes) {
    if (node.type !== "folder") continue;
    if (node.id === id) return node;
    const nested = findFolder(node.children, id);
    if (nested !== undefined) return nested;
  }
  return undefined;
}

/** Rewrite every node depth-first; return null to drop one. */
function mapNodes(
  nodes: readonly FileNode[],
  fn: (node: FileNode) => FileNode | null,
): FileNode[] {
  return nodes.flatMap((node) => {
    const next = fn(
      node.type === "folder"
        ? { ...node, children: mapNodes(node.children, fn) }
        : node,
    );
    return next === null ? [] : [next];
  });
}

function insertNode(
  nodes: readonly FileNode[],
  folderId: string | undefined,
  node: FileNode,
): FileNode[] {
  if (folderId === undefined) return [...nodes, node];
  return mapNodes(nodes, (current) =>
    current.type === "folder" && current.id === folderId
      ? { ...current, children: [...current.children, node] }
      : current,
  );
}

/** Put an asset back into the location's asset group, making one if needed. */
function insertAsset(
  nodes: readonly FileNode[],
  folderId: string | undefined,
  asset: AssetTileData,
): FileNode[] {
  const target =
    folderId === undefined
      ? nodes
      : (findFolder(nodes, folderId)?.children ?? []);
  const group = target.find((node) => node.type === "assets");
  if (group === undefined) {
    return insertNode(nodes, folderId, {
      id: `assets:${folderId ?? "root"}:${asset.id}`,
      type: "assets",
      name: "Images",
      assets: [asset],
    });
  }
  return mapNodes(nodes, (current) =>
    current.type === "assets" && current.id === group.id
      ? { ...current, assets: [...current.assets, asset] }
      : current,
  );
}

function removeAsset(nodes: readonly FileNode[], assetId: string): FileNode[] {
  return mapNodes(nodes, (current) => {
    if (current.type !== "assets") return current;
    const assets = current.assets.filter((asset) => asset.id !== assetId);
    return assets.length === 0 ? null : { ...current, assets };
  });
}

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

/** Naming a folder, or renaming anything. One field, Enter submits. */
function NameDialog({
  open,
  title,
  description,
  label,
  initialValue,
  submitLabel,
  onSubmit,
  onClose,
}: {
  open: boolean;
  title: string;
  description: string;
  label: string;
  initialValue: string;
  submitLabel: string;
  onSubmit: (name: string) => void;
  onClose: () => void;
}) {
  const [value, setValue] = useState(initialValue);
  const trimmed = value.trim();

  return (
    <Dialog
      open={open}
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
            <FieldLabel htmlFor="files-name">{label}</FieldLabel>
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
      </DialogContent>
    </Dialog>
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
 * Images open in a preview. Deleting is immediate, with an undo on the toast.
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
    (item) => item.kind === "image" || item.kind === "video",
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

  const onCardAction = (item: BrowserItem, action: string) => {
    switch (action) {
      case "open":
        open(item.id);
        break;
      case "send":
        if (item.kind === "document") {
          send({ kind: "file", file: { id: item.id, title: item.name } });
        } else {
          const asset = assetById.get(item.id);
          if (asset !== undefined) send({ kind: "asset", asset });
        }
        break;
      case "rename":
        setDialog({ kind: "rename", id: item.id, name: item.name });
        break;
      case "delete":
        remove(item);
        break;
    }
  };

  const actionsFor = (item: BrowserItem): readonly LibraryCardAction[] => {
    if (item.kind === "folder") {
      return place.kind === "root" ? [] : FOLDER_ACTIONS;
    }
    return item.kind === "document" ? DOCUMENT_ACTIONS : MEDIA_ACTIONS;
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

  // Where the open document lives, for the editor's header.
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
  const openDocumentPlace =
    openDocument === undefined
      ? undefined
      : openDocumentSection === undefined
        ? "Skill"
        : [openDocumentSection.title, openDocumentFolder?.name]
            .filter((part) => part !== undefined)
            .join(" / ");

  const bodyKey =
    tab === "skills"
      ? "skills"
      : `${place.kind}:${currentSection?.id ?? ""}:${currentFolder?.id ?? ""}:${filter}:${view}`;

  const renderCard = (item: BrowserItem) => (
    <StaggerItem key={item.id}>
      <LibraryCard
        kind={item.kind}
        name={item.name}
        {...(item.excerpt === undefined ? {} : { excerpt: item.excerpt })}
        {...(item.src === undefined ? {} : { src: item.src })}
        view={view}
        onPress={() => {
          pressItem(item);
        }}
        actions={actionsFor(item)}
        onAction={(action) => {
          onCardAction(item, action);
        }}
      />
    </StaggerItem>
  );

  const gridClass =
    view === "grid"
      ? "grid grid-cols-[repeat(auto-fill,minmax(min(100%,12rem),1fr))] gap-m"
      : "flex flex-col gap-px";

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
                <FileTreeNav
                  sections={sections}
                  {...(treeSelectedId === undefined
                    ? {}
                    : { selectedId: treeSelectedId })}
                  onSelectLocation={goToLocation}
                  onOpenFile={open}
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
                  <>
                    {folders.length > 0 ? (
                      <div className="flex flex-col gap-s">
                        <GroupLabel>
                          {place.kind === "root" ? "Libraries" : "Folders"}
                        </GroupLabel>
                        <Stagger kind="grid" className={gridClass}>
                          {folders.map(renderCard)}
                        </Stagger>
                      </div>
                    ) : null}

                    {docs.length > 0 ? (
                      <div className="flex flex-col gap-s">
                        <GroupLabel>Documents</GroupLabel>
                        <Stagger kind="grid" className={gridClass}>
                          {docs.map(renderCard)}
                        </Stagger>
                      </div>
                    ) : null}

                    {media.length > 0 ? (
                      <div className="flex flex-col gap-s">
                        <GroupLabel>Images</GroupLabel>
                        <Stagger kind="grid" className={gridClass}>
                          {media.map(renderCard)}
                        </Stagger>
                      </div>
                    ) : null}

                    {docs.length === 0 &&
                    media.length === 0 &&
                    folders.length === 0 &&
                    canCreate ? (
                      <p className="px-xs type-small text-imagine-foreground-muted">
                        Nothing in {locationTitle} yet. Use New to add a
                        document or folder.
                      </p>
                    ) : null}
                  </>
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
              transition={fade.base}
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
                  reduceMotion
                    ? { opacity: 1 }
                    : isMobile
                      ? { y: 0 }
                      : { x: 0 }
                }
                exit={
                  reduceMotion
                    ? { opacity: 0 }
                    : isMobile
                      ? { y: "100%" }
                      : { x: "100%" }
                }
                transition={reduceMotion ? fade.base : spring.soft}
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
                  <Icon
                    name="file-lines"
                    size="s"
                    className="shrink-0 text-imagine-foreground-muted"
                  />
                  <span className="min-w-0 flex-1 truncate type-small text-imagine-foreground-muted">
                    {openDocumentPlace}
                  </span>
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
                    Send to chat
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
                        className="max-w-3xl"
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
      {dialog === null ? null : (
        <NameDialog
          key={dialog.kind === "rename" ? dialog.id : "new-folder"}
          open
          title={dialog.kind === "rename" ? "Rename" : "New folder"}
          description={
            dialog.kind === "rename"
              ? "The agent finds files by name, so keep it descriptive."
              : `Goes into ${locationTitle}.`
          }
          label="Name"
          initialValue={dialog.kind === "rename" ? dialog.name : "New folder"}
          submitLabel={dialog.kind === "rename" ? "Rename" : "Create"}
          onSubmit={(name) => {
            if (dialog.kind === "rename") rename(dialog.id, name);
            else createFolder(name);
          }}
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
                    const item: BrowserItem = {
                      id: previewAsset.id,
                      kind: previewAsset.kind,
                      name: previewAsset.caption ?? "Untitled image",
                    };
                    setPreviewId(undefined);
                    remove(item);
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
                  Send to chat
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
