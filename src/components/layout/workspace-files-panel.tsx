"use client";

import { motion } from "motion/react";

import { useChat } from "@/components/features/agent/chat-provider";
import {
  ChatFileTree,
  type FileSection,
} from "@/components/features/files/file-tree";
import {
  SkillsList,
  type Skill,
} from "@/components/features/files/skills-list";
import {
  FilesPanelCloseButton,
  FilesPanelDragHint,
  FilesPanelFiles,
  FilesPanelFrame,
  FilesPanelHeader,
  FilesPanelSearch,
  FilesPanelSkills,
  FilesPanelTabs,
} from "@/components/layout/files-panel";
import { useWorkspaceEditor } from "@/components/layout/workspace-editor";
import { useWorkspaceFiles } from "@/components/layout/workspace-files";
import { ResizeHandle } from "@/components/ui/resize-handle";
import type { useResizable } from "@/lib/use-resizable";

/** The files column beside the thread, with the workspace's skills behind it. */
export function WorkspaceFilesPanel({
  orgName,
  orgLogoUrl,
  fileSections,
  skills,
  onSkillEnabledChange,
  resize,
}: {
  orgName: string;
  orgLogoUrl?: string;
  fileSections: readonly FileSection[];
  skills: readonly Skill[];
  onSkillEnabledChange: (id: string, enabled: boolean) => void;
  /** Owned above, so a reopened panel is the width it was. */
  resize: ReturnType<typeof useResizable>;
}) {
  const { setFilesPanelOpen, activeFileId, setActiveFileId } =
    useWorkspaceFiles();
  const { activeDocumentId, openDocument } = useWorkspaceEditor();
  const chat = useChat();
  const attachedAssetId = chat.attached
    .flatMap((item) => (item.kind === "asset" ? [item.asset.id] : []))
    .at(-1);

  return (
    <motion.div
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: resize.width, opacity: 1 }}
      exit={{ width: 0, opacity: 0 }}
      transition={resize.transition}
      className="relative flex min-h-0 shrink-0 justify-end overflow-hidden border-l border-imagine-border"
    >
      <ResizeHandle
        edge="start"
        binding={resize.handle}
        dragging={resize.dragging}
        label="Resize files"
      />
      <FilesPanelFrame width={resize.width}>
        <FilesPanelHeader
          title={orgName}
          {...(orgLogoUrl === undefined ? {} : { logoUrl: orgLogoUrl })}
        >
          <FilesPanelCloseButton
            onPress={() => {
              setFilesPanelOpen(false);
            }}
          />
        </FilesPanelHeader>
        <FilesPanelSearch
          sections={fileSections}
          skills={skills}
          onOpenFile={setActiveFileId}
          onOpenAsset={(asset) => {
            chat.attach({ kind: "asset", asset });
          }}
          onOpenSkillFile={openDocument}
        />
        <FilesPanelTabs>
          <FilesPanelFiles>
            <ChatFileTree
              sections={fileSections}
              {...(activeFileId === undefined ? {} : { activeFileId })}
              {...(attachedAssetId === undefined
                ? {}
                : { activeAssetId: attachedAssetId })}
              onOpenFile={setActiveFileId}
              onEditFile={openDocument}
              onAttachFile={(file) => {
                setActiveFileId(file.id);
                chat.attach({ kind: "file", file });
              }}
              onOpenAsset={(asset) => {
                chat.attach({ kind: "asset", asset });
              }}
            />
          </FilesPanelFiles>
          <FilesPanelSkills>
            <SkillsList
              skills={skills}
              {...(activeDocumentId === undefined
                ? {}
                : { openSkillId: activeDocumentId })}
              onToggle={onSkillEnabledChange}
              onOpenFile={openDocument}
            />
          </FilesPanelSkills>
        </FilesPanelTabs>
        <FilesPanelDragHint />
      </FilesPanelFrame>
    </motion.div>
  );
}
