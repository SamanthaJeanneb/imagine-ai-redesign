"use client";

import { createContext, type ReactNode, useContext, useState } from "react";

import type { FileSection } from "@/components/features/files/file-tree";
import type { Skill } from "@/components/features/files/skills-list";
import { FilesPanelApiProvider } from "@/components/layout/files-panel";
import { useWorkspaceNav } from "@/components/layout/workspace-nav";
import { useResizable } from "@/lib/use-resizable";

interface WorkspaceFilesState {
  orgName: string;
  orgLogoUrl: string | undefined;
  fileSections: readonly FileSection[];
  filesPanelOpen: boolean;
  setFilesPanelOpen: (open: boolean) => void;
  /** Whether the panel has a row to open into on this route. */
  panelOpen: boolean;
  skills: readonly Skill[];
  setSkillEnabled: (id: string, enabled: boolean) => void;
  activeFileId: string | undefined;
  setActiveFileId: (id: string) => void;
  /** The panel's width, kept here so a reopened panel is the width it was. */
  resize: ReturnType<typeof useResizable>;
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
 * The files the thread can reach: what the panel holds, whether it is open,
 * and which file the tree has selected. It sits above the chrome because
 * tucking the rail away is one of the things opening the panel does.
 */
export function WorkspaceFilesProvider({
  orgName,
  orgLogoUrl,
  fileSections,
  skills: initialSkills,
  children,
}: {
  orgName: string;
  orgLogoUrl?: string;
  fileSections: readonly FileSection[];
  skills: readonly Skill[];
  children: ReactNode;
}) {
  const { activeKey, docked } = useWorkspaceNav();
  const [filesPanelOpen, setFilesPanelOpen] = useState(false);
  const [skills, setSkills] = useState(initialSkills);
  const [activeFileId, setActiveFileId] = useState<string>();
  const resize = useResizable({
    defaultWidth: 400,
    min: 264,
    max: 560,
    edge: "start",
  });

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
          orgName,
          orgLogoUrl,
          fileSections,
          filesPanelOpen,
          setFilesPanelOpen,
          panelOpen: filesPanelOpen && (activeKey === "agent" || docked),
          skills,
          setSkillEnabled(id, enabled) {
            setSkills((current) =>
              current.map((skill) =>
                skill.id === id ? { ...skill, enabled } : skill,
              ),
            );
          },
          activeFileId,
          setActiveFileId,
          resize,
        }}
      >
        {children}
      </WorkspaceFilesContext>
    </FilesPanelApiProvider>
  );
}
