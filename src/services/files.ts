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

interface GroupedFile {
  id: string;
  sourceFile: string;
  content: string;
  usedByAgent: boolean;
}

/** `workspace_search` stores chunks; the UI works with one document per source. */
function groupFiles(rows: readonly WorkspaceFileRow[]): readonly GroupedFile[] {
  const bySource = new Map<string, WorkspaceFileRow[]>();
  for (const row of rows) {
    bySource.set(row.metadata.sourceFile, [
      ...(bySource.get(row.metadata.sourceFile) ?? []),
      row,
    ]);
  }

  return [...bySource.entries()].map(([sourceFile, chunks]) => ({
    id: chunks[0]?.id ?? sourceFile,
    sourceFile,
    content: chunks.map((chunk) => chunk.content).join("\n\n"),
    usedByAgent: chunks.some((chunk) => chunk.metadata.usedAt !== undefined),
  }));
}

const HEADING = /^#{1,6}\s+/;
const BULLET = /^[-*]\s+/;

/**
 * The first lines of prose, as a card preview. Headings and list markers are
 * stripped so the excerpt reads as text, not source.
 */
function excerpt(content: string, lines = 4): string {
  return content
    .split("\n")
    .map((line) => line.trim().replace(HEADING, "").replace(BULLET, ""))
    .filter((line) => line !== "")
    .slice(0, lines)
    .join("\n");
}

/** Files at the root, then a folder per directory. One level is enough here. */
function toNodes(rows: readonly GroupedFile[]): readonly FileNode[] {
  const folders = new Map<string, FileNode[]>();
  const root: FileNode[] = [];

  for (const row of rows) {
    const node: FileNode = {
      type: "file",
      id: row.id,
      name: fileName(row.sourceFile),
      excerpt: excerpt(row.content),
      ...(row.usedByAgent ? { usedByAgent: true } : {}),
    };
    const folder = directory(row.sourceFile);
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
  const clients = db.app.clients.map(transformClientRow);
  const companyNodes = clients
    .filter((client) => client.isCompany)
    .flatMap<FileNode>((client) => {
      const clientFiles = groupFiles(
        files.filter(
          (file) =>
            file.metadata.orgId === org.id &&
            file.metadata.clientId === client.id,
        ),
      );
      const assets = getClientAssets(client.id);
      return [
        ...toNodes(clientFiles),
        ...(assets.length === 0
          ? []
          : [
              {
                type: "assets" as const,
                id: `assets:${client.id}`,
                name: "Assets",
                assets: assets.map(toAssetTile),
              },
            ]),
      ];
    });

  const orgSection: FileSection = {
    id: org.id,
    title: org.name,
    kind: "organization",
    nodes: [
      ...toNodes(
        groupFiles(
          files.filter(
            (row) =>
              row.metadata.orgId === org.id &&
              row.metadata.clientId === undefined,
          ),
        ),
      ),
      ...companyNodes,
    ],
  };

  const personSections = clients.flatMap<FileSection>((client) => {
    if (client.isCompany) return [];
    const clientFiles = groupFiles(
      files.filter(
        (file) =>
          file.metadata.orgId === org.id &&
          file.metadata.clientId === client.id,
      ),
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
        kind: "person",
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

/** Every workspace and skill file, grouped and ready for the editor. */
export function getDocuments(): readonly OpenDocument[] {
  const db = getDb();
  const org = getOrganization();
  return [
    ...groupFiles(
      db.mastra.workspace_search.filter((row) => row.metadata.orgId === org.id),
    ).map((file) => ({
      id: file.id,
      meta: { title: fileName(file.sourceFile) },
      value: file.content,
    })),
    ...db.mastra.mastra_skills.map((skill) => ({
      id: skill.id,
      meta: { title: skill.file_name },
      value: skill.content,
    })),
  ];
}

/** A workspace file or a skill file, ready for the editor. */
export function getDocument(id: string): OpenDocument | null {
  return getDocuments().find((document) => document.id === id) ?? null;
}
