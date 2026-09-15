"use client";

import { createContext, type ReactNode, useContext, useState } from "react";

import { FilesPanelApiProvider } from "@/components/layout/files-panel";
import { useWorkspaceNav } from "@/components/layout/workspace-nav";

interface WorkspaceFilesState {
  filesPanelOpen: boolean;
  setFilesPanelOpen: (open: boolean) => void;
  /** Whether the panel has a row to open into on this route. */
  panelOpen: boolean;
  activeFileId: string | undefined;
  setActiveFileId: (id: string) => void;
}

const WorkspaceFilesContext = createContext<WorkspaceFilesState | null>(null);

export function useWorkspaceFiles(): WorkspaceFilesState {
  const context = useContext(WorkspaceFilesContext);
  if (context === null) {
    throw new Error(
      "useWorkspaceFiles must be used inside WorkspaceFilesProvider",
    );
  }
  return context;
}

/**
 * Whether the files panel is open and which file the tree has selected, both
 * of which outlive the panel. It sits above the chrome because tucking the
 * rail away is one of the things opening the panel does, and above the editor
 * because opening a document selects the file behind it.
 */
export function WorkspaceFilesProvider({ children }: { children: ReactNode }) {
  const { activeKey, docked } = useWorkspaceNav();
  const [filesPanelOpen, setFilesPanelOpen] = useState(false);
  const [activeFileId, setActiveFileId] = useState<string>();

  return (
    <FilesPanelApiProvider
      open={() => {
        setFilesPanelOpen(true);
      }}
      close={() => {
        setFilesPanelOpen(false);
      }}
    >
      <WorkspaceFilesContext
        value={{
          filesPanelOpen,
          setFilesPanelOpen,
          panelOpen: filesPanelOpen && (activeKey === "agent" || docked),
          activeFileId,
          setActiveFileId,
        }}
      >
        {children}
      </WorkspaceFilesContext>
    </FilesPanelApiProvider>
  );
}
