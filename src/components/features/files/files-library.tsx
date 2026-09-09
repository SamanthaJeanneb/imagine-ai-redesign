"use client";

import { cn } from "cn";
import { AnimatePresence, motion } from "motion/react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import type { AssetTileData } from "@/components/features/files/asset-tile";
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
import {
  NewMenu,
  type NewMenuIntent,
} from "@/components/features/files/new-menu";
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
import { DashedAction } from "@/components/ui/dashed-action";
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
import { SearchField } from "@/components/ui/search-field";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { OpenDocument } from "@/services/files";
import { fade } from "@/styles/motion";

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
  | { kind: "root" }
  | { kind: "library"; sectionId: string; folderId?: string }
  | { kind: "shared" }
  | { kind: "trash" };

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

/** Enough to put something back where it was. */
interface TrashedItem {
  id: string;
  name: string;
  kind: LibraryCardKind;
  sectionId: string;
  folderId?: string;
  payload:
    | { type: "node"; node: FileNode }
    | { type: "asset"; asset: AssetTileData };
}

type DialogState =
  | { kind: "new-folder" }
  | { kind: "rename"; id: string; name: string }
  | null;

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
  { id: "trash", label: "Move to trash", icon: "trash", destructive: true },
];

const MEDIA_ACTIONS: readonly LibraryCardAction[] = [
  { id: "send", label: "Send to chat", icon: "imagine" },
  { id: "trash", label: "Move to trash", icon: "trash", destructive: true },
];

const FOLDER_ACTIONS: readonly LibraryCardAction[] = [
  { id: "rename", label: "Rename", icon: "pen" },
  { id: "trash", label: "Move to trash", icon: "trash", destructive: true },
];

const TRASH_ACTIONS: readonly LibraryCardAction[] = [
  { id: "restore", label: "Restore", icon: "arrows-rotate" },
  { id: "delete", label: "Delete forever", icon: "xmark", destructive: true },
];

/* ------------------------------------------------------------------------ */
/* Tree helpers                                                             */
/* ------------------------------------------------------------------------ */

function matches(text: string | undefined, query: string): boolean {
  return text?.toLowerCase().includes(query) ?? false;
}

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
    folderId === undefined ? nodes : (findFolder(nodes, folderId)?.children ?? []);
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

/** The two fixed rows at the foot of the rail. */
function RailRow({
  icon,
  label,
  selected,
  count,
  onClick,
}: {
  icon: IconName;
  label: string;
  selected: boolean;
  count?: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-current={selected ? "location" : undefined}
      onClick={onClick}
      className={cn(
        "flex h-8 w-full items-center gap-xs rounded-control pr-s pl-xs text-left transition-colors outline-none select-none focus-visible:ring-2 focus-visible:ring-ring/40",
        selected
          ? "bg-imagine-foreground/8 text-imagine-foreground"
          : "text-imagine-foreground-muted hover:bg-imagine-foreground/5 hover:text-imagine-foreground",
      )}
    >
      <span className="flex size-6 shrink-0 items-center justify-center">
        <Icon name={icon} size="s" />
      </span>
      <span
        className={cn(
          "min-w-0 flex-1 truncate type-small",
          selected ? "font-semibold" : "font-medium",
        )}
      >
        {label}
      </span>
      {count === undefined || count === 0 ? null : (
        <span className="text-xs text-imagine-foreground-faint tabular-nums">
          {count}
        </span>
      )}
    </button>
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
 * The Files workspace at `/files-2`. A full-height sidebar on the left holds
 * the tree and the way to add things; the browser on the right shows one
 * location as folders, documents, and images, with a breadcrumb that always
 * says where you are and lets you switch libraries or folders in place.
 * Documents open inside the browser; images open in a preview. Trash keeps
 * what was removed until it is restored or deleted for good.
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
  const [trash, setTrash] = useState<readonly TrashedItem[]>([]);
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
  const [view, setView] = useState<LibraryCardView>("grid");
  const [dialog, setDialog] = useState<DialogState>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [savedValues, setSavedValues] = useState<Record<string, string>>({});
  // Ids for things made here; only ever read inside event handlers.
  const counter = useRef(0);
  const nextId = () => {
    counter.current += 1;
    return String(counter.current);
  };

  const normalizedQuery = query.trim().toLowerCase();
  const searching = normalizedQuery !== "";

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
        : place.kind === "shared"
          ? "Shared with me"
          : place.kind === "trash"
            ? "Trash"
            : (currentFolder?.name ?? currentSection?.title ?? title);

  const canCreate =
    tab === "files" && place.kind === "library" && currentSection !== undefined;

  /* --- What the browser shows ---------------------------------------- */

  const scopeNodes =
    place.kind === "library"
      ? (currentSection?.nodes ?? [])
      : place.kind === "root"
        ? sections.flatMap((section) => section.nodes)
        : [];
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

  let items: BrowserItem[];
  if (place.kind === "trash") {
    items = trash.map((entry) => {
      const { payload } = entry;
      const excerpt =
        payload.type === "node" && payload.node.type === "file"
          ? payload.node.excerpt
          : undefined;
      const src = payload.type === "asset" ? payload.asset.src : undefined;
      return {
        id: entry.id,
        kind: entry.kind,
        name: entry.name,
        ...(excerpt === undefined ? {} : { excerpt }),
        ...(src === undefined ? {} : { src }),
      };
    });
  } else if (place.kind === "shared") {
    items = [];
  } else if (place.kind === "root" && !searching) {
    items = sections.map((section) => ({
      id: section.id,
      kind: "folder",
      name: section.title,
    }));
  } else if (searching) {
    // Search looks across the whole library, not just the open folder.
    items = toItems(leaves(scopeNodes)).filter(
      (item) =>
        matches(item.name, normalizedQuery) ||
        matches(item.excerpt, normalizedQuery),
    );
  } else {
    items = toItems(locationNodes);
  }

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

  const visibleSkills = searching
    ? skills.filter((skill) =>
        matches(
          `${skill.name} ${skill.description} ${skill.fileName}`,
          normalizedQuery,
        ),
      )
    : skills;

  /* --- Moving around -------------------------------------------------- */

  const goTo = (next: Place) => {
    setPlace(next);
    setDocumentId(undefined);
    setQuery("");
  };

  const goToLocation = ({ sectionId, folderId }: TreeLocation) => {
    setTab("files");
    goTo({ kind: "library", sectionId, ...(folderId ? { folderId } : {}) });
  };

  const open = (id: string) => {
    if (!documentById.has(id)) return;
    const at = home.get(id);
    if (at !== undefined) {
      setTab("files");
      setPlace({ kind: "library", ...at });
    } else {
      setTab("skills");
    }
    setDocumentId(id);
    setQuery("");
  };

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

  const restore = (id: string, entry?: TrashedItem) => {
    const found = entry ?? trash.find((it) => it.id === id);
    if (found === undefined) return;
    setTrash((current) => current.filter((it) => it.id !== id));
    if (!sectionById.has(found.sectionId)) return;
    updateSection(found.sectionId, (nodes) => {
      // If the folder it came from is gone, it lands at the library root.
      const folderId =
        found.folderId !== undefined &&
        findFolder(nodes, found.folderId) !== undefined
          ? found.folderId
          : undefined;
      return found.payload.type === "asset"
        ? insertAsset(nodes, folderId, found.payload.asset)
        : insertNode(nodes, folderId, found.payload.node);
    });
    toast(`Restored “${found.name}”`);
  };

  const moveToTrash = (item: BrowserItem) => {
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
    const payload: TrashedItem["payload"] | undefined =
      asset !== undefined
        ? { type: "asset", asset }
        : node !== undefined
          ? { type: "node", node }
          : undefined;
    if (payload === undefined) return;
    const entry: TrashedItem = {
      id: item.id,
      name: item.name,
      kind: item.kind,
      ...at,
      payload,
    };

    setTrash((current) => [entry, ...current]);
    updateSection(at.sectionId, (nodes) =>
      asset === undefined
        ? mapNodes(nodes, (current) => (current.id === item.id ? null : current))
        : removeAsset(nodes, item.id),
    );
    if (documentId === item.id) setDocumentId(undefined);
    // Trashing the open folder, or one above it, sends you up to the library.
    if (
      place.kind === "library" &&
      place.folderId !== undefined &&
      (place.folderId === item.id ||
        (node?.type === "folder" &&
          findFolder(node.children, place.folderId) !== undefined))
    ) {
      setPlace({ kind: "library", sectionId: at.sectionId });
    }
    toast(`Moved “${item.name}” to trash`, {
      action: {
        label: "Undo",
        onClick: () => {
          restore(item.id, entry);
        },
      },
    });
  };

  const deleteForever = (id: string) => {
    setTrash((current) => current.filter((it) => it.id !== id));
    setDocuments((current) => current.filter((doc) => doc.id !== id));
  };

  const onNewIntent = (intent: NewMenuIntent) => {
    switch (intent) {
      case "folder":
        setDialog({ kind: "new-folder" });
        break;
      case "document":
        createDocument();
        break;
      case "upload-files":
      case "upload-folder":
        toast("Uploads are not part of this prototype");
        break;
    }
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
      case "trash":
        moveToTrash(item);
        break;
      case "restore":
        restore(item.id);
        break;
      case "delete":
        deleteForever(item.id);
        break;
    }
  };

  const actionsFor = (item: BrowserItem): readonly LibraryCardAction[] => {
    if (place.kind === "trash") return TRASH_ACTIONS;
    if (item.kind === "folder") {
      return place.kind === "root" ? [] : FOLDER_ACTIONS;
    }
    return item.kind === "document" ? DOCUMENT_ACTIONS : MEDIA_ACTIONS;
  };

  const pressItem = (item: BrowserItem) => {
    if (place.kind === "trash") return;
    if (item.kind === "folder") {
      if (place.kind === "root") {
        goTo({ kind: "library", sectionId: item.id });
      } else if (place.kind === "library") {
        goTo({ kind: "library", sectionId: place.sectionId, folderId: item.id });
      }
      return;
    }
    if (item.kind === "document") {
      open(item.id);
      return;
    }
    setPreviewId(item.id);
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

  const bodyKey =
    openDocument !== undefined
      ? `doc:${openDocument.id}`
      : tab === "skills"
        ? `skills:${normalizedQuery}`
        : `${place.kind}:${currentSection?.id ?? ""}:${currentFolder?.id ?? ""}:${normalizedQuery}:${filter}:${view}`;

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
      ? "grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-m"
      : "flex flex-col gap-px";

  return (
    <div
      data-slot="files-library"
      className={cn("@container flex min-h-0 flex-1", className)}
    >
      {/* Sidebar: flush, full height, page-white. */}
      <aside
        aria-label="Files navigation"
        className="flex h-full w-64 shrink-0 flex-col gap-m bg-imagine-surface px-s pt-l pb-s"
      >
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
            onIntent={onNewIntent}
            {...(canCreate ? { location: locationTitle } : {})}
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
                {canCreate ? (
                  <DashedAction
                    icon="plus"
                    onClick={() => {
                      setDialog({ kind: "new-folder" });
                    }}
                  >
                    New folder
                  </DashedAction>
                ) : null}
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

        <div className="flex flex-col gap-px border-t border-imagine-border pt-s">
          <RailRow
            icon="share-nodes"
            label="Shared with me"
            selected={tab === "files" && place.kind === "shared"}
            onClick={() => {
              setTab("files");
              goTo({ kind: "shared" });
            }}
          />
          <RailRow
            icon="trash"
            label="Trash"
            selected={tab === "files" && place.kind === "trash"}
            count={trash.length}
            onClick={() => {
              setTab("files");
              goTo({ kind: "trash" });
            }}
          />
        </div>
      </aside>

      {/* Browser */}
      <section
        aria-label="Browser"
        className="flex min-h-0 min-w-0 flex-1 flex-col gap-m px-xxl pt-xl pb-xxl"
      >
        <header className="flex h-9 shrink-0 items-center gap-l">
          <Breadcrumb className="min-w-0 flex-1">
            {tab === "skills" ? (
              <BreadcrumbItem>
                {openDocument === undefined ? (
                  <BreadcrumbPage>Skills</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink
                    onClick={() => {
                      setDocumentId(undefined);
                    }}
                  >
                    Skills
                  </BreadcrumbLink>
                )}
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
            {tab === "files" && place.kind === "shared" ? (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Shared with me</BreadcrumbPage>
                </BreadcrumbItem>
              </>
            ) : null}
            {tab === "files" && place.kind === "trash" ? (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Trash</BreadcrumbPage>
                </BreadcrumbItem>
              </>
            ) : null}
            {tab === "files" && currentSection !== undefined ? (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  {currentFolder === undefined && openDocument === undefined ? (
                    <BreadcrumbPage>{currentSection.title}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink
                      onClick={() => {
                        goTo({ kind: "library", sectionId: currentSection.id });
                      }}
                    >
                      {currentSection.title}
                    </BreadcrumbLink>
                  )}
                  {currentFolder === undefined && openDocument === undefined ? (
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
                  {openDocument === undefined ? (
                    <BreadcrumbPage>{currentFolder.name}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink
                      onClick={() => {
                        goTo({
                          kind: "library",
                          sectionId: currentSection.id,
                          folderId: currentFolder.id,
                        });
                      }}
                    >
                      {currentFolder.name}
                    </BreadcrumbLink>
                  )}
                  {openDocument === undefined && folderMenu.length > 1 ? (
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
            {openDocument === undefined ? null : (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{openDocument.meta.title}</BreadcrumbPage>
                </BreadcrumbItem>
              </>
            )}
          </Breadcrumb>

          {openDocument === undefined ? (
            <>
              <SearchField
                value={query}
                onValueChange={setQuery}
                placeholder={`Search in ${locationTitle}`}
                className="w-64 shrink-0 bg-imagine-surface-raised"
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
                  <ToggleGroupItem value="grid" aria-label="Grid">
                    <Icon name="grip" size="s" />
                  </ToggleGroupItem>
                  <ToggleGroupItem value="list" aria-label="List">
                    <Icon name="list" size="s" />
                  </ToggleGroupItem>
                </ToggleGroup>
              ) : null}
            </>
          ) : (
            <Button
              size="sm"
              variant="soft"
              onClick={() => {
                send({
                  kind: "file",
                  file: { id: openDocument.id, title: openDocument.meta.title },
                });
              }}
            >
              <Icon name="imagine" size="s" data-icon="inline-start" />
              Send to chat
            </Button>
          )}
        </header>

        {openDocument === undefined && tab === "files" ? (
          <div className="flex shrink-0 items-center justify-between gap-l">
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
                    <DropdownMenuRadioItem key={entry.value} value={entry.value}>
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
              {openDocument !== undefined ? (
                <>
                  <div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setDocumentId(undefined);
                      }}
                      className="-ml-2"
                    >
                      <Icon
                        name="arrow-left"
                        size="s"
                        data-icon="inline-start"
                      />
                      Back to {locationTitle}
                    </Button>
                  </div>
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
                  />
                </>
              ) : tab === "skills" ? (
                <>
                  <p className="type-small text-imagine-foreground-muted">
                    Skills are instructions the agent follows. Switch one off
                    to pause it, or open its file to change what it does.
                  </p>
                  {visibleSkills.length === 0 ? (
                    <EmptyState
                      icon="magnifying-glass"
                      title="No skills match"
                      body={`Nothing in skills mentions “${query.trim()}”.`}
                    />
                  ) : (
                    <SkillsList
                      skills={visibleSkills}
                      onToggle={(id, enabled) => {
                        setSkills((current) =>
                          current.map((skill) =>
                            skill.id === id ? { ...skill, enabled } : skill,
                          ),
                        );
                      }}
                      onOpenFile={open}
                    />
                  )}
                </>
              ) : shown.length === 0 && !(canCreate && filter === "all") ? (
                <EmptyState
                  icon={
                    searching
                      ? "magnifying-glass"
                      : place.kind === "trash"
                        ? "trash"
                        : place.kind === "shared"
                          ? "share-nodes"
                          : filter === "images"
                            ? "image"
                            : "folder"
                  }
                  title={
                    searching
                      ? "Nothing matches"
                      : place.kind === "trash"
                        ? "Trash is empty"
                        : place.kind === "shared"
                          ? "Nothing shared yet"
                          : filter === "all"
                            ? "Nothing here"
                            : `No ${filter} here`
                  }
                  body={
                    searching
                      ? `Nothing in ${locationTitle} is named or mentions “${query.trim()}”.`
                      : place.kind === "trash"
                        ? "Files you move to trash stay here until you restore them or delete them for good."
                        : place.kind === "shared"
                          ? "Documents other people share with you will show up here."
                          : "Try another filter, or look in a different folder."
                  }
                  {...(!searching && filter !== "all"
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
                  {folders.length > 0 || (canCreate && !searching && filter === "all") ? (
                    <div className="flex flex-col gap-s">
                      <GroupLabel>
                        {place.kind === "root" ? "Libraries" : "Folders"}
                      </GroupLabel>
                      <Stagger kind="grid" className={gridClass}>
                        {folders.map(renderCard)}
                        {canCreate && !searching && filter === "all" ? (
                          <StaggerItem key="new-folder">
                            <DashedAction
                              shape="tile"
                              className={cn(
                                "h-full min-h-11",
                                view === "list" && "min-h-9 rounded-control",
                              )}
                              onClick={() => {
                                setDialog({ kind: "new-folder" });
                              }}
                            >
                              New folder
                            </DashedAction>
                          </StaggerItem>
                        ) : null}
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
                      Nothing in {locationTitle} yet. Make a folder above, or
                      use New to add a document.
                    </p>
                  ) : null}
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

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
                    moveToTrash(item);
                  }}
                >
                  <Icon name="trash" size="s" data-icon="inline-start" />
                  Move to trash
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
