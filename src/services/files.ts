import type {
  FileNode,
  FileSection,
} from "@/components/features/files/file-tree";
import type { DocumentMeta } from "@/components/features/files/markdown-editor";
import type { Skill } from "@/components/features/files/skills-list";
import { transformClientRow } from "@/entities/client";
import type { WorkspaceFileRow } from "@/entities/rows";
import { getDb, getOrganization } from "@/mocks/db";
import { getClientAssets, toAssetTile } from "@/services/posts";

export interface OpenDocument {
  id: string;
  meta: DocumentMeta;
  /** Markdown source. */
  value: string;
}

function fileName(sourceFile: string): string {
  return sourceFile.split("/").at(-1) ?? sourceFile;
}

function directory(sourceFile: string): string {
  const parts = sourceFile.split("/");
  return parts.length > 1 ? parts.slice(0, -1).join("/") : "";
}

/** Files at the root, then a folder per directory. One level is enough here. */
function toNodes(rows: readonly WorkspaceFileRow[]): readonly FileNode[] {
  const folders = new Map<string, FileNode[]>();
  const root: FileNode[] = [];

  for (const row of rows) {
    const node: FileNode = {
      type: "file",
      id: row.id,
      name: fileName(row.metadata.sourceFile),
    };
    const folder = directory(row.metadata.sourceFile);
    if (folder === "") {
      root.push(node);
      continue;
    }
    folders.set(folder, [...(folders.get(folder) ?? []), node]);
  }

  return [
    ...[...folders.entries()].map<FileNode>(([name, children]) => ({
      type: "folder",
      id: `folder:${name}`,
      name,
      children,
    })),
    ...root,
  ];
}

/**
 * Files panel. `workspace_search` rows grouped by `metadata.sourceFile`: rows
 * without a `clientId` are the org's, the rest sit under the person they belong
 * to, followed by that person's uploaded assets.
 */
export function getFileSections(): readonly FileSection[] {
  const db = getDb();
  const org = getOrganization();
  const files = db.mastra.workspace_search;

  const orgSection: FileSection = {
    id: org.id,
    title: org.name,
    kind: "organization",
    nodes: toNodes(files.filter((row) => row.metadata.clientId === undefined)),
  };

  const personSections = db.app.clients.flatMap<FileSection>((row) => {
    const client = transformClientRow(row);
    const clientFiles = files.filter(
      (file) => file.metadata.clientId === client.id,
    );
    const clientAssets = getClientAssets(client.id);
    if (clientFiles.length === 0 && clientAssets.length === 0) return [];

    const assetNode: readonly FileNode[] =
      clientAssets.length === 0
        ? []
        : [
            {
              type: "assets",
              id: `assets:${client.id}`,
              name: "Assets",
              assets: clientAssets.map(toAssetTile),
            },
          ];

    return [
      {
        id: client.id,
        title: client.name,
        kind: client.isCompany ? "organization" : "person",
        ...(client.profilePicturePath === null
          ? {}
          : { avatarUrl: client.profilePicturePath }),
        nodes: [...toNodes(clientFiles), ...assetNode],
      },
    ];
  });

  return [orgSection, ...personSections];
}

/** Files panel, Skills tab. Each skill is a markdown file the user can edit. */
export function getSkills(): readonly Skill[] {
  return getDb().mastra.mastra_skills.map((skill) => ({
    id: skill.id,
    name: skill.name,
    description: skill.description,
    enabled: skill.enabled,
    fileName: skill.file_name,
  }));
}

/** A workspace file or a skill file, ready for the editor. */
export function getDocument(id: string): OpenDocument | null {
  const db = getDb();

  const file = db.mastra.workspace_search.find((row) => row.id === id);
  if (file !== undefined) {
    return {
      id: file.id,
      meta: { title: fileName(file.metadata.sourceFile) },
      value: file.content,
    };
  }

  const skill = db.mastra.mastra_skills.find((row) => row.id === id);
  if (skill !== undefined) {
    return {
      id: skill.id,
      meta: { title: skill.file_name },
      value: skill.content,
    };
  }

  return null;
}
