"use client";

import { cn } from "cn";
import { AnimatePresence, motion } from "motion/react";
import { createContext, type ReactNode, useContext, useState } from "react";

import { useChat } from "@/components/features/agent/chat-provider";
import {
  EditorSheetInset,
  EditorTabStrip,
  type EditorTab,
} from "@/components/features/files/editor-tab-strip";
import { MarkdownEditor } from "@/components/features/files/markdown-editor";
import { useWorkspaceFiles } from "@/components/layout/workspace-files";
import { useWorkspaceNav } from "@/components/layout/workspace-nav";
import { useDocumentDrafts } from "@/lib/use-document-drafts";
import type { OpenDocument } from "@/services/files";
import { fade } from "@/styles/motion";

const WORKSPACE_TAB_ID = "workspace";

interface WorkspaceEditorState {
  documents: readonly OpenDocument[];
  openDocumentIds: readonly string[];
  activeEditorId: string;
  /** The document showing, or nothing while the chat tab is the active one. */
  activeDocumentId: string | undefined;
  /** Whether the tab strip has anything to show on this route. */
  documentsOpen: boolean;
  setActiveEditorId: (id: string) => void;
  openDocument: (id: string) => void;
  closeDocument: (id: string) => void;
  drafts: ReturnType<typeof useDocumentDrafts>;
}

const WorkspaceEditorContext = createContext<WorkspaceEditorState | null>(null);

export function useWorkspaceEditor(): WorkspaceEditorState {
  const context = useContext(WorkspaceEditorContext);
  if (context === null) {
    throw new Error(
      "useWorkspaceEditor must be used inside WorkspaceEditorProvider",
    );
  }
  return context;
}

/**
 * The documents the workspace has open over the thread, and the drafts typed
 * into them. Both outlive the tab strip, which is gone from every route but
 * the agent's.
 */
export function WorkspaceEditorProvider({
  documents,
  children,
}: {
  documents: readonly OpenDocument[];
  children: ReactNode;
}) {
  const { activeKey } = useWorkspaceNav();
  const { setActiveFileId } = useWorkspaceFiles();
  const [openDocumentIds, setOpenDocumentIds] = useState<readonly string[]>([]);
  const [activeEditorId, setActiveEditorId] = useState(WORKSPACE_TAB_ID);
  const drafts = useDocumentDrafts();

  function openDocument(id: string) {
    if (!documents.some((document) => document.id === id)) return;
    setActiveFileId(id);
    setOpenDocumentIds((current) =>
      current.includes(id) ? current : [...current, id],
    );
    setActiveEditorId(id);
  }

  function closeDocument(id: string) {
    setOpenDocumentIds((current) => current.filter((open) => open !== id));
    if (activeEditorId === id) setActiveEditorId(WORKSPACE_TAB_ID);
  }

  return (
    <WorkspaceEditorContext
      value={{
        documents,
        openDocumentIds,
        activeEditorId,
        activeDocumentId:
          activeEditorId === WORKSPACE_TAB_ID ? undefined : activeEditorId,
        documentsOpen: activeKey === "agent" && openDocumentIds.length > 0,
        setActiveEditorId,
        openDocument,
        closeDocument,
        drafts,
      }}
    >
      {children}
    </WorkspaceEditorContext>
  );
}

/** The open document, under the tab strip and over the thread. */
function WorkspaceEditorSheet({ document }: { document: OpenDocument }) {
  const { drafts } = useWorkspaceEditor();
  return (
    <EditorSheetInset>
      <AnimatePresence initial={false} mode="wait">
        <motion.div
          key={document.id}
          initial={{ opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -8 }}
          transition={fade.fast}
          className="min-h-0 w-full min-w-0 flex-1 overflow-y-auto"
        >
          <MarkdownEditor
            meta={document.meta}
            value={drafts.valueOf(document)}
            savedValue={drafts.savedValueOf(document)}
            onValueChange={(value) => {
              drafts.change(document, value);
            }}
            onSave={() => {
              drafts.save(document);
            }}
            className="mx-auto p-xxl"
          />
        </motion.div>
      </AnimatePresence>
    </EditorSheetInset>
  );
}

/** The tab strip over the page, and the document it has open. */
export function WorkspaceEditorLayer() {
  const {
    documents,
    openDocumentIds,
    activeEditorId,
    activeDocumentId,
    setActiveEditorId,
    closeDocument,
    drafts,
  } = useWorkspaceEditor();
  const chat = useChat();
  const activeDocument =
    activeDocumentId === undefined
      ? undefined
      : documents.find((document) => document.id === activeDocumentId);
  const editorTabs: readonly EditorTab[] = openDocumentIds.flatMap((id) => {
    const document = documents.find((candidate) => candidate.id === id);
    return document === undefined
      ? []
      : [{ id, label: document.meta.title, dirty: drafts.isDirty(document) }];
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={fade.fast}
      data-slot="workspace-editor"
      className={cn(
        // The page's own inset, so the tab strip lines up with the column.
        "pointer-events-none absolute inset-x-0 top-0 z-20 px-page",
        activeDocument !== undefined && "bg-imagine-surface",
        activeDocument !== undefined &&
          (chat.attached.length === 0 ? "bottom-28" : "bottom-48"),
      )}
    >
      <EditorTabStrip
        home={{ id: WORKSPACE_TAB_ID, label: "Current chat" }}
        tabs={editorTabs}
        activeId={activeEditorId}
        onActivate={setActiveEditorId}
        onClose={closeDocument}
        className={cn(
          "pointer-events-auto",
          activeDocument !== undefined && "h-full",
        )}
      >
        {activeDocument === undefined ? null : (
          <WorkspaceEditorSheet document={activeDocument} />
        )}
      </EditorTabStrip>
    </motion.div>
  );
}
