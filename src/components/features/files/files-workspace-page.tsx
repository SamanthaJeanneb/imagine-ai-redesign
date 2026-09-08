"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

import {
  AssetTile,
  type AssetTileData,
} from "@/components/features/files/asset-tile";
import type { FileSection } from "@/components/features/files/file-tree";
import { MarkdownEditor } from "@/components/features/files/markdown-editor";
import type { Skill } from "@/components/features/files/skills-list";
import { FilesPanel } from "@/components/layout/files-panel";
import { Icon } from "@/components/ui/icon";
import type { OpenDocument } from "@/services/files";
import { fade } from "@/styles/motion";

interface FilesWorkspacePageProps {
  title: string;
  logoUrl?: string;
  sections: readonly FileSection[];
  skills: readonly Skill[];
  documents: readonly OpenDocument[];
}

type Selection =
  { kind: "document"; id: string } | { kind: "asset"; asset: AssetTileData };

/**
 * Full-page Files route. The searchable tree is the same one the chat opens;
 * the wider right side previews and edits the selected markdown or asset.
 */
export function FilesWorkspacePage({
  title,
  logoUrl,
  sections,
  skills: initialSkills,
  documents,
}: FilesWorkspacePageProps) {
  const [skills, setSkills] = useState(initialSkills);
  const [selection, setSelection] = useState<Selection | null>(() => {
    const first = documents[0];
    return first === undefined ? null : { kind: "document", id: first.id };
  });
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      documents.map((document) => [document.id, document.value]),
    ),
  );
  const [savedValues, setSavedValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      documents.map((document) => [document.id, document.value]),
    ),
  );
  const activeDocument =
    selection?.kind === "document"
      ? documents.find((document) => document.id === selection.id)
      : undefined;

  const openDocument = (id: string) => {
    if (documents.some((document) => document.id === id)) {
      setSelection({ kind: "document", id });
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-xl">
      <h1 className="type-title">Files</h1>
      <div className="flex min-h-0 flex-1 overflow-hidden border border-imagine-border bg-imagine-surface">
        <FilesPanel
          title={title}
          {...(logoUrl === undefined ? {} : { logoUrl })}
          sections={sections}
          skills={skills}
          {...(selection?.kind === "document"
            ? { activeFileId: selection.id }
            : {})}
          {...(selection?.kind === "asset"
            ? { activeAssetId: selection.asset.id }
            : {})}
          onOpenFile={openDocument}
          onEditFile={openDocument}
          onOpenAsset={(asset) => {
            setSelection({ kind: "asset", asset });
          }}
          onToggleSkill={(id, enabled) => {
            setSkills((current) =>
              current.map((skill) =>
                skill.id === id ? { ...skill, enabled } : skill,
              ),
            );
          }}
          onOpenSkillFile={openDocument}
          assetSize="default"
          {...(selection?.kind === "document"
            ? { openSkillId: selection.id }
            : {})}
          className="w-96 border-r border-imagine-border bg-imagine-surface-raised"
        />

        <div className="relative min-h-0 min-w-0 flex-1 overflow-hidden">
          <AnimatePresence initial={false} mode="wait">
            {activeDocument !== undefined ? (
              <motion.div
                key={activeDocument.id}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={fade.fast}
                className="absolute inset-0 overflow-y-auto p-xxl"
              >
                <MarkdownEditor
                  meta={activeDocument.meta}
                  value={values[activeDocument.id] ?? activeDocument.value}
                  savedValue={
                    savedValues[activeDocument.id] ?? activeDocument.value
                  }
                  onValueChange={(value) => {
                    setValues((current) => ({
                      ...current,
                      [activeDocument.id]: value,
                    }));
                  }}
                  onSave={() => {
                    setSavedValues((current) => ({
                      ...current,
                      [activeDocument.id]:
                        values[activeDocument.id] ?? activeDocument.value,
                    }));
                  }}
                />
              </motion.div>
            ) : selection?.kind === "asset" ? (
              <motion.div
                key={selection.asset.id}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={fade.fast}
                className="absolute inset-0 flex items-center justify-center p-xxl"
              >
                <div className="flex w-full max-w-sm flex-col gap-m">
                  <AssetTile asset={selection.asset} />
                  <span className="type-small font-medium">
                    {selection.asset.caption ?? "Untitled asset"}
                  </span>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={fade.fast}
                className="absolute inset-0 flex flex-col items-center justify-center gap-m text-imagine-foreground-muted"
              >
                <Icon name="folder" size="xl" />
                <p className="type-small">Choose a file or asset to preview.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
