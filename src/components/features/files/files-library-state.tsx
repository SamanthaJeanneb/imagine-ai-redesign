"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import type { FileSection } from "@/components/features/files/file-tree";
import type { TreeLocation } from "@/components/features/files/file-tree-nav";
import type {
  Filter,
  Place,
  Sort,
  Tab,
} from "@/components/features/files/files-library-types";
import type { LibraryCardView } from "@/components/features/files/library-card";
import { useDocumentDrafts } from "@/lib/use-document-drafts";
import { MOBILE_QUERY, useMediaQuery } from "@/lib/use-media-query";

/* ------------------------------------------------------------------------ */
/* What is open over the browser                                            */
/* ------------------------------------------------------------------------ */

export interface FilesEditorState {
  /** The document in the sheet over the browser. */
  documentId: string | undefined;
  /** The image or video in the preview dialog. */
  previewId: string | undefined;
  drafts: ReturnType<typeof useDocumentDrafts>;
  show: (id: string) => void;
  close: () => void;
  preview: (id: string) => void;
  closePreview: () => void;
}

const FilesEditorContext = createContext<FilesEditorState | null>(null);

/**
 * The sheet and the preview sit above everything else in the library so that
 * navigating, deleting, and the tree can all put a document away without
 * reaching back down into the sheet to do it.
 */
export function FilesEditorProvider({ children }: { children: ReactNode }) {
  const [documentId, setDocumentId] = useState<string>();
  const [previewId, setPreviewId] = useState<string>();
  const drafts = useDocumentDrafts();

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

  return (
    <FilesEditorContext
      value={{
        documentId,
        previewId,
        drafts,
        show: setDocumentId,
        close: () => {
          setDocumentId(undefined);
        },
        preview: setPreviewId,
        closePreview: () => {
          setPreviewId(undefined);
        },
      }}
    >
      {children}
    </FilesEditorContext>
  );
}

export function useFilesEditor(): FilesEditorState {
  const editor = useContext(FilesEditorContext);
  if (editor === null) {
    throw new Error("useFilesEditor needs a FilesEditorProvider above it");
  }
  return editor;
}

/* ------------------------------------------------------------------------ */
/* Where the browser is looking, and how it is arranged                     */
/* ------------------------------------------------------------------------ */

export interface FilesBrowseState {
  tab: Tab;
  place: Place;
  query: string;
  filter: Filter;
  sort: Sort;
  view: LibraryCardView;
  /** Whether the rail is showing, which only matters on a phone. */
  navOpen: boolean;
  /** Under `md` the rail is a drawer and the editor rises from the bottom. */
  isMobile: boolean;
  setTab: (tab: Tab) => void;
  /** The sheet covers the browser, so going somewhere closes it. */
  goTo: (place: Place) => void;
  goToLocation: (location: TreeLocation) => void;
  /** Move the browser without disturbing the search or the open document. */
  setPlace: (place: Place) => void;
  setQuery: (query: string) => void;
  setFilter: (filter: Filter) => void;
  setSort: (sort: Sort) => void;
  setView: (view: LibraryCardView) => void;
  openNav: () => void;
  closeNav: () => void;
}

const FilesBrowseContext = createContext<FilesBrowseState | null>(null);

export function FilesBrowseProvider({
  sections,
  children,
}: {
  /** Only the first library is read: it is where the browser opens. */
  sections: readonly FileSection[];
  children: ReactNode;
}) {
  const editor = useFilesEditor();
  const [tab, setTabState] = useState<Tab>("files");
  const [place, setPlace] = useState<Place>(() => {
    const first = sections[0];
    return first === undefined
      ? { kind: "root" }
      : { kind: "library", sectionId: first.id };
  });
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<Sort>("name-asc");
  const [view, setView] = useState<LibraryCardView>("list");
  const [navOpen, setNavOpen] = useState(false);
  const isMobile = useMediaQuery(MOBILE_QUERY);

  const goTo = (next: Place) => {
    setPlace(next);
    editor.close();
    setQuery("");
  };

  const setTab = (next: Tab) => {
    setTabState(next);
    editor.close();
    setQuery("");
  };

  return (
    <FilesBrowseContext
      value={{
        tab,
        place,
        query,
        filter,
        sort,
        view,
        navOpen,
        isMobile,
        setTab,
        goTo,
        goToLocation: ({ sectionId, folderId }) => {
          setTab("files");
          goTo({
            kind: "library",
            sectionId,
            ...(folderId ? { folderId } : {}),
          });
          setNavOpen(false);
        },
        setPlace,
        setQuery,
        setFilter,
        setSort,
        setView,
        openNav: () => {
          setNavOpen(true);
        },
        closeNav: () => {
          setNavOpen(false);
        },
      }}
    >
      {children}
    </FilesBrowseContext>
  );
}

export function useFilesBrowse(): FilesBrowseState {
  const browse = useContext(FilesBrowseContext);
  if (browse === null) {
    throw new Error("useFilesBrowse needs a FilesBrowseProvider above it");
  }
  return browse;
}
