"use client";

import { createContext, useContext, useRef, useState } from "react";
import type { DragEvent, ReactNode } from "react";
import { toast } from "sonner";

import type { AssetTileData } from "@/components/features/files/asset-tile";
import {
  canMoveLibraryItem,
  fileMoveId,
  isFileMove,
  isLeavingDropTarget,
  moveLibraryItem,
  preventFileMove,
  beginFileMove,
  endFileMove,
  type FileMoveDest,
} from "@/components/features/files/file-move";
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
  type FolderNode,
} from "@/components/features/files/file-tree-ops";
import {
  useFilesBrowse,
  useFilesEditor,
} from "@/components/features/files/files-library-state";
import type {
  BrowserItem,
  DialogState,
  ItemHome,
  RemovedItem,
} from "@/components/features/files/files-library-types";
import type { DraggableResource } from "@/components/features/files/resource-drag";
import type { Skill } from "@/components/features/files/skills-list";
import type { OpenDocument } from "@/services/files";

type MoveHandler = (event: DragEvent<HTMLElement>) => void;

export interface FilesLibraryState {
  /** Workspace name, the organization library's title. */
  title: string;
  sections: readonly FileSection[];
  skills: readonly Skill[];
  documentById: ReadonlyMap<string, OpenDocument>;
  assetById: ReadonlyMap<string, AssetTileData>;
  sectionById: ReadonlyMap<string, FileSection>;
  /** Every leaf and folder, keyed by id, with its library and parent folder. */
  home: ReadonlyMap<string, ItemHome>;
  currentSection: FileSection | undefined;
  currentFolder: FolderNode | undefined;
  /** What the place is called: the folder, else the library, else the tab. */
  locationTitle: string;
  canCreate: boolean;
  dialog: DialogState;
  pendingDelete: BrowserItem | null;
  draggingId: string | null;
  dropTargetId: string | null;
  /** Documents open over the browser, so the location underneath stays put. */
  open: (id: string) => void;
  press: (item: BrowserItem) => void;
  /** A search hit: folders become the location, the rest open. */
  openResult: (id: string) => void;
  send: (resource: DraggableResource) => void;
  sendItem: (item: BrowserItem) => void;
  createDocument: () => void;
  createFolder: (name: string) => void;
  rename: (id: string, name: string) => void;
  toggleSkill: (id: string, enabled: boolean) => void;
  move: (itemId: string, dest: FileMoveDest) => void;
  askNewFolder: () => void;
  askRename: (item: BrowserItem) => void;
  closeDialog: () => void;
  askRemove: (item: BrowserItem) => void;
  cancelRemove: () => void;
  confirmRemove: () => void;
  startMove: (item: BrowserItem, event: DragEvent<HTMLElement>) => void;
  endMove: () => void;
  overMoveDest: (dest: FileMoveDest, key: string) => MoveHandler;
  leaveMoveDest: (key: string) => MoveHandler;
  dropMoveDest: (dest: FileMoveDest) => MoveHandler;
}

const FilesLibraryContext = createContext<FilesLibraryState | null>(null);

function slug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

interface FilesLibraryProviderProps {
  title: string;
  sections: readonly FileSection[];
  skills: readonly Skill[];
  documents: readonly OpenDocument[];
  /** Attach the resource to the chat and go there. Omit to hide the action. */
  onSendToChat?: (resource: DraggableResource) => void;
  children: ReactNode;
}

/**
 * The library itself: the tree, the skills, the open documents, and every
 * change that can be made to them. It sits below the view state so that
 * deleting the open document, or the folder being browsed, can put both back
 * somewhere sensible.
 */
export function FilesLibraryProvider({
  title,
  sections: initialSections,
  skills: initialSkills,
  documents: initialDocuments,
  onSendToChat,
  children,
}: FilesLibraryProviderProps) {
  const browse = useFilesBrowse();
  const editor = useFilesEditor();
  const { place, tab } = browse;
  const { documentId, previewId } = editor;

  const [sections, setSections] = useState(initialSections);
  const [skills, setSkills] = useState(initialSkills);
  const [documents, setDocuments] = useState(initialDocuments);
  const [dialog, setDialog] = useState<DialogState>(null);
  const [pendingDelete, setPendingDelete] = useState<BrowserItem | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  // Ids for things made here; only ever read inside event handlers.
  const counter = useRef(0);
  const nextId = () => {
    counter.current += 1;
    return String(counter.current);
  };

  /* --- Where things live ---------------------------------------------- */

  const sectionById = new Map(sections.map((section) => [section.id, section]));
  const documentById = new Map(documents.map((doc) => [doc.id, doc]));
  const home = new Map<string, ItemHome>();
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

  const locationTitle =
    tab === "skills"
      ? "Skills"
      : place.kind === "root"
        ? "Files"
        : (currentFolder?.name ?? currentSection?.title ?? title);

  const canCreate =
    tab === "files" && place.kind === "library" && currentSection !== undefined;

  /* --- Moving around -------------------------------------------------- */

  const open = (id: string) => {
    if (!documentById.has(id)) return;
    editor.show(id);
    browse.closeNav();
  };

  const send = (resource: DraggableResource) => {
    if (onSendToChat === undefined) {
      toast("Chat is not connected in this preview");
      return;
    }
    onSendToChat(resource);
  };

  const press = (item: BrowserItem) => {
    if (item.kind === "folder") {
      if (place.kind === "root") {
        browse.goTo({ kind: "library", sectionId: item.id });
      } else {
        browse.goTo({
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
    editor.preview(item.id);
  };

  const openResult = (id: string) => {
    browse.setQuery("");
    if (tab === "skills" || documentById.has(id)) {
      open(id);
      return;
    }
    const at = home.get(id);
    if (assetById.has(id)) {
      editor.preview(id);
    } else if (at !== undefined) {
      browse.goTo({ kind: "library", sectionId: at.sectionId, folderId: id });
    }
  };

  const sendItem = (item: BrowserItem) => {
    if (item.kind === "document") {
      send({ kind: "file", file: { id: item.id, title: item.name } });
      return;
    }
    const asset = assetById.get(item.id);
    if (asset !== undefined) send({ kind: "asset", asset });
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
    editor.show(id);
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
    if (documentId === item.id) editor.close();
    if (previewId === item.id) editor.closePreview();
    // Deleting the open folder, or one above it, sends you up to the library.
    if (
      place.kind === "library" &&
      place.folderId !== undefined &&
      (place.folderId === item.id ||
        (node?.type === "folder" &&
          findFolder(node.children, place.folderId) !== undefined))
    ) {
      browse.setPlace({ kind: "library", sectionId: at.sectionId });
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

  const move = (itemId: string, dest: FileMoveDest) => {
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
      move(id, dest);
    };

  return (
    <FilesLibraryContext
      value={{
        title,
        sections,
        skills,
        documentById,
        assetById,
        sectionById,
        home,
        currentSection,
        currentFolder,
        locationTitle,
        canCreate,
        dialog,
        pendingDelete,
        draggingId,
        dropTargetId,
        open,
        press,
        openResult,
        send,
        sendItem,
        createDocument,
        createFolder,
        rename,
        toggleSkill: (id, enabled) => {
          setSkills((current) =>
            current.map((skill) =>
              skill.id === id ? { ...skill, enabled } : skill,
            ),
          );
        },
        move,
        askNewFolder: () => {
          setDialog({ kind: "new-folder" });
        },
        askRename: (item) => {
          setDialog({ kind: "rename", id: item.id, name: item.name });
        },
        closeDialog: () => {
          setDialog(null);
        },
        askRemove: setPendingDelete,
        cancelRemove: () => {
          setPendingDelete(null);
        },
        confirmRemove: () => {
          if (pendingDelete === null) return;
          remove(pendingDelete);
          setPendingDelete(null);
        },
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
      }}
    >
      {children}
    </FilesLibraryContext>
  );
}

export function useFilesLibrary(): FilesLibraryState {
  const library = useContext(FilesLibraryContext);
  if (library === null) {
    throw new Error("useFilesLibrary needs a FilesLibraryProvider above it");
  }
  return library;
}
